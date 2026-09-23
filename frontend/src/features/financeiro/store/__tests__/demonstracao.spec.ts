import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMercadoStore } from '../../../mercado/store/mercado.store'
import { useFinanceiroStore } from '../financeiro.store'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('dados de demonstração para gráficos', () => {
  it('carrega vendas demo uma única vez e alimenta o resumo', () => {
    const mercado = useMercadoStore()
    const vendas = mercado.carregarVendasDemonstracao('demo')
    expect(vendas.length).toBe(4)
    expect(mercado.resumoOperacional.receita).toBeGreaterThan(0)
    expect(mercado.resumoOperacional.fiado).toBeGreaterThan(0)
    expect(mercado.livro.length).toBeGreaterThanOrEqual(4)
    const segunda = mercado.carregarVendasDemonstracao('demo')
    expect(segunda.length).toBe(4)
    expect(mercado.vendas.length).toBe(4)
  })

  it('carrega custos fixos de exemplo só com lista vazia', () => {
    const fin = useFinanceiroStore()
    const custos = fin.carregarExemplo('demo')
    expect(custos.length).toBe(3)
    expect(fin.totalCustosFixosAtivos).toBeGreaterThan(0)
    expect(fin.carregarExemplo('demo').length).toBe(3)
  })
})
