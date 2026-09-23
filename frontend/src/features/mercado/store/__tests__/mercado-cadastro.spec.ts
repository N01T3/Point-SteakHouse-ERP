import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMercadoStore } from '../mercado.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

const BASE = {
  nome: 'Coxão Mole',
  categoria: 'Carnes',
  unidade: 'KG' as const,
  preco: 49.9,
  custoMedio: 32,
  estoqueMinimo: 5,
  estoqueAlvo: 15,
}

describe('cadastrarProduto', () => {
  it('cadastra com EAN-13 válido (GS1 Brasil)', () => {
    const store = useMercadoStore()
    const antes = store.produtos.length
    const p = store.cadastrarProduto({ ...BASE, codigoBarras: '7891234000231' }, 'dono')
    // 789123400023 → DV? validado pelo próprio store; confere que entrou
    expect(store.produtos.length).toBe(antes + 1)
    expect(p.id).toBe('coxao-mole')
  })

  it('rejeita EAN com dígito inválido', () => {
    const store = useMercadoStore()
    expect(() => store.cadastrarProduto({ ...BASE, nome: 'Teste A', codigoBarras: '7891234000011' }, 'dono')).toThrow(
      /inválido|confere/i,
    )
  })

  it('rejeita código duplicado', () => {
    const store = useMercadoStore()
    expect(() => store.cadastrarProduto({ ...BASE, nome: 'Teste B', codigoBarras: '7891234000019' }, 'dono')).toThrow(
      /já está cadastrado/i,
    )
  })

  it('rejeita etiqueta de balança (prefixo 2) no cadastro', () => {
    const store = useMercadoStore()
    expect(() => store.cadastrarProduto({ ...BASE, nome: 'Teste C', codigoBarras: '2000101004509' }, 'dono')).toThrow(
      /PLU/i,
    )
  })

  it('cadastra só com PLU e rejeita PLU duplicado', () => {
    const store = useMercadoStore()
    const p = store.cadastrarProduto({ ...BASE, nome: 'Teste D', plu: '999' }, 'dono')
    expect(p.plu).toBe('999')
    expect(() => store.cadastrarProduto({ ...BASE, nome: 'Teste E', plu: '101' }, 'dono')).toThrow(/PLU/i)
  })

  it('exige ao menos EAN ou PLU', () => {
    const store = useMercadoStore()
    expect(() => store.cadastrarProduto({ ...BASE, nome: 'Teste F' }, 'dono')).toThrow(/EAN.*PLU|PLU/i)
  })
})

describe('cadastro assistido pelo bip', () => {
  it('solicita e consome o EAN uma única vez', () => {
    const store = useMercadoStore()
    expect(store.eanParaCadastrar).toBeNull()
    store.solicitarCadastroEan('7891234999993')
    expect(store.eanParaCadastrar).toBe('7891234999993')
    expect(store.consumirEanParaCadastrar()).toBe('7891234999993')
    expect(store.eanParaCadastrar).toBeNull()
    expect(store.consumirEanParaCadastrar()).toBeNull()
  })
})

describe('banco local do catálogo', () => {
  it('exporta, importa e restaura a demo', () => {
    const store = useMercadoStore()
    const json = store.exportarCatalogo()
    expect(JSON.parse(json).produtos.length).toBeGreaterThan(0)
    store.cadastrarProduto(
      { nome: 'Produto Local', categoria: 'Geral', unidade: 'UN', preco: 5, custoMedio: 3, plu: '998', estoqueMinimo: 0, estoqueAlvo: 0 },
      'dono',
    )
    const total = store.importarCatalogo(json, 'dono')
    expect(store.produtos.some((p) => p.id === 'produto-local')).toBe(false)
    expect(total).toBe(JSON.parse(json).produtos.length)
    expect(() => store.importarCatalogo('não é json', 'dono')).toThrow(/JSON/i)
  })
})
