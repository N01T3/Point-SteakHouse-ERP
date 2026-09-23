import { describe, expect, it } from 'vitest'
import {
  calcularProgressoPercentual,
  estaProntaNestaSemana,
} from '../listar-pecas-em-maturacao.use-case.js'

describe('calcularProgressoPercentual', () => {
  it('calcula o percentual proporcional para uma peça em andamento', () => {
    expect(calcularProgressoPercentual({ nome: 'x', tipo: 'dry_aged', diasAtual: 34, diasTotal: 45 })).toBe(76)
  })

  it('satura em 100% quando diasAtual excede diasTotal (maturação além do previsto)', () => {
    expect(calcularProgressoPercentual({ nome: 'x', tipo: 'dry_aged', diasAtual: 50, diasTotal: 45 })).toBe(100)
  })
})

describe('estaProntaNestaSemana', () => {
  it('considera pronta quando faltam 7 dias ou menos', () => {
    expect(estaProntaNestaSemana({ nome: 'x', tipo: 'wet_aged', diasAtual: 3, diasTotal: 10 })).toBe(true)
  })

  it('considera pronta no exato limite de diasAtual === diasTotal', () => {
    expect(estaProntaNestaSemana({ nome: 'x', tipo: 'wet_aged', diasAtual: 10, diasTotal: 10 })).toBe(true)
  })

  it('não considera pronta quando faltam mais de 7 dias', () => {
    expect(estaProntaNestaSemana({ nome: 'x', tipo: 'dry_aged', diasAtual: 12, diasTotal: 60 })).toBe(false)
  })

  it('não conta como "pronta na semana" uma peça já além do previsto (evita dupla contagem de atraso)', () => {
    expect(estaProntaNestaSemana({ nome: 'x', tipo: 'dry_aged', diasAtual: 50, diasTotal: 45 })).toBe(false)
  })
})
