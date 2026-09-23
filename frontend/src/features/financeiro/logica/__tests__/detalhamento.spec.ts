import { describe, expect, it } from 'vitest'
import { DIAS_MOCK } from '../../mock/financeiro.mock'
import {
  compararComAnterior,
  despesasPorCategoria,
  estoqueValorizado,
  fluxoCaixa,
  projetarCaixa,
  resumirRendimento,
  serieResultado,
  waterfallDre,
} from '../detalhamento'
import { agregar } from '../financeiro'

describe('detalhamento financeiro', () => {
  it('monta série receita/cmv/lucro e agrega semanas em 90d', () => {
    const curta = serieResultado(DIAS_MOCK.slice(-14))
    expect(curta.rotulos.length).toBe(14)
    expect(curta.lucro[0]).toBe(curta.receita[0] - curta.cmv[0] - DIAS_MOCK.slice(-14)[0].despesas)
    const longa = serieResultado(DIAS_MOCK)
    expect(longa.rotulos.length).toBeLessThan(90)
  })

  it('fluxo de caixa acumula e projeta', () => {
    const fluxo = fluxoCaixa(DIAS_MOCK.slice(-7))
    expect(fluxo[0].entradas).toBeGreaterThan(0)
    expect(projetarCaixa(fluxo, 30)).not.toBeNull()
    expect(projetarCaixa([], 30)).toBeNull()
  })

  it('waterfall termina no lucro líquido', () => {
    const resumo = agregar(DIAS_MOCK.slice(-14), 100)
    const degraus = waterfallDre(resumo)
    expect(degraus.length).toBe(5)
    expect(degraus[degraus.length - 1].fim).toBe(resumo.lucroLiquido)
  })

  it('despesas por categoria somam 100% (top 6 + outros)', () => {
    const base = [
      { categoria: 'A', descricao: 'a', valor: 100 },
      { categoria: 'B', descricao: 'b', valor: 50 },
    ]
    const fatias = despesasPorCategoria(base, [
      {
        id: '1',
        descricao: 'Aluguel',
        categoria: 'Aluguel',
        centroCusto: 'Adm',
        valorMensal: 50,
        ativo: true,
        criadoEm: '',
        criadoPor: '',
      },
    ])
    const soma = fatias.reduce((s, f) => s + f.percentual, 0)
    expect(soma).toBeGreaterThanOrEqual(99)
    expect(soma).toBeLessThanOrEqual(101)
    expect(despesasPorCategoria([], [])).toEqual([])
  })

  it('estoque valorizado ordena por valor e soma total', () => {
    const { itens, total } = estoqueValorizado([
      {
        id: 'a',
        nome: 'A',
        categoria: 'C',
        unidade: 'KG',
        preco: 10,
        custoMedio: 5,
        estoqueMinimo: 1,
        estoqueAlvo: 2,
        lotes: [{ lote: 'L1', validade: '2027-01-01', quantidade: 2, estado: 'LIBERADO' }],
      },
      {
        id: 'b',
        nome: 'B',
        categoria: 'C',
        unidade: 'UN',
        preco: 10,
        custoMedio: 3,
        estoqueMinimo: 1,
        estoqueAlvo: 2,
        lotes: [],
      },
    ])
    expect(itens.length).toBe(1)
    expect(total).toBe(10)
  })

  it('rendimento agrega ordens e compara com período anterior', () => {
    const r = resumirRendimento([
      {
        pecaBruta: { pesoKg: 100 },
        saidas: [
          { pesoKg: 60, classificacao: 'CORTE' },
          { pesoKg: 20, classificacao: 'OSSO' },
        ],
        rendimentoRealizado: 0.6,
        custoEfetivoPorKg: 30,
      },
    ])
    expect(r.rendimento).toBe(0.6)
    expect(r.custoEfetivoMedio).toBe(30)
    expect(resumirRendimento([]).rendimento).toBeNull()
    const comp = compararComAnterior(DIAS_MOCK, DIAS_MOCK.slice(-14))
    expect(comp).not.toBeNull()
    expect(compararComAnterior(DIAS_MOCK.slice(-14), DIAS_MOCK.slice(-14))).toBeNull()
  })
})
