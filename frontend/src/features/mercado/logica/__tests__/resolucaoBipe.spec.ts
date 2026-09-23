import { describe, expect, it } from 'vitest'
import { PRODUTOS_MOCK } from '../../mock/mercado.mock'
import { digitoVerificadorEAN, validarEAN13 } from '../codigoBarras'
import { normalizarPlu, resolverBipe } from '../resolucaoBipe'

describe('base demo de produtos', () => {
  it('todos os EANs cadastrados são estruturalmente válidos', () => {
    const comEan = PRODUTOS_MOCK.filter((p) => p.codigoBarras)
    expect(comEan.length).toBeGreaterThan(0)
    for (const produto of comEan) {
      expect(validarEAN13(produto.codigoBarras as string)).toBe(true)
    }
  })

  it('todo produto tem ao menos EAN ou PLU (exigência do cadastro)', () => {
    for (const produto of PRODUTOS_MOCK) {
      expect(produto.codigoBarras ?? produto.plu).toBeTruthy()
    }
  })
})

describe('normalizarPlu', () => {
  it('remove zeros à esquerda da etiqueta', () => {
    expect(normalizarPlu('00101')).toBe('101')
    expect(normalizarPlu('101')).toBe('101')
  })
})

describe('resolverBipe', () => {
  it('EAN de produto unitário adiciona 1 direto', () => {
    const r = resolverBipe('7891234000187', PRODUTOS_MOCK) // café
    expect(r).toEqual({ tipo: 'adicionar', produtoId: 'cafe', quantidade: 1, origem: 'bip Café Torrado 500g' })
  })

  it('EAN de produto por peso pede pesagem', () => {
    const r = resolverBipe('7891234000019', PRODUTOS_MOCK) // picanha
    expect(r.tipo).toBe('pesar')
    if (r.tipo === 'pesar') expect(r.produtoId).toBe('picanha')
  })

  it('PLU de carne pede pesagem; PLU com zeros funciona', () => {
    const r = resolverBipe('00101', PRODUTOS_MOCK)
    expect(r.tipo).toBe('pesar')
  })

  it('etiqueta de balança com preço vira quantidade (preço ÷ R$/kg)', () => {
    // 20 + 00101 (picanha PLU 101) + R$ 44,95 + DV
    const base = '200010104495'
    const codigo = base + digitoVerificadorEAN(base)
    const r = resolverBipe(codigo, PRODUTOS_MOCK)
    expect(r.tipo).toBe('adicionar')
    if (r.tipo === 'adicionar') {
      expect(r.produtoId).toBe('picanha')
      expect(r.quantidade).toBeCloseTo(44.95 / 89.9, 3)
    }
  })

  it('etiqueta de balança com peso adiciona o peso direto', () => {
    // 21 + 00103 (fraldinha PLU 103) + 1250 g + DV
    const base = '210010301250'
    const codigo = base + digitoVerificadorEAN(base)
    const r = resolverBipe(codigo, PRODUTOS_MOCK)
    expect(r).toMatchObject({ tipo: 'adicionar', produtoId: 'fraldinha', quantidade: 1.25 })
  })

  it('EAN válido mas desconhecido pede cadastro', () => {
    const r = resolverBipe('7891234999993', PRODUTOS_MOCK)
    expect(r).toEqual({ tipo: 'erro', mensagem: expect.stringContaining('não cadastrado') })
  })

  it('EAN com dígito errado orienta a bipar de novo', () => {
    expect(resolverBipe('7891234000011', PRODUTOS_MOCK).tipo).toBe('erro')
  })

  it('nome digitado cai na busca manual', () => {
    expect(resolverBipe('picanha', PRODUTOS_MOCK)).toEqual({ tipo: 'busca' })
    expect(resolverBipe('', PRODUTOS_MOCK)).toEqual({ tipo: 'busca' })
  })
})

describe('sinalSonoro', () => {
  it('não quebra fora do browser', async () => {
    const { emitirBipe } = await import('../sinalSonoro')
    expect(() => emitirBipe(true)).not.toThrow()
  })
})
