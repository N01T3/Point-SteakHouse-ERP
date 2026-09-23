import { describe, expect, it } from 'vitest'
import { criarChecklist, validarTemperatura } from '../checklists'
import { montarDreReal, validarCustoFixo } from '../../../financeiro/tipos'

describe('novas operações', () => {
  it('valida custo fixo', () => {
    expect(validarCustoFixo({ descricao: '', categoria: 'X', centroCusto: 'Y', valorMensal: 10 })).toContain('Descrição')
    expect(validarCustoFixo({ descricao: 'Aluguel', categoria: 'X', centroCusto: 'Y', valorMensal: 0 })).toContain('maior')
    expect(validarCustoFixo({ descricao: 'Aluguel', categoria: 'X', centroCusto: 'Y', valorMensal: 100 })).toBeNull()
  })

  it('DRE real desconta fixos, contas e desperdício', () => {
    const dre = montarDreReal({ receita: 10000, cmv: 4000, custosFixos: 2000, contasPagas: 500, desperdicio: 300 })
    expect(dre.lucroBruto).toBe(6000)
    expect(dre.lucroLiquido).toBe(3200)
  })

  it('checklist exige todos os itens', () => {
    expect(() => criarChecklist('abertura', 'Rita', [true])).toThrow()
    const chk = criarChecklist('abertura', 'Rita', [true, true, true, true], 'ok')
    expect(chk.itens.length).toBe(4)
  })

  it('temperatura valida faixa e responsável', () => {
    expect(validarTemperatura('', 2, 'Rita')).toContain('Local')
    expect(validarTemperatura('Câmara', 99, 'Rita')).toContain('faixa')
    expect(validarTemperatura('Câmara', 2, '')).toContain('Responsável')
    expect(validarTemperatura('Câmara', 2, 'Rita')).toBeNull()
  })
})
