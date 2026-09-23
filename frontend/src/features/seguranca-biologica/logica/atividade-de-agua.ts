import { percentualDePerdaReal } from '../../maturacao/logica/projecao-de-evaporacao'
import type { PecaEmMaturacao } from '../../maturacao/types'

const AW_INICIAL_ESTIMADA = 0.99
// Heurística ilustrativa para o protótipo — liga a Aw diretamente à perda de peso
// já calculada pela Inteligência Preditiva de Evaporação da Maturação, como o
// documento funcional pede. Não é o modelo científico real de atividade de água.
const FATOR_DE_QUEDA_POR_PERDA_DE_PESO = 0.7

export function estimarAtividadeDeAgua(peca: Pick<PecaEmMaturacao, 'pesoInicialKg' | 'pesoAtualKg'>): number {
  const perda = percentualDePerdaReal(peca)
  return Math.max(0, AW_INICIAL_ESTIMADA - perda * FATOR_DE_QUEDA_POR_PERDA_DE_PESO)
}

export function abaixoDoLimiarDeSeguranca(atividadeDeAgua: number, limiar: number): boolean {
  return atividadeDeAgua <= limiar
}
