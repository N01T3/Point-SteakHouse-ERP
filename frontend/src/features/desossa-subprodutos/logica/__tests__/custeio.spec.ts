import { describe, expect, it } from 'vitest'
import {
  calcularCustoBasePorKg,
  calcularCustoEfetivoPorKg,
  calcularPesoAproveitavelKg,
  calcularPrecoSugeridoPorKg,
  calcularRendimentoRealizado,
  desvioDeRendimentoSignificativo,
} from '../custeio'

describe('calcularPesoAproveitavelKg', () => {
  it('soma apenas as saídas classificadas como CORTE', () => {
    const saidas = [
      { classificacao: 'CORTE' as const, pesoKg: 10 },
      { classificacao: 'OSSO' as const, pesoKg: 4 },
      { classificacao: 'PERDA' as const, pesoKg: 1 },
    ]
    expect(calcularPesoAproveitavelKg(saidas)).toBe(10)
  })
})

describe('calcularRendimentoRealizado', () => {
  it('calcula a proporção de peso aproveitável sobre o peso bruto', () => {
    const saidas = [{ classificacao: 'CORTE' as const, pesoKg: 30 }]
    expect(calcularRendimentoRealizado(100, saidas)).toBeCloseTo(0.3)
  })

  it('não divide por zero quando o peso bruto é zero', () => {
    expect(calcularRendimentoRealizado(0, [])).toBe(0)
  })
})

describe('desvioDeRendimentoSignificativo', () => {
  it('não sinaliza exatamente no limiar de 5 pontos percentuais', () => {
    expect(desvioDeRendimentoSignificativo(0.55, 0.5)).toBe(false)
  })

  it('sinaliza acima do limiar', () => {
    expect(desvioDeRendimentoSignificativo(0.56, 0.5)).toBe(true)
  })

  it('sinaliza também quando o rendimento real é maior que o esperado', () => {
    expect(desvioDeRendimentoSignificativo(0.6, 0.5)).toBe(true)
  })
})

describe('calcularCustoBasePorKg', () => {
  it('rateia o custo total da peça pelo peso aproveitável', () => {
    expect(calcularCustoBasePorKg(1000, 40)).toBe(25)
  })

  it('não divide por zero quando nada foi aproveitado', () => {
    expect(calcularCustoBasePorKg(1000, 0)).toBe(0)
  })
})

describe('calcularCustoEfetivoPorKg e calcularPrecoSugeridoPorKg', () => {
  it('soma a mão de obra ao custo base e aplica a margem padrão', () => {
    const custoEfetivo = calcularCustoEfetivoPorKg(25)
    expect(custoEfetivo).toBe(30)
    expect(calcularPrecoSugeridoPorKg(custoEfetivo)).toBeCloseTo(40.5)
  })
})
