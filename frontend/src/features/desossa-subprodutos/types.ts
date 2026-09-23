export type ClassificacaoDeSaida = 'CORTE' | 'OSSO' | 'SEBO' | 'APARA' | 'PERDA'
export type DestinoDeSubproduto = 'CALDO' | 'SEBO' | 'MOIDA' | 'PETISCOS' | 'DESCARTE'

export interface CorteEsperado {
  nome: string
  percentualEsperado: number
}

export interface TemplateDeDesossa {
  id: string
  tipoDePeca: string
  cortesEsperados: CorteEsperado[]
}

export interface PecaBruta {
  id: string
  fornecedor: string
  tipoDePeca: string
  pesoKg: number
  custoPorKg: number
  recebidoEm: Date
}

export interface SaidaDeDesossa {
  id: string
  nome: string
  pesoKg: number
  classificacao: ClassificacaoDeSaida
  destino: DestinoDeSubproduto | null
}

export interface OrdemDeDesossa {
  id: string
  pecaBruta: PecaBruta
  saidas: SaidaDeDesossa[]
  rendimentoEsperado: number
  rendimentoRealizado: number
  custoEfetivoPorKg: number
  concluidaEm: Date
  enviadaAoEstoque?: boolean
  custoPorCorte?: Array<{ nome: string; pesoKg: number; custoTotal: number }>
}

export const NOMES_DESTINO: Record<DestinoDeSubproduto, string> = {
  CALDO: 'Caldo/Fundo',
  SEBO: 'Sebo/Banha',
  MOIDA: 'Carne Moída/Hambúrguer',
  PETISCOS: 'Petiscos',
  DESCARTE: 'Descarte',
}

export const SAIDAS_SECUNDARIAS_PADRAO: {
  classificacao: ClassificacaoDeSaida
  nome: string
  destinoPadrao: DestinoDeSubproduto
}[] = [
  { classificacao: 'OSSO', nome: 'Osso', destinoPadrao: 'CALDO' },
  { classificacao: 'SEBO', nome: 'Sebo/Gordura', destinoPadrao: 'SEBO' },
  { classificacao: 'APARA', nome: 'Apara', destinoPadrao: 'MOIDA' },
  { classificacao: 'PERDA', nome: 'Perda', destinoPadrao: 'DESCARTE' },
]
