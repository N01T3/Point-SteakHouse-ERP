import { describe, expect, it } from 'vitest'
import { PRODUTOS_MOCK } from '../../mock/mercado.mock'
import type { ProdutoMercado } from '../../tipos'
import {
  VERSAO_CATALOGO,
  mesclarCatalogo,
  serializarCatalogo,
  validarCatalogoImportado,
} from '../catalogoPersistido'

describe('catálogo persistido', () => {
  it('serializa com versão e data', () => {
    const salvo = serializarCatalogo(PRODUTOS_MOCK)
    expect(salvo.versao).toBe(VERSAO_CATALOGO)
    expect(salvo.produtos).toHaveLength(PRODUTOS_MOCK.length)
  })

  it('sem salvo, usa a base demo', () => {
    expect(mesclarCatalogo(PRODUTOS_MOCK, null)).toBe(PRODUTOS_MOCK)
  })

  it('mesma versão: local manda', () => {
    const local = [{ ...PRODUTOS_MOCK[0], preco: 999 }]
    const mesclado = mesclarCatalogo(PRODUTOS_MOCK, { versao: VERSAO_CATALOGO, salvoEm: '', produtos: local as ProdutoMercado[] })
    expect(mesclado[0].preco).toBe(999)
  })

  it('versão antiga: mantém locais e acrescenta novos da base', () => {
    const local = [{ ...PRODUTOS_MOCK[0], preco: 999 }]
    const mesclado = mesclarCatalogo(PRODUTOS_MOCK, { versao: 1, salvoEm: '', produtos: local as ProdutoMercado[] })
    expect(mesclado[0].preco).toBe(999)
    expect(mesclado).toHaveLength(PRODUTOS_MOCK.length)
    expect(mesclado.some((p) => p.id === 'cafe')).toBe(true)
  })

  it('valida importação e rejeita arquivo ruim', () => {
    const bons = validarCatalogoImportado([{ nome: 'X', preco: 10, unidade: 'UN' }])
    expect(bons[0].id).toContain('importado')
    expect(() => validarCatalogoImportado([])).toThrow(/sem produtos/i)
    expect(() => validarCatalogoImportado([{ nome: 'X', preco: 0 }])).toThrow(/preço/i)
    expect(() => validarCatalogoImportado([{ preco: 10 }])).toThrow(/sem nome/i)
  })
})
