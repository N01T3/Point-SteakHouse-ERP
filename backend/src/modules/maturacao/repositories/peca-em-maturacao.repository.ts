export interface PecaEmMaturacaoResumo {
  nome: string
  tipo: string
  diasAtual: number
  diasTotal: number
}

export interface PecaEmMaturacaoRepository {
  listarAtivas(): Promise<PecaEmMaturacaoResumo[]>
}

export const PECA_EM_MATURACAO_REPOSITORY = Symbol('PecaEmMaturacaoRepository')
