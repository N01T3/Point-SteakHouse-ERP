import { Inject, Injectable } from '@nestjs/common'
import {
  PECA_EM_MATURACAO_REPOSITORY,
  type PecaEmMaturacaoRepository,
  type PecaEmMaturacaoResumo,
} from '../repositories/peca-em-maturacao.repository.js'

const LIMITE_DE_DIAS_PARA_CONSIDERAR_PRONTA_NA_SEMANA = 7

export interface PecaEmMaturacaoParaExibicao extends PecaEmMaturacaoResumo {
  progressoPercentual: number
  prontaNestaSemana: boolean
}

export interface ResumoDeMaturacao {
  pecas: PecaEmMaturacaoParaExibicao[]
  totalAtivas: number
  prontasNaSemana: number
}

export function calcularProgressoPercentual(peca: PecaEmMaturacaoResumo): number {
  // Uma peça maturando além do previsto (diasAtual > diasTotal) continua válida —
  // o progresso apenas satura em 100%, nunca deve ultrapassar isso na UI.
  return Math.min(100, Math.round((peca.diasAtual / peca.diasTotal) * 100))
}

export function estaProntaNestaSemana(peca: PecaEmMaturacaoResumo): boolean {
  const diasRestantes = peca.diasTotal - peca.diasAtual
  return diasRestantes >= 0 && diasRestantes <= LIMITE_DE_DIAS_PARA_CONSIDERAR_PRONTA_NA_SEMANA
}

@Injectable()
export class ListarPecasEmMaturacaoUseCase {
  constructor(
    @Inject(PECA_EM_MATURACAO_REPOSITORY)
    private readonly pecaEmMaturacaoRepository: PecaEmMaturacaoRepository,
  ) {}

  async executar(): Promise<ResumoDeMaturacao> {
    const resumos = await this.pecaEmMaturacaoRepository.listarAtivas()
    const pecas = resumos.map((peca) => ({
      ...peca,
      progressoPercentual: calcularProgressoPercentual(peca),
      prontaNestaSemana: estaProntaNestaSemana(peca),
    }))

    return {
      pecas,
      totalAtivas: pecas.length,
      prontasNaSemana: pecas.filter((peca) => peca.prontaNestaSemana).length,
    }
  }
}
