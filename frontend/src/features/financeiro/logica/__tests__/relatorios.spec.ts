import { describe, expect, it } from 'vitest'
import type { ProdutoMercado, Venda } from '../../../mercado/tipos'
import { resolverGrupo } from '../../../mercado/logica/grupos'
import {
  enriquecerItens,
  filtrarVendas,
  margemRealPorProduto,
  perdasPorGrupo,
  relatorioPorFornecedor,
  relatorioPorGrupo,
  relatorioPorHora,
  relatorioPorOperador,
  relatorioPorPagamento,
  resumirAuditoria,
  vendasValidas,
} from '../relatorios'

function produto(parcial: Partial<ProdutoMercado> & { id: string }): ProdutoMercado {
  return {
    nome: parcial.id,
    categoria: 'Carnes',
    unidade: 'KG',
    preco: 10,
    custoMedio: 6,
    estoqueMinimo: 1,
    estoqueAlvo: 2,
    lotes: [],
    ...parcial,
  } as ProdutoMercado
}

function venda(parcial: Partial<Venda> & { id: string; numero: number }): Venda {
  return {
    itens: [],
    subtotal: 0,
    descontoTotal: 0,
    total: 0,
    pagamento: { forma: 'DINHEIRO' },
    valorDinheiro: 0,
    valorFiado: 0,
    operador: 'caixa',
    criadaEm: new Date(2026, 8, 22, 10, 0, 0).toISOString(),
    sincronizada: true,
    estado: 'CONCLUIDA',
    ...parcial,
  } as Venda
}

const PRODUTOS = [
  produto({ id: 'picanha', nome: 'Picanha', categoria: 'Carnes', grupo: 'Carnes', subgrupo: 'Cortes bovinos', preco: 100, custoMedio: 60, fornecedor: 'Frig' }),
  produto({ id: 'carvao', nome: 'Carvão', categoria: 'Churrasco', grupo: 'Churrasco', subgrupo: 'Carvão e acendimento', unidade: 'UN', preco: 20, custoMedio: 12, fornecedor: 'Carvão Nativo' }),
]

const VENDAS: Venda[] = [
  venda({
    id: 'v1', numero: 1, operador: 'ana', criadaEm: new Date(2026, 8, 22, 9, 15, 0).toISOString(),
    pagamento: { forma: 'DINHEIRO', valorRecebido: 200 }, total: 180, subtotal: 180,
    itens: [{ produtoId: 'picanha', nome: 'Picanha', unidade: 'KG', quantidade: 2, precoUnitario: 100, descontoPromo: 20, descontoManual: 0, lote: 'L1', validade: '2026-10-01' }],
  }),
  venda({
    id: 'v2', numero: 2, operador: 'bruno', criadaEm: new Date(2026, 8, 22, 18, 30, 0).toISOString(),
    pagamento: { forma: 'PIX' }, total: 40, subtotal: 40,
    itens: [{ produtoId: 'carvao', nome: 'Carvão', unidade: 'UN', quantidade: 2, precoUnitario: 20, descontoPromo: 0, descontoManual: 0, lote: 'C1', validade: '2027-01-01' }],
  }),
  venda({
    id: 'v3', numero: 3, operador: 'ana', criadaEm: new Date(2026, 8, 22, 19, 0, 0).toISOString(), estado: 'CANCELADA',
    pagamento: { forma: 'DINHEIRO' }, total: 50, subtotal: 50,
    itens: [{ produtoId: 'picanha', nome: 'Picanha', unidade: 'KG', quantidade: 0.5, precoUnitario: 100, descontoPromo: 0, descontoManual: 0, lote: 'L1', validade: '2026-10-01' }],
  }),
]

describe('relatórios gerenciais', () => {
  it('resolve grupo com fallback para dados antigos', () => {
    expect(resolverGrupo({ id: 'picanha', nome: 'Picanha', categoria: 'Carnes' })).toEqual({ grupo: 'Carnes', subgrupo: 'Cortes bovinos' })
    expect(resolverGrupo({ id: 'x', nome: 'X', categoria: 'Carnes', grupo: 'Carnes', subgrupo: 'Maturados' }).subgrupo).toBe('Maturados')
  })

  it('enriquece itens com snapshot e preserva histórico', () => {
    const itens = enriquecerItens([VENDAS[0]], PRODUTOS)
    expect(itens[0].grupo).toBe('Carnes')
    expect(itens[0].receita).toBe(180)
    expect(itens[0].cmv).toBe(120)
    expect(itens[0].lucro).toBe(60)
  })

  it('cancelada sai do faturamento mas conta na auditoria e na hora', () => {
    expect(vendasValidas(VENDAS).length).toBe(2)
    const hora = relatorioPorHora(VENDAS, PRODUTOS)
    expect(hora[9].vendas).toBe(1)
    expect(hora[19].cancelamentos).toBe(1)
    expect(hora[19].vendas).toBe(0)
    const aud = resumirAuditoria(VENDAS, [])
    expect(aud.canceladas).toBe(1)
    expect(aud.vendasValidas).toBe(2)
  })

  it('grupo agrega receita, margem, participação e ABC', () => {
    const linhas = relatorioPorGrupo(VENDAS, PRODUTOS)
    expect(linhas.length).toBe(2)
    expect(linhas[0].grupo).toBe('Carnes')
    expect(linhas[0].classeABC).toBe('B')
    const soma = linhas.reduce((s, l) => s + l.participacao, 0)
    expect(soma).toBeCloseTo(1, 5)
  })

  it('hora calcula ticket, CMV e margem', () => {
    const hora = relatorioPorHora(VENDAS, PRODUTOS)
    expect(hora[18].ticketMedio).toBe(40)
    expect(hora[9].margem).toBeCloseTo(60 / 180, 5)
  })

  it('filtra por grupo, forma e operador', () => {
    expect(filtrarVendas(VENDAS, PRODUTOS, { grupo: 'Carnes' }).length).toBe(2)
    expect(filtrarVendas(VENDAS, PRODUTOS, { forma: 'PIX' }).map((v) => v.id)).toEqual(['v2'])
    expect(filtrarVendas(VENDAS, PRODUTOS, { operador: 'bruno' }).map((v) => v.id)).toEqual(['v2'])
  })

  it('operador, pagamento, fornecedor e margem real', () => {
    expect(relatorioPorOperador(VENDAS).find((o) => o.operador === 'ana')?.cancelamentos).toBe(1)
    expect(relatorioPorPagamento(VENDAS)[0].participacao).toBeGreaterThan(0)
    expect(relatorioPorFornecedor(VENDAS, PRODUTOS).length).toBe(2)
    const margem = margemRealPorProduto(VENDAS, PRODUTOS)
    expect(margem[0].produtoId).toBe('picanha')
    expect(perdasPorGrupo([{ id: 'p', produtoId: 'picanha', produto: 'Picanha', lote: 'L1', quantidade: 1, valor: 60, motivo: 'validade', responsavel: 'r', criadaEm: '' }], PRODUTOS)[0].grupo).toBe('Carnes')
  })
})
