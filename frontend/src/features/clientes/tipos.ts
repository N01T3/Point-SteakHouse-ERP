// Clientes e conta corrente (fiado) — açougue/mercado, sem salão.
// Saldo = valor em aberto (devido pelo cliente). Bloqueio automático no teto.
export interface PreferenciaCliente {
  corte: string
  observacao?: string
}

export interface ReservaCliente {
  id: string
  clienteId: string
  descricao: string
  quantidade: string
  retirarEm?: string
  status: 'aberta' | 'pronta' | 'entregue' | 'cancelada'
  criadaEm: string
  operador: string
}

export interface Cliente {
  id: string
  nome: string
  telefone?: string
  endereco?: string
  aniversario?: string // ISO yyyy-mm-dd
  limite: number
  saldo: number
  ativo: boolean
  criadoEm: string // ISO
  cortesPreferidos?: string[]
  observacoes?: string
}

export type TipoLancamentoFiado = 'venda' | 'pagamento' | 'ajuste'

export interface LancamentoFiado {
  id: string
  clienteId: string
  tipo: TipoLancamentoFiado
  valor: number
  vendaNumero?: number
  operador: string
  observacao?: string
  criadoEm: string // ISO
}
