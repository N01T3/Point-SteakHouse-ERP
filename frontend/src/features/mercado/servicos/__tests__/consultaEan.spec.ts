import { describe, expect, it, vi } from 'vitest'
import { consultarEan } from '../consultaEan'

function mockFetch(resposta: unknown, ok = true) {
  return vi.fn(async () => ({ ok, json: async () => resposta }))
}

describe('consultarEan', () => {
  it('mapeia nome, marca e sugere categoria', async () => {
    const dados = await consultarEan(
      '7891234000187',
      mockFetch({
        status: 1,
        product: {
          product_name: 'Café Torrado',
          brands: 'Serra, Café Serra',
          categories: 'Beverages, Coffees',
          quantity: '500 g',
        },
      }),
    )
    expect(dados.nome).toBe('Café Torrado')
    expect(dados.marca).toBe('Serra')
    expect(dados.categoriaSugerida).toBe('Bebidas')
    expect(dados.quantidadeRotulo).toBe('500 g')
  })

  it('avisa quando o EAN não está na base', async () => {
    await expect(consultarEan('7890000000000', mockFetch({ status: 0 }))).rejects.toThrow(/não encontrado/i)
  })

  it('rejeita código fora do padrão antes da rede', async () => {
    const fetchMock = mockFetch({})
    await expect(consultarEan('123', fetchMock)).rejects.toThrow(/13 dígitos/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('orienta cadastro manual sem rede', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('offline')
    })
    await expect(consultarEan('7891234000187', fetchMock)).rejects.toThrow(/manualmente/i)
  })
})
