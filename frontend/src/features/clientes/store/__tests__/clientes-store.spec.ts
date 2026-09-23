import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Cliente } from '../../tipos'
import { useClientesStore } from '../clientes.store'

function porId(store: ReturnType<typeof useClientesStore>, id: string): Cliente {
  const cliente = store.clientes.find((c) => c.id === id)
  if (!cliente) throw new Error(`seed sem ${id}`)
  return cliente
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('clientes store', () => {
  it('cadastra cliente com saldo zero e valida duplicidade', () => {
    const store = useClientesStore()
    const c = store.cadastrarCliente({ nome: 'Novo Cliente', limite: 100 }, 'dono')
    expect(c.saldo).toBe(0)
    expect(c.ativo).toBe(true)
    expect(() => store.cadastrarCliente({ nome: 'novo cliente', limite: 100 }, 'dono')).toThrow(/já existe/i)
  })

  it('quita parcial e total, registrando no extrato', () => {
    const store = useClientesStore()
    store.quitar('cli-ana', 20.5, 'dono', 'dinheiro')
    expect(store.clientes.find((c) => c.id === 'cli-ana')?.saldo).toBe(300)
    store.quitar('cli-bruno', 40, 'dono')
    expect(store.clientes.find((c) => c.id === 'cli-bruno')?.saldo).toBe(0)
    expect(store.extratoDoCliente('cli-bruno')[0].tipo).toBe('pagamento')
  })

  it('rejeita pagamento acima do saldo', () => {
    const store = useClientesStore()
    expect(() => store.quitar('cli-bruno', 41, 'dono')).toThrow(/acima do saldo/i)
  })

  it('limite nunca fica abaixo do saldo; bloqueio é automático no teto', () => {
    const store = useClientesStore()
    expect(() => store.ajustarLimite('cli-carla', 100)).toThrow(/abaixo do saldo/i)
    store.ajustarLimite('cli-carla', 300)
    expect(store.clientes.find((c) => c.id === 'cli-carla')?.limite).toBe(300)
    // Maria deve 250 de 250 → bloqueada; após pagamento parcial, libera
    expect(store.contaBloqueada(porId(store, 'cli-maria'))).toBe(true)
    store.quitar('cli-maria', 50, 'dono')
    expect(store.contaBloqueada(porId(store, 'cli-maria'))).toBe(false)
  })

  it('suspender e reativar cliente', () => {
    const store = useClientesStore()
    store.alternarAtivo('cli-joao')
    expect(store.clientes.find((c) => c.id === 'cli-joao')?.ativo).toBe(false)
    store.alternarAtivo('cli-joao')
    expect(store.clientes.find((c) => c.id === 'cli-joao')?.ativo).toBe(true)
  })
})
