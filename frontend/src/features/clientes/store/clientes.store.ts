// Estado da conta corrente em modo demonstração.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { aplicarPagamento, contaBloqueada, resumirCobranca, validarPagamento } from '../logica/clientes'
import { CLIENTES_MOCK, EXTRATO_MOCK } from '../mock/clientes.mock'
import type { Cliente, LancamentoFiado, ReservaCliente } from '../tipos'

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T
}

export interface DadosNovoCliente {
  nome: string
  telefone?: string
  endereco?: string
  aniversario?: string
  limite: number
}

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>(clonar(CLIENTES_MOCK))
  const extrato = ref<LancamentoFiado[]>(clonar(EXTRATO_MOCK))
  const reservas = ref<ReservaCliente[]>([])

  const resumo = computed(() => resumirCobranca(clientes.value))
  const devedores = computed(() =>
    [...clientes.value].filter((c) => c.saldo > 0).sort((a, b) => b.saldo - a.saldo),
  )

  function buscar(termo: string): Cliente[] {
    const busca = termo.trim().toLowerCase()
    if (!busca) return clientes.value
    return clientes.value.filter(
      (c) =>
        c.nome.toLowerCase().includes(busca) ||
        c.telefone?.replace(/\D/g, '').includes(busca.replace(/\D/g, '')),
    )
  }

  function extratoDoCliente(clienteId: string): LancamentoFiado[] {
    return extrato.value
      .filter((l) => l.clienteId === clienteId)
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
  }

  function cadastrarCliente(dados: DadosNovoCliente, operador: string): Cliente {
    const nome = dados.nome.trim()
    if (!nome) throw new Error('Nome é obrigatório.')
    if (!(dados.limite > 0)) throw new Error('Limite deve ser maior que zero.')
    if (!operador.trim()) throw new Error('Operador é obrigatório para auditoria.')
    if (clientes.value.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      throw new Error('Já existe um cliente com este nome.')
    }
    const cliente: Cliente = {
      id: `cli-${crypto.randomUUID()}`,
      nome,
      telefone: dados.telefone?.trim() || undefined,
      endereco: dados.endereco?.trim() || undefined,
      aniversario: dados.aniversario || undefined,
      limite: Math.round(dados.limite * 100) / 100,
      saldo: 0,
      ativo: true,
      criadoEm: new Date().toISOString(),
    }
    clientes.value.push(cliente)
    return cliente
  }

  function ajustarLimite(clienteId: string, novoLimite: number): void {
    const cliente = clientes.value.find((c) => c.id === clienteId)
    if (!cliente) throw new Error('Cliente não encontrado.')
    if (!(novoLimite > 0)) throw new Error('Limite deve ser maior que zero.')
    if (novoLimite < cliente.saldo) throw new Error('Limite não pode ficar abaixo do saldo em aberto.')
    cliente.limite = Math.round(novoLimite * 100) / 100
  }

  function alternarAtivo(clienteId: string): void {
    const cliente = clientes.value.find((c) => c.id === clienteId)
    if (!cliente) throw new Error('Cliente não encontrado.')
    cliente.ativo = !cliente.ativo
  }

  /** Quitação parcial ou total — reduz o saldo e registra no extrato. */
  function quitar(clienteId: string, valor: number, operador: string, observacao?: string): LancamentoFiado {
    const cliente = clientes.value.find((c) => c.id === clienteId)
    if (!cliente) throw new Error('Cliente não encontrado.')
    const erro = validarPagamento(cliente, valor)
    if (erro) throw new Error(erro)
    cliente.saldo = aplicarPagamento(cliente.saldo, valor)
    const lancamento: LancamentoFiado = {
      id: `l-${crypto.randomUUID()}`,
      clienteId,
      tipo: 'pagamento',
      valor: Math.round(valor * 100) / 100,
      operador,
      observacao: observacao?.trim() || undefined,
      criadoEm: new Date().toISOString(),
    }
    extrato.value.unshift(lancamento)
    return lancamento
  }

  /** Venda do caixa no fiado — mesma conta corrente, com número da venda. */
  function registrarVendaFiado(
    clienteId: string,
    valor: number,
    vendaNumero: number,
    operador: string,
  ): LancamentoFiado {
    const cliente = clientes.value.find((c) => c.id === clienteId)
    if (!cliente) throw new Error('Cliente não encontrado.')
    if (!cliente.ativo) throw new Error('Cliente inativo — venda bloqueada.')
    if (!(valor > 0)) throw new Error('Valor inválido.')
    if (cliente.saldo + valor > cliente.limite)
      throw new Error(`${cliente.nome} não tem limite para esta venda.`)
    cliente.saldo = Math.round((cliente.saldo + valor) * 100) / 100
    const lancamento: LancamentoFiado = {
      id: `l-${crypto.randomUUID()}`,
      clienteId,
      tipo: 'venda',
      valor: Math.round(valor * 100) / 100,
      vendaNumero,
      operador,
      criadoEm: new Date().toISOString(),
    }
    extrato.value.unshift(lancamento)
    return lancamento
  }

  /** Estorno de fiado (cancelamento de venda). */
  function estornarVendaFiado(
    clienteId: string,
    valor: number,
    vendaNumero: number,
    operador: string,
    motivo: string,
  ): void {
    const cliente = clientes.value.find((c) => c.id === clienteId)
    if (!cliente) return
    cliente.saldo = Math.round(Math.max(0, cliente.saldo - valor) * 100) / 100
    extrato.value.unshift({
      id: `l-${crypto.randomUUID()}`,
      clienteId,
      tipo: 'ajuste',
      valor: -Math.round(valor * 100) / 100,
      vendaNumero,
      operador,
      observacao: `Estorno: ${motivo}`,
      criadoEm: new Date().toISOString(),
    })
  }

  /** Preferências premium: cortes favoritos e observações. */
  function salvarPreferencias(clienteId: string, cortes: string[], observacoes?: string): void {
    const cliente = clientes.value.find((c) => c.id === clienteId)
    if (!cliente) throw new Error('Cliente não encontrado.')
    cliente.cortesPreferidos = cortes
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 10)
    cliente.observacoes = observacoes?.trim() || undefined
  }

  /** Reserva/encomenda de peça ou corte. */
  function criarReserva(
    clienteId: string,
    descricao: string,
    quantidade: string,
    retirarEm: string | undefined,
    operador: string,
  ): ReservaCliente {
    const cliente = clientes.value.find((c) => c.id === clienteId)
    if (!cliente) throw new Error('Cliente não encontrado.')
    if (!descricao.trim()) throw new Error('Descreva a peça ou corte reservado.')
    if (!operador.trim()) throw new Error('Operador é obrigatório.')
    const reserva: ReservaCliente = {
      id: `res-${crypto.randomUUID()}`,
      clienteId,
      descricao: descricao.trim(),
      quantidade: quantidade.trim() || 'a combinar',
      retirarEm,
      status: 'aberta',
      criadaEm: new Date().toISOString(),
      operador: operador.trim(),
    }
    reservas.value.unshift(reserva)
    return reserva
  }

  function atualizarReserva(reservaId: string, status: ReservaCliente['status']): void {
    const reserva = reservas.value.find((r) => r.id === reservaId)
    if (!reserva) throw new Error('Reserva não encontrada.')
    reserva.status = status
  }

  /** Histórico de compras = lançamentos do tipo venda no extrato. */
  function historicoCompras(clienteId: string): LancamentoFiado[] {
    return extratoDoCliente(clienteId).filter((l) => l.tipo === 'venda')
  }

  return {
    clientes,
    extrato,
    reservas,
    resumo,
    devedores,
    buscar,
    extratoDoCliente,
    historicoCompras,
    cadastrarCliente,
    ajustarLimite,
    alternarAtivo,
    quitar,
    registrarVendaFiado,
    estornarVendaFiado,
    salvarPreferencias,
    criarReserva,
    atualizarReserva,
    contaBloqueada,
  }
})
