import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMercadoStore } from '../mercado.store'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

function turno(store: ReturnType<typeof useMercadoStore>) {
  store.abrirTurno(100, 'dono')
}

describe('fonte única operacional', () => {
  it('venda gera livro + resumo operacional', () => {
    const store = useMercadoStore()
    turno(store)
    const produto = store.produtos.find((p) => p.lotes.some((l) => l.estado === 'LIBERADO' && l.quantidade > 1))!
    store.adicionarProduto(produto.id, 1)
    const venda = store.finalizarVenda({ forma: 'DINHEIRO', valorRecebido: 10000, troco: 0 })
    expect(store.livro.some((m) => m.tipo === 'venda' && m.referencia === `venda-${venda.numero}`)).toBe(true)
    expect(store.resumoOperacional.receita).toBeGreaterThan(0)
    expect(store.eventos.some((e) => e.tipo === 'venda')).toBe(true)
  })

  it('desossa e maturação viram estoque com rastreabilidade', () => {
    const store = useMercadoStore()
    const total = store.aplicarDesossaAoEstoque(
      { pecaBruta: { id: 'peca-1', fornecedor: 'F' }, saidas: [{ nome: 'Corte Teste', pesoKg: 5, classificacao: 'CORTE', destino: null }], custoEfetivoPorKg: 40 },
      'dono',
    )
    expect(total).toBe(1)
    const lote = store.produtos.flatMap((p) => p.lotes).find((l) => l.origem?.tipo === 'desossa')
    expect(lote).toBeTruthy()
    store.aplicarMaturacaoAoEstoque({ id: 'peca-m1', nome: 'Ancho Teste', pesoAtualKg: 8, custoInicialPorKg: 50, pesoInicialKg: 10 }, 'dono')
    expect(store.produtos.flatMap((p) => p.lotes).some((l) => l.origem?.tipo === 'maturacao')).toBe(true)
  })

  it('quarentena libera com auditoria', () => {
    const store = useMercadoStore()
    store.registrarRecebimento({ produtoId: 'picanha', fornecedor: 'F', quantidade: 2, custoUnitario: 50, lote: 'LQ1', validade: '2027-01-01', divergencia: 'avaria', operador: 'dono' })
    store.liberarQuarentena('picanha', 'LQ1', 'dono')
    expect(store.livro.some((m) => m.tipo === 'liberacao_quarentena')).toBe(true)
  })
})
