import { describe, expect, it } from 'vitest'
import { abaixoDoLimiarDeSeguranca, estimarAtividadeDeAgua } from '../atividade-de-agua'

describe('estimarAtividadeDeAgua', () => {
  it('estima Aw mais baixa para peças com maior perda de peso', () => {
    const pecaComPoucaPerda = estimarAtividadeDeAgua({ pesoInicialKg: 10, pesoAtualKg: 9.8 })
    const pecaComMuitaPerda = estimarAtividadeDeAgua({ pesoInicialKg: 10, pesoAtualKg: 7 })
    expect(pecaComMuitaPerda).toBeLessThan(pecaComPoucaPerda)
  })

  it('nunca estima Aw negativa mesmo com perda extrema', () => {
    expect(estimarAtividadeDeAgua({ pesoInicialKg: 10, pesoAtualKg: 0 })).toBeGreaterThanOrEqual(0)
  })
})

describe('abaixoDoLimiarDeSeguranca', () => {
  it('considera dentro do limiar exatamente em Aw = 0,85 com limiar 0,85', () => {
    expect(abaixoDoLimiarDeSeguranca(0.85, 0.85)).toBe(true)
  })

  it('considera seguro um valor acima do limiar', () => {
    expect(abaixoDoLimiarDeSeguranca(0.9, 0.85)).toBe(false)
  })

  it('sinaliza risco um valor abaixo do limiar', () => {
    expect(abaixoDoLimiarDeSeguranca(0.8, 0.85)).toBe(true)
  })
})
