import { describe, expect, it } from 'vitest'
import type { Cliente } from '../../tipos'
import {
  aplicarPagamento,
  contaBloqueada,
  fiadoDisponivel,
  podeMarcarFiado,
  resumirCobranca,
  validarPagamento,
} from '../clientes'

function cliente(parcial: Partial<Cliente> = {}): Cliente {
  return {
    id: 'c1',
    nome: 'Ana Ferreira',
    limite: 500,
    saldo: 320.5,
    ativo: true,
    criadoEm: '2026-01-10T00:00:00',
    ...parcial,
  }
}

describe('conta corrente', () => {
  it('calcula disponível e permite venda dentro do limite', () => {
    const c = cliente()
    expect(fiadoDisponivel(c)).toBe(179.5)
    expect(podeMarcarFiado(c, 179.5)).toBe(true)
    expect(podeMarcarFiado(c, 180)).toBe(false)
  })

  it('bloqueia ao atingir o teto ou quando inativo', () => {
    expect(contaBloqueada(cliente({ saldo: 500 }))).toBe(true)
    expect(contaBloqueada(cliente({ ativo: false }))).toBe(true)
    expect(contaBloqueada(cliente())).toBe(false)
  })

  it('valida quitação parcial e total, rejeita acima do saldo', () => {
    const c = cliente()
    expect(validarPagamento(c, 100)).toBeNull()
    expect(validarPagamento(c, 320.5)).toBeNull()
    expect(validarPagamento(c, 321)).toContain('acima do saldo')
    expect(validarPagamento(c, 0)).toContain('maior que zero')
  })

  it('aplica pagamento sem centavos quebrados', () => {
    expect(aplicarPagamento(320.5, 20.5)).toBe(300)
  })

  it('resume a cobrança', () => {
    const resumo = resumirCobranca([
      cliente({ saldo: 320.5 }),
      cliente({ id: 'c2', nome: 'B', limite: 300, saldo: 300 }),
      cliente({ id: 'c3', nome: 'C', limite: 200, saldo: 0 }),
    ])
    expect(resumo.totalAberto).toBe(620.5)
    expect(resumo.devedores).toBe(2)
    expect(resumo.bloqueados).toBe(1)
  })
})
