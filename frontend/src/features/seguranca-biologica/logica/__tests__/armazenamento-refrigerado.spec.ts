import { describe, expect, it } from 'vitest'
import {
  calcularDiasArmazenado,
  classificarStatusDeArmazenamento,
  LIMITE_ATENCAO_DIAS,
  LIMITE_VENCIDO_DIAS,
} from '../armazenamento-refrigerado'

describe('calcularDiasArmazenado', () => {
  it('calcula a diferença em dias entre a data de reserva e agora', () => {
    const agora = new Date('2026-01-10T12:00:00')
    const reservadoDesde = new Date('2026-01-08T12:00:00')
    expect(calcularDiasArmazenado(reservadoDesde, agora)).toBeCloseTo(2)
  })
})

describe('classificarStatusDeArmazenamento', () => {
  it('classifica como fresco abaixo do limite de atenção', () => {
    expect(classificarStatusDeArmazenamento(LIMITE_ATENCAO_DIAS - 0.1)).toBe('fresco')
  })

  it('classifica como atenção exatamente no limite de atenção (3 dias)', () => {
    expect(classificarStatusDeArmazenamento(LIMITE_ATENCAO_DIAS)).toBe('atencao')
  })

  it('classifica como vencido exatamente no limite de 5 dias', () => {
    expect(classificarStatusDeArmazenamento(LIMITE_VENCIDO_DIAS)).toBe('vencido')
  })

  it('classifica como vencido bem além do limite', () => {
    expect(classificarStatusDeArmazenamento(10)).toBe('vencido')
  })
})
