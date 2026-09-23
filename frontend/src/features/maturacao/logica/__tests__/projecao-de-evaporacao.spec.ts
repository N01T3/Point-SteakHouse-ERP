import { describe, expect, it } from 'vitest'
import {
  custoAtualPorKg,
  desvioSignificativo,
  estaProntaParaFinalizar,
  percentualDePerdaReal,
  pesoProjetadoKg,
} from '../projecao-de-evaporacao'

describe('pesoProjetadoKg', () => {
  it('projeta perda maior para dry aged que para wet aged no mesmo prazo', () => {
    const dry = pesoProjetadoKg({ tecnica: 'dry_aged', pesoInicialKg: 10, diasAtual: 20 })
    const wet = pesoProjetadoKg({ tecnica: 'wet_aged', pesoInicialKg: 10, diasAtual: 20 })
    expect(dry).toBeLessThan(wet)
  })

  it('nunca projeta peso negativo mesmo com dias muito além do previsto', () => {
    const peso = pesoProjetadoKg({ tecnica: 'dry_aged', pesoInicialKg: 10, diasAtual: 500 })
    expect(peso).toBeGreaterThanOrEqual(0)
  })
})

describe('percentualDePerdaReal', () => {
  it('calcula a perda real proporcional', () => {
    expect(percentualDePerdaReal({ pesoInicialKg: 10, pesoAtualKg: 9 })).toBeCloseTo(0.1)
  })
})

describe('desvioSignificativo', () => {
  it('não sinaliza desvio quando o peso real está próximo da projeção', () => {
    const peca = { tecnica: 'wet_aged' as const, pesoInicialKg: 10, diasAtual: 5, pesoAtualKg: 9.93 }
    expect(desvioSignificativo(peca)).toBe(false)
  })

  it('sinaliza desvio quando o peso real está bem abaixo da projeção (câmara fora do padrão)', () => {
    const peca = { tecnica: 'wet_aged' as const, pesoInicialKg: 10, diasAtual: 5, pesoAtualKg: 8.5 }
    expect(desvioSignificativo(peca)).toBe(true)
  })
})

describe('custoAtualPorKg', () => {
  it('sobe o custo por kg conforme o peso vendável cai', () => {
    const custo = custoAtualPorKg({ pesoInicialKg: 10, pesoAtualKg: 8, custoInicialPorKg: 50 })
    expect(custo).toBeCloseTo(62.5)
  })
})

describe('estaProntaParaFinalizar', () => {
  it('considera pronta no exato limite diasAtual === diasTotal', () => {
    expect(estaProntaParaFinalizar({ diasAtual: 45, diasTotal: 45 })).toBe(true)
  })

  it('considera pronta quando diasAtual excede diasTotal (maturação além do previsto)', () => {
    expect(estaProntaParaFinalizar({ diasAtual: 50, diasTotal: 45 })).toBe(true)
  })

  it('não considera pronta antes do prazo', () => {
    expect(estaProntaParaFinalizar({ diasAtual: 30, diasTotal: 45 })).toBe(false)
  })
})
