export type TecnicaDeMaturacao = 'dry_aged' | 'wet_aged'

export interface Camara {
  id: string
  nome: string
  temperaturaAtual: number
  temperaturaIdealMin: number
  temperaturaIdealMax: number
  umidadeAtual: number
  umidadeIdealMin: number
  umidadeIdealMax: number
}

export interface PecaEmMaturacao {
  id: string
  nome: string
  tecnica: TecnicaDeMaturacao
  camaraId: string
  pesoInicialKg: number
  pesoAtualKg: number
  diasAtual: number
  diasTotal: number
  custoInicialPorKg: number
  loteOrigem?: string
  responsavel?: string
  finalizada?: boolean
}

export const NOMES_TECNICA: Record<TecnicaDeMaturacao, string> = {
  dry_aged: 'Dry aged',
  wet_aged: 'Wet aged',
}
