import { describe, expect, it } from 'vitest'
import {
  CAPACIDADE_MAXIMA_LOG10_CFU,
  simularCrescimento,
  taxaMaximaDeCrescimento,
} from '../crescimento-microbiano'

describe('taxaMaximaDeCrescimento', () => {
  it('é zero abaixo da temperatura mínima cardeal', () => {
    expect(taxaMaximaDeCrescimento(-5, 'LISTERIA')).toBe(0)
  })

  it('é zero acima da temperatura máxima cardeal', () => {
    expect(taxaMaximaDeCrescimento(50, 'E_COLI')).toBe(0)
  })

  it('é maior próximo da temperatura ótima do que bem abaixo dela', () => {
    const taxaPertoDoOtimo = taxaMaximaDeCrescimento(35, 'SALMONELLA')
    const taxaFria = taxaMaximaDeCrescimento(10, 'SALMONELLA')
    expect(taxaPertoDoOtimo).toBeGreaterThan(taxaFria)
  })

  it('nunca é negativa dentro da faixa cardeal', () => {
    for (const temperatura of [0, 10, 20, 30, 40]) {
      expect(taxaMaximaDeCrescimento(temperatura, 'MESOFILOS')).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('simularCrescimento', () => {
  it('começa exatamente na contagem inicial informada (t=0)', () => {
    const pontos = simularCrescimento('LISTERIA', 25, 2, 6)
    expect(pontos[0].horas).toBe(0)
    expect(pontos[0].logCfuPorGrama).toBeCloseTo(2, 6)
  })

  it('cresce ao longo do tempo em temperatura favorável', () => {
    const pontos = simularCrescimento('E_COLI', 30, 1, 8)
    const primeiro = pontos[0].logCfuPorGrama
    const ultimo = pontos[pontos.length - 1].logCfuPorGrama
    expect(ultimo).toBeGreaterThan(primeiro)
  })

  it('não cresce (permanece constante) fora da faixa cardeal de temperatura', () => {
    const pontos = simularCrescimento('SALMONELLA', 2, 3, 6)
    expect(pontos.every((ponto) => Math.abs(ponto.logCfuPorGrama - 3) < 1e-9)).toBe(true)
  })

  it('nunca ultrapassa o teto de capacidade máxima, mesmo em janelas muito longas', () => {
    const pontos = simularCrescimento('LISTERIA', 37, 5, 200, 5)
    for (const ponto of pontos) {
      expect(ponto.logCfuPorGrama).toBeLessThanOrEqual(CAPACIDADE_MAXIMA_LOG10_CFU + 1e-6)
    }
  })
})
