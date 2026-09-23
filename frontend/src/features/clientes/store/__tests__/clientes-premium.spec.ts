import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useClientesStore } from '../clientes.store'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('clientes premium', () => {
  it('registra venda fiado e estorna no cancelamento', () => {
    const store = useClientesStore()
    const antes = store.clientes.find((c) => c.id === 'cli-joao')!.saldo
    store.registrarVendaFiado('cli-joao', 100, 99, 'caixa')
    expect(store.clientes.find((c) => c.id === 'cli-joao')!.saldo).toBe(antes + 100)
    expect(store.historicoCompras('cli-joao').some((l) => l.vendaNumero === 99)).toBe(true)
    store.estornarVendaFiado('cli-joao', 100, 99, 'dono', 'cancelamento')
    expect(store.clientes.find((c) => c.id === 'cli-joao')!.saldo).toBe(antes)
  })

  it('salva preferências e cria reservas', () => {
    const store = useClientesStore()
    store.salvarPreferencias('cli-ana', ['picanha', 'ancho'], 'prefere dry aged')
    expect(store.clientes.find((c) => c.id === 'cli-ana')!.cortesPreferidos).toContain('picanha')
    const r = store.criarReserva('cli-ana', 'Picanha maturada', '2 kg', undefined, 'caixa')
    expect(r.status).toBe('aberta')
    store.atualizarReserva(r.id, 'pronta')
    expect(store.reservas.find((x) => x.id === r.id)!.status).toBe('pronta')
  })
})
