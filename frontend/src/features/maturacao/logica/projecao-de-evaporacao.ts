import type { PecaEmMaturacao } from '../types'

// Taxas diárias aproximadas de perda de peso por evaporação, por técnica —
// dry aged perde muito mais rápido por ficar exposta ao ar da câmara.
const TAXA_DIARIA_DRY_AGED = 0.008
const TAXA_DIARIA_WET_AGED = 0.0015

const LIMIAR_DE_DESVIO_SIGNIFICATIVO = 0.03 // 3 pontos percentuais

function taxaDiariaEsperada(peca: Pick<PecaEmMaturacao, 'tecnica'>): number {
  return peca.tecnica === 'dry_aged' ? TAXA_DIARIA_DRY_AGED : TAXA_DIARIA_WET_AGED
}

export function pesoProjetadoKg(peca: Pick<PecaEmMaturacao, 'tecnica' | 'pesoInicialKg' | 'diasAtual'>): number {
  const perdaProjetada = taxaDiariaEsperada(peca) * peca.diasAtual
  return peca.pesoInicialKg * (1 - Math.min(1, perdaProjetada))
}

export function percentualDePerdaReal(peca: Pick<PecaEmMaturacao, 'pesoInicialKg' | 'pesoAtualKg'>): number {
  if (peca.pesoInicialKg <= 0) return 0
  return (peca.pesoInicialKg - peca.pesoAtualKg) / peca.pesoInicialKg
}

export function desvioSignificativo(
  peca: Pick<PecaEmMaturacao, 'tecnica' | 'pesoInicialKg' | 'pesoAtualKg' | 'diasAtual'>,
): boolean {
  const projetado = pesoProjetadoKg(peca)
  const desvioPercentual = Math.abs(peca.pesoAtualKg - projetado) / peca.pesoInicialKg
  return desvioPercentual > LIMIAR_DE_DESVIO_SIGNIFICATIVO
}

export function custoAtualPorKg(peca: Pick<PecaEmMaturacao, 'pesoInicialKg' | 'pesoAtualKg' | 'custoInicialPorKg'>): number {
  // O custo total da peça não muda com a evaporação, mas o peso vendável sim —
  // então o custo por kg sobe conforme a peça perde água.
  if (peca.pesoAtualKg <= 0) return peca.custoInicialPorKg
  const custoTotal = peca.pesoInicialKg * peca.custoInicialPorKg
  return custoTotal / peca.pesoAtualKg
}

export function estaProntaParaFinalizar(peca: Pick<PecaEmMaturacao, 'diasAtual' | 'diasTotal'>): boolean {
  return peca.diasAtual >= peca.diasTotal
}
