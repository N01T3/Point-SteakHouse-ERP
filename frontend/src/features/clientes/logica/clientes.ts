// Regras puras da conta corrente — testáveis, sem Vue.
import type { Cliente } from '../tipos'

export function fiadoDisponivel(cliente: Cliente): number {
  return Math.round((cliente.limite - cliente.saldo) * 100) / 100
}

/** Bloqueio: manual (inativo) ou automático ao atingir o teto. */
export function contaBloqueada(cliente: Cliente): boolean {
  return !cliente.ativo || cliente.saldo >= cliente.limite
}

export function podeMarcarFiado(cliente: Cliente, valor: number): boolean {
  return cliente.ativo && valor > 0 && fiadoDisponivel(cliente) >= valor
}

/** Retorna mensagem de erro ou null quando o pagamento é válido. */
export function validarPagamento(cliente: Cliente, valor: number): string | null {
  if (!(valor > 0)) return 'Informe um valor maior que zero.'
  if (valor > cliente.saldo) return `Valor acima do saldo em aberto (${cliente.saldo}).`
  return null
}

export function aplicarPagamento(saldo: number, valor: number): number {
  return Math.round((saldo - valor) * 100) / 100
}

export interface ResumoCobranca {
  totalAberto: number
  devedores: number
  bloqueados: number
}

export function resumirCobranca(clientes: Cliente[]): ResumoCobranca {
  const totalAberto = clientes.reduce((soma, c) => soma + Math.max(0, c.saldo), 0)
  return {
    totalAberto: Math.round(totalAberto * 100) / 100,
    devedores: clientes.filter((c) => c.saldo > 0).length,
    bloqueados: clientes.filter((c) => contaBloqueada(c) && c.saldo > 0).length,
  }
}
