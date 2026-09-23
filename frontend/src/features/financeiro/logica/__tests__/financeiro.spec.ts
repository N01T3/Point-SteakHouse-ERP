import { describe, expect, it } from 'vitest'
import {
  DESPERDICIOS_MOCK,
  MARGEM_POR_ITEM_MOCK,
  type DiaFinanceiro,
} from '../../mock/financeiro.mock'
import { DIAS_MOCK } from '../../mock/financeiro.mock'
import {
  agregar,
  curvaABC,
  fiadoVsLucro,
  filtrarDias,
  margemMediaItens,
  montarDre,
  pontoDeEquilibrio,
  precoMinimo,
  resumirDesperdicios,
  serieResultadoDiario,
} from '../financeiro'

const DIA: DiaFinanceiro = {
  data: '2026-09-22',
  receita: 10000,
  cmv: 3800,
  despesas: 2200,
  fiadoNovo: 1200,
  fiadoRecebido: 1080,
}

describe('agregação financeira (Mercado, sem salão)', () => {
  it('soma receita, custos e fiado do período', () => {
    const resumo = agregar([DIA])
    expect(resumo.receita).toBe(10000)
    expect(resumo.lucroBruto).toBe(6200)
    expect(resumo.lucroLiquido).toBe(4000)
    expect(resumo.margemLiquida).toBeCloseTo(0.4)
    expect(resumo.receitaRecebida).toBe(9880)
  })

  it('desconta desperdício do lucro líquido', () => {
    expect(agregar([DIA], 213).lucroLiquido).toBe(4000 - 213)
  })

  it('margem é nula sem receita (sem NaN)', () => {
    const vazio: DiaFinanceiro = { ...DIA, receita: 0 }
    expect(agregar([vazio]).margemLiquida).toBeNull()
  })

  it('filtra janelas de período', () => {
    expect(filtrarDias(DIAS_MOCK, 'hoje')).toHaveLength(1)
    expect(filtrarDias(DIAS_MOCK, '14d')).toHaveLength(14)
    expect(filtrarDias(DIAS_MOCK, '90d')).toHaveLength(90)
  })
})

describe('DRE do açougue', () => {
  it('fecha lucro líquido = receita − cmv − despesas − desperdício', () => {
    const resumo = agregar([DIA], 100)
    const dre = montarDre(resumo, 'competencia')
    const lucro = dre.find((linha) => linha.rotulo === 'Lucro líquido gerencial')
    expect(lucro?.valor).toBe(3900)
    expect(dre.some((linha) => linha.rotulo === '(−) Perdas e desperdícios')).toBe(true)
  })
})

describe('desperdícios', () => {
  it('resume total, ranking de motivo e de produto', () => {
    const resumo = resumirDesperdicios(DESPERDICIOS_MOCK, 10000)
    expect(resumo.totalReais).toBe(45 + 88 + 36 + 44)
    expect(resumo.porMotivo[0].motivo).toBe('validade')
    expect(resumo.percentualReceita).toBeCloseTo(213 / 10000)
  })

  it('percentual é nulo sem receita', () => {
    expect(resumirDesperdicios(DESPERDICIOS_MOCK, 0).percentualReceita).toBeNull()
  })
})

describe('lucro por item', () => {
  it('calcula margem média ponderada pela receita', () => {
    const media = margemMediaItens(MARGEM_POR_ITEM_MOCK)
    expect(media).not.toBeNull()
    expect(media!).toBeGreaterThan(0.3)
    expect(media!).toBeLessThan(0.45)
  })

  it('classifica curva ABC por receita', () => {
    const abc = curvaABC(MARGEM_POR_ITEM_MOCK)
    expect(abc[0].classe).toBe('A')
    expect(abc[abc.length - 1].classe).toBe('C')
  })

  it('preço mínimo respeita margem alvo', () => {
    expect(precoMinimo(55, 0.3)).toBeCloseTo(78.57, 2)
    expect(precoMinimo(55, 1)).toBeNull()
  })

  it('ponto de equilíbrio divide fixos pela margem de contribuição', () => {
    expect(pontoDeEquilibrio(34900, 0.4)).toBe(87250)
    expect(pontoDeEquilibrio(34900, 0)).toBeNull()
  })
})

describe('fiado × lucro', () => {
  it('acumula saldo de fiado ao longo dos buckets', () => {
    const dias = [DIA, { ...DIA, data: '2026-09-23' }]
    const pontos = fiadoVsLucro(dias, 'dia')
    expect(pontos).toHaveLength(2)
    // saldo inicial 4350 + (1200 − 1080) × 2
    expect(pontos[1].saldoFiado).toBe(4350 + 240)
    expect(pontos[0].lucro).toBe(4000)
  })

  it('agrupa por semana e mês', () => {
    expect(fiadoVsLucro(DIAS_MOCK, 'semana')).toHaveLength(8)
    expect(fiadoVsLucro(DIAS_MOCK, 'mes')).toHaveLength(3)
  })

  it('série diária de resultado tem um ponto por dia', () => {
    expect(serieResultadoDiario([DIA])).toEqual([{ data: '2026-09-22', valor: 4000 }])
  })
})
