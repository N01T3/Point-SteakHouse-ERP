export interface ResumoDeSaldoEmAberto {
  saldoTotal: number
  clientesComSaldoAberto: number
}

export interface ContaCorrenteRepository {
  obterResumoDeSaldoEmAberto(): Promise<ResumoDeSaldoEmAberto>
}

export const CONTA_CORRENTE_REPOSITORY = Symbol('ContaCorrenteRepository')
