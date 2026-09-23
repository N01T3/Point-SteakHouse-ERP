import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMercadoStore } from '../mercado.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

function turnoAberto() {
  const store = useMercadoStore()
  store.abrirTurno(200, 'Marcos')
  return store
}

describe('pagamento dividido', () => {
  it('combina cartão + dinheiro e alimenta o esperado só com o dinheiro', () => {
    const store = turnoAberto()
    store.adicionarProduto('cafe', 2) // 2 × 18,90 = 37,80
    const venda = store.finalizarVenda({
      forma: 'DIVIDIDO',
      parcelas: [
        { forma: 'CARTAO', valor: 20 },
        { forma: 'DINHEIRO', valor: 17.8 },
      ],
      valorRecebido: 20,
      troco: 2.2,
    })
    expect(venda.valorDinheiro).toBe(17.8)
    expect(venda.valorFiado).toBe(0)
    expect(store.esperadoDinheiro).toBeCloseTo(217.8, 2)
    expect(store.fiadoTurno).toBe(0)
  })

  it('rejeita parcelas que não somam o total', () => {
    const store = turnoAberto()
    store.adicionarProduto('cafe', 1)
    expect(() =>
      store.finalizarVenda({ forma: 'DIVIDIDO', parcelas: [{ forma: 'CARTAO', valor: 10 }, { forma: 'PIX', valor: 5 }] }),
    ).toThrow(/somam o total/i)
  })

  it('parcela fiada consome limite do cliente', () => {
    const store = turnoAberto()
    store.adicionarProduto('cafe', 2)
    const venda = store.finalizarVenda({
      forma: 'DIVIDIDO',
      parcelas: [
        { forma: 'CARTAO', valor: 10 },
        { forma: 'FIADO', valor: 27.8, clienteId: 'cli-bruno' },
      ],
    })
    expect(venda.valorFiado).toBe(27.8)
    expect(store.clientes.find((c) => c.id === 'cli-bruno')?.saldo).toBeCloseTo(67.8, 2)
    expect(store.fiadoTurno).toBeCloseTo(27.8, 2)
  })
})

describe('cancelamento de venda', () => {
  it('cancela com motivo, volta estoque e sai do faturamento', () => {
    const store = turnoAberto()
    store.adicionarProduto('cafe', 2)
    const venda = store.finalizarVenda({ forma: 'DINHEIRO', valorRecebido: 40, troco: 2.2 })
    expect(store.faturamentoTurno).toBeCloseTo(37.8, 2)
    store.cancelarVenda(venda.id, 'Erro de bipagem', 'dono')
    expect(venda.estado).toBe('CANCELADA')
    expect(venda.motivoCancelamento).toBe('Erro de bipagem')
    expect(store.faturamentoTurno).toBe(0)
    expect(store.esperadoDinheiro).toBe(200)
    const cafe = store.produtos.find((p) => p.id === 'cafe')
    expect(cafe?.lotes[0].quantidade).toBe(22)
  })

  it('estorna o fiado ao cancelar', () => {
    const store = turnoAberto()
    store.adicionarProduto('cafe', 1)
    const venda = store.finalizarVenda({ forma: 'FIADO', clienteId: 'cli-bruno' })
    expect(store.clientes.find((c) => c.id === 'cli-bruno')?.saldo).toBeCloseTo(58.9, 2)
    store.cancelarVenda(venda.id, 'Desistência', 'dono')
    expect(store.clientes.find((c) => c.id === 'cli-bruno')?.saldo).toBe(40)
  })

  it('exige motivo e só cancela venda concluída', () => {
    const store = turnoAberto()
    store.adicionarProduto('cafe', 1)
    const venda = store.finalizarVenda({ forma: 'PIX' })
    expect(() => store.cancelarVenda(venda.id, '', 'dono')).toThrow(/motivo/i)
    store.cancelarVenda(venda.id, 'ok', 'dono')
    expect(() => store.cancelarVenda(venda.id, 'de novo', 'dono')).toThrow(/concluída/i)
  })
})

describe('cupom e turno', () => {
  it('conta reimpressões para auditoria', () => {
    const store = turnoAberto()
    store.adicionarProduto('cafe', 1)
    const venda = store.finalizarVenda({ forma: 'PIX' })
    store.registrarReimpressao(venda.id)
    store.registrarReimpressao(venda.id)
    expect(venda.reimpressoes).toBe(2)
  })

  it('soma kg vendidos ignorando canceladas', () => {
    const store = turnoAberto()
    store.adicionarProduto('picanha', 0.5)
    const venda = store.finalizarVenda({ forma: 'DINHEIRO', valorRecebido: 50, troco: 5.05 })
    expect(store.kgVendidosTurno).toBe(0.5)
    store.cancelarVenda(venda.id, 'teste', 'dono')
    expect(store.kgVendidosTurno).toBe(0)
  })
})
