import { describe, expect, it } from 'vitest'
import { cadeiaDoLote, criarLancamento, saldoDoLivro } from '../livroMovimentos'

function lanc(parcial: Record<string, unknown> = {}) {
  return criarLancamento({
    tipo: 'recebimento',
    produtoId: 'picanha',
    produto: 'Picanha',
    lote: 'L1',
    quantidade: 10,
    motivo: 'teste',
    operador: 'dono',
    online: true,
    ...parcial,
  } as never)
}

describe('livro único de movimentos', () => {
  it('exige produto, lote, quantidade, motivo e operador', () => {
    expect(() => lanc({ produtoId: '' })).toThrow(/produto/i)
    expect(() => lanc({ lote: '' })).toThrow(/lote/i)
    expect(() => lanc({ quantidade: 0 })).toThrow(/quantidade/i)
    expect(() => lanc({ motivo: '' })).toThrow(/motivo/i)
    expect(() => lanc({ operador: '' })).toThrow(/operador/i)
  })

  it('saldo é derivado dos lançamentos', () => {
    const livro = [lanc({ quantidade: 10 }), lanc({ tipo: 'venda', quantidade: -3, motivo: 'venda #1' })]
    expect(saldoDoLivro(livro, 'picanha')).toBe(7)
    expect(saldoDoLivro(livro, 'picanha', 'L1')).toBe(7)
    expect(saldoDoLivro(livro, 'ancho')).toBe(0)
  })

  it('cadeia do lote vem em ordem cronológica', () => {
    const a = lanc({ criadaEm: '2026-01-02T00:00:00', motivo: 'b' })
    const b = lanc({ criadaEm: '2026-01-01T00:00:00', motivo: 'a' })
    expect(cadeiaDoLote([a, b], 'L1').map((m) => m.motivo)).toEqual(['a', 'b'])
  })
})
