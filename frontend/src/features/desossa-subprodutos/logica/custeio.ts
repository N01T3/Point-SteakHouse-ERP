import type { ClassificacaoDeSaida } from '../types'

const CUSTO_MAO_DE_OBRA_POR_KG = 5
const MARGEM_PADRAO = 0.35
const LIMIAR_DE_DESVIO_DE_RENDIMENTO = 0.05 // 5 pontos percentuais

export function calcularPesoAproveitavelKg(saidas: { classificacao: ClassificacaoDeSaida; pesoKg: number }[]): number {
  return saidas.filter((saida) => saida.classificacao === 'CORTE').reduce((soma, saida) => soma + saida.pesoKg, 0)
}

export function calcularRendimentoRealizado(
  pesoDaPecaBrutaKg: number,
  saidas: { classificacao: ClassificacaoDeSaida; pesoKg: number }[],
): number {
  if (pesoDaPecaBrutaKg <= 0) return 0
  return calcularPesoAproveitavelKg(saidas) / pesoDaPecaBrutaKg
}

const EPSILON_DE_PONTO_FLUTUANTE = 1e-9

export function desvioDeRendimentoSignificativo(rendimentoRealizado: number, rendimentoEsperado: number): boolean {
  return Math.abs(rendimentoRealizado - rendimentoEsperado) > LIMIAR_DE_DESVIO_DE_RENDIMENTO + EPSILON_DE_PONTO_FLUTUANTE
}

export function calcularCustoBasePorKg(custoTotalDaPecaBruta: number, pesoAproveitavelKg: number): number {
  if (pesoAproveitavelKg <= 0) return 0
  return custoTotalDaPecaBruta / pesoAproveitavelKg
}

export function calcularCustoEfetivoPorKg(custoBasePorKg: number): number {
  return custoBasePorKg + CUSTO_MAO_DE_OBRA_POR_KG
}

export function calcularPrecoSugeridoPorKg(custoEfetivoPorKg: number): number {
  return custoEfetivoPorKg * (1 + MARGEM_PADRAO)
}
