import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMercadoStore } from '../mercado.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('transferências entre locais', () => {
  it('move quantidade parcial dividindo a linha do lote', () => {
    const store = useMercadoStore()
    // picanha L2408 começa sem local (= Loja), 8,4 kg
    store.transferirEstoque('picanha', 'L2408', 'Loja', 'Balcão', 2, 'Abastecer balcão', 'Rita')
    const picanha = store.produtos.find((p) => p.id === 'picanha')
    const origem = picanha?.lotes.find((l) => l.lote === 'L2408' && (l.local ?? 'Loja') === 'Loja')
    const destino = picanha?.lotes.find((l) => l.lote === 'L2408' && l.local === 'Balcão')
    expect(origem?.quantidade).toBeCloseTo(6.4, 3)
    expect(destino?.quantidade).toBe(2)
    expect(store.transferencias).toHaveLength(1)
  })

  it('rejeita saldo insuficiente e mesma origem/destino', () => {
    const store = useMercadoStore()
    expect(() => store.transferirEstoque('picanha', 'L2408', 'Loja', 'Balcão', 99, 'x', 'Rita')).toThrow(
      /insuficiente/i,
    )
    expect(() => store.transferirEstoque('picanha', 'L2408', 'Loja', 'Loja', 1, 'x', 'Rita')).toThrow(
      /diferentes/i,
    )
  })
})

describe('inventário', () => {
  it('contagem exata aprova direto; divergência aguarda e ajusta ao aprovar', () => {
    const store = useMercadoStore()
    const exata = store.registrarContagem('picanha', 'L2408', 'Loja', 8.4, 'cíclica', 'Rita')
    expect(exata.status).toBe('aprovada')
    const divergente = store.registrarContagem('picanha', 'L2408', 'Loja', 7, 'cíclica', 'Rita')
    expect(divergente.status).toBe('pendente')
    expect(divergente.diferenca).toBeCloseTo(-1.4, 3)
    store.aprovarContagem(divergente.id, 'dono')
    const linha = store.produtos.find((p) => p.id === 'picanha')?.lotes.find((l) => l.lote === 'L2408')
    expect(linha?.quantidade).toBeCloseTo(7, 3)
    expect(() => store.aprovarContagem(divergente.id, 'dono')).toThrow(/já aprovada/i)
  })
})

describe('fornecedores e pedidos', () => {
  it('cadastra fornecedor e abre pedido com total', () => {
    const store = useMercadoStore()
    const forn = store.cadastrarFornecedor({ nome: 'Novo Frigorífico' })
    expect(() => store.cadastrarFornecedor({ nome: 'novo frigorífico' })).toThrow(/já cadastrado/i)
    const pedido = store.criarPedido(
      forn.id,
      [{ produtoId: 'picanha', produto: 'Picanha', quantidade: 10, custoUnitario: 55 }],
      'dono',
    )
    expect(pedido.numero).toBe(1)
    expect(pedido.valorTotal).toBe(550)
    expect(pedido.status).toBe('aberto')
    store.atualizarStatusPedido(pedido.id, 'recebido')
    expect(store.pedidos[0].status).toBe('recebido')
  })

  it('gera pedido da reposição para o fornecedor', () => {
    const store = useMercadoStore()
    // força item abaixo do mínimo: zera filé (mínimo 10)
    const file = store.produtos.find((p) => p.id === 'file-mignon')
    if (file) file.lotes[0].quantidade = 1
    const pedido = store.criarPedidoDeReposicao('for-frig', 'dono')
    expect(pedido.itens.some((i) => i.produtoId === 'file-mignon')).toBe(true)
  })
})

describe('recall por lote', () => {
  it('mostra estoque por local e vendas afetadas', () => {
    const store = useMercadoStore()
    store.abrirTurno(200, 'Marcos')
    store.adicionarProduto('picanha', 1)
    store.finalizarVenda({ forma: 'PIX' })
    const rastro = store.rastroDoLote('L2408')
    expect(rastro.produto).toBe('Picanha')
    expect(rastro.estoquePorLocal.length).toBeGreaterThan(0)
    expect(rastro.vendas).toHaveLength(1)
    expect(rastro.vendas[0].numero).toBe(1)
  })

  it('lote inexistente retorna vazio, sem erro', () => {
    const store = useMercadoStore()
    const rastro = store.rastroDoLote('LXXXX')
    expect(rastro.produto).toBeUndefined()
    expect(rastro.vendas).toHaveLength(0)
  })
})
