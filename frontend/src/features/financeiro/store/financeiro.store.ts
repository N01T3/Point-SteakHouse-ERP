// Store financeiro persistente — custos fixos, contas e desperdícios da sessão.
// Mock histórico continua em `mock/financeiro.mock`; aqui fica o operacional real.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  CENTROS_DE_CUSTO_ACOUGUE,
  CONTAS_MOCK,
  type Conta,
  DESPERDICIOS_MOCK,
  type Desperdicio,
} from '../mock/financeiro.mock'
import { type CustoFixo, type DadosCustoFixo, montarDreReal, validarCustoFixo } from '../tipos'

const CHAVE = 'point-financas-v1'

interface Persistido {
  custosFixos: CustoFixo[]
  contas: Conta[]
  desperdicios: Desperdicio[]
}

function clonar<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function carregar(): Persistido | null {
  try {
    const raw = localStorage.getItem(CHAVE)
    if (!raw) return null
    return JSON.parse(raw) as Persistido
  } catch {
    return null
  }
}

export const useFinanceiroStore = defineStore('financeiro', () => {
  const inicial = carregar()
  const custosFixos = ref<CustoFixo[]>(inicial?.custosFixos ?? [])
  const contas = ref<Conta[]>(inicial?.contas ?? clonar(CONTAS_MOCK))
  const desperdicios = ref<Desperdicio[]>(inicial?.desperdicios ?? clonar(DESPERDICIOS_MOCK))

  function persistir(): void {
    try {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({
          custosFixos: custosFixos.value,
          contas: contas.value,
          desperdicios: desperdicios.value,
        }),
      )
    } catch {
      // storage indisponível — mantém em memória
    }
  }

  const totalCustosFixosAtivos = computed(
    () =>
      Math.round(custosFixos.value.filter((c) => c.ativo).reduce((s, c) => s + c.valorMensal, 0) * 100) / 100,
  )
  const contasPagar = computed(() => contas.value.filter((c) => c.tipo === 'pagar'))
  const contasReceber = computed(() => contas.value.filter((c) => c.tipo === 'receber'))
  const totalPagoMes = computed(
    () =>
      Math.round(
        contas.value
          .filter((c) => c.status === 'pago' && c.tipo === 'pagar')
          .reduce((s, c) => s + c.valor, 0) * 100,
      ) / 100,
  )
  const totalDesperdicio = computed(
    () => Math.round(desperdicios.value.reduce((s, d) => s + d.valor, 0) * 100) / 100,
  )

  function adicionarCustoFixo(dados: DadosCustoFixo, operador: string): CustoFixo {
    const erro = validarCustoFixo(dados)
    if (erro) throw new Error(erro)
    if (!operador.trim()) throw new Error('Operador é obrigatório.')
    const custo: CustoFixo = {
      id: `cf-${crypto.randomUUID()}`,
      descricao: dados.descricao.trim(),
      categoria: dados.categoria.trim(),
      centroCusto: dados.centroCusto.trim() || CENTROS_DE_CUSTO_ACOUGUE[CENTROS_DE_CUSTO_ACOUGUE.length - 1],
      valorMensal: Math.round(dados.valorMensal * 100) / 100,
      ativo: true,
      criadoEm: new Date().toISOString(),
      criadoPor: operador.trim(),
    }
    custosFixos.value.unshift(custo)
    persistir()
    return custo
  }

  function alternarCustoFixo(id: string): void {
    const c = custosFixos.value.find((x) => x.id === id)
    if (!c) throw new Error('Custo não encontrado.')
    c.ativo = !c.ativo
    persistir()
  }

  function removerCustoFixo(id: string): void {
    custosFixos.value = custosFixos.value.filter((x) => x.id !== id)
    persistir()
  }

  /** Custos de exemplo — para visualizar DRE e ponto de equilíbrio. Só adiciona se a lista estiver vazia. */
  function carregarExemplo(operador = 'demo'): CustoFixo[] {
    if (custosFixos.value.length > 0) return custosFixos.value
    const exemplos: DadosCustoFixo[] = [
      {
        descricao: 'Aluguel do ponto',
        categoria: 'Aluguel',
        centroCusto: 'Administração',
        valorMensal: 6500,
      },
      {
        descricao: 'Folha açougue + encargos',
        categoria: 'Pessoal',
        centroCusto: 'Pessoal',
        valorMensal: 28500,
      },
      {
        descricao: 'Energia — câmaras frias',
        categoria: 'Energia',
        centroCusto: 'Energia/água',
        valorMensal: 1180,
      },
    ]
    return exemplos.map((e) => adicionarCustoFixo(e, operador))
  }

  function adicionarConta(dados: {
    descricao: string
    valor: number
    vencimento: string
    tipo: 'pagar' | 'receber'
    categoria?: string
    centroCusto?: string
  }): Conta {
    if (!dados.descricao.trim()) throw new Error('Descrição é obrigatória.')
    if (!(dados.valor > 0)) throw new Error('Valor deve ser maior que zero.')
    if (!dados.vencimento) throw new Error('Vencimento é obrigatório.')
    const conta: Conta = {
      id: `c-${crypto.randomUUID()}`,
      descricao: dados.descricao.trim(),
      categoria: dados.categoria?.trim() || 'Outros',
      centroCusto: dados.centroCusto?.trim() || CENTROS_DE_CUSTO_ACOUGUE[CENTROS_DE_CUSTO_ACOUGUE.length - 1],
      valor: Math.round(dados.valor * 100) / 100,
      vencimento: dados.vencimento,
      status: 'a_vencer',
      tipo: dados.tipo,
    }
    contas.value.unshift(conta)
    persistir()
    return conta
  }

  function pagarConta(id: string): void {
    const c = contas.value.find((x) => x.id === id)
    if (!c) throw new Error('Conta não encontrada.')
    c.status = 'pago'
    persistir()
  }

  function cancelarConta(id: string): void {
    const c = contas.value.find((x) => x.id === id)
    if (!c) throw new Error('Conta não encontrada.')
    if (c.status === 'pago') throw new Error('Conta paga não pode ser cancelada — faça estorno.')
    c.status = 'cancelado'
    persistir()
  }

  function adicionarDesperdicio(d: Omit<Desperdicio, 'id'>): Desperdicio {
    if (!d.produto.trim()) throw new Error('Produto é obrigatório.')
    if (!(d.quantidade > 0)) throw new Error('Quantidade deve ser maior que zero.')
    const item: Desperdicio = { ...d, id: `d-${crypto.randomUUID()}` }
    desperdicios.value.unshift(item)
    persistir()
    return item
  }

  /** DRE real: receita/CMV/desperdício do turno + fixos e contas pagas. */
  function dreReal(receita: number, cmv: number, desperdicioTurno: number) {
    return montarDreReal({
      receita,
      cmv,
      custosFixos: totalCustosFixosAtivos.value,
      contasPagas: totalPagoMes.value,
      desperdicio: Math.round((desperdicioTurno + totalDesperdicio.value) * 100) / 100,
    })
  }

  function restaurarDemo(): void {
    custosFixos.value = []
    contas.value = clonar(CONTAS_MOCK)
    desperdicios.value = clonar(DESPERDICIOS_MOCK)
    persistir()
  }

  return {
    custosFixos,
    contas,
    desperdicios,
    totalCustosFixosAtivos,
    contasPagar,
    contasReceber,
    totalPagoMes,
    totalDesperdicio,
    adicionarCustoFixo,
    alternarCustoFixo,
    removerCustoFixo,
    carregarExemplo,
    adicionarConta,
    pagarConta,
    cancelarConta,
    adicionarDesperdicio,
    dreReal,
    restaurarDemo,
  }
})
