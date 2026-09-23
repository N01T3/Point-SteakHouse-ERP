import { describe, expect, it } from 'vitest'
import { percentualDoLimite, proximoDoLimite, ultrapassouOLimite } from '../zona-de-perigo'

describe('ultrapassouOLimite', () => {
  it('não ultrapassa um minuto antes do limite', () => {
    expect(ultrapassouOLimite(239, 240)).toBe(false)
  })

  it('ultrapassa no exato limite de 240 minutos', () => {
    expect(ultrapassouOLimite(240, 240)).toBe(true)
  })

  it('ultrapassa além do limite', () => {
    expect(ultrapassouOLimite(300, 240)).toBe(true)
  })
})

describe('percentualDoLimite', () => {
  it('nunca excede 100%, mesmo bem acima do limite', () => {
    expect(percentualDoLimite(500, 240)).toBe(1)
  })
})

describe('proximoDoLimite', () => {
  it('não alerta com acúmulo baixo', () => {
    expect(proximoDoLimite(100, 240)).toBe(false)
  })

  it('alerta a partir de 80% do limite, mas antes de ultrapassá-lo', () => {
    expect(proximoDoLimite(200, 240)).toBe(true)
  })

  it('deixa de alertar como "próximo" quando já ultrapassou (é outro estado)', () => {
    expect(proximoDoLimite(240, 240)).toBe(false)
  })
})
