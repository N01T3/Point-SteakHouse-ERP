import { describe, expect, it } from 'vitest'
import { filtrarMenuPorPapel, podeAcessarRota, ROTA_INICIAL_POR_PAPEL } from '../papel'

describe('navegação por cargo', () => {
  it('caixa enxerga apenas a operação do mercado', () => {
    const rotas = filtrarMenuPorPapel('CAIXA').map((item) => item.rota)
    expect(rotas).toEqual(['mercado'])
  })

  it('açougueiro não enxerga finanças nem caixa', () => {
    const rotas = filtrarMenuPorPapel('ACOUGUEIRO').map((item) => item.rota)
    expect(rotas).toContain('acougueiro')
    expect(rotas).toContain('maturacao')
    expect(rotas).not.toContain('financeiro')
    expect(rotas).not.toContain('mercado')
    expect(rotas).not.toContain('configuracoes')
  })

  it('administrador não gerencia configurações restritas ao proprietário', () => {
    const rotas = filtrarMenuPorPapel('ADMINISTRADOR').map((item) => item.rota)
    expect(rotas).toContain('financeiro')
    expect(rotas).toContain('administrador')
    expect(rotas).not.toContain('configuracoes')
  })

  it('proprietário enxerga todas as áreas', () => {
    const rotas = filtrarMenuPorPapel('PROPRIETARIO').map((item) => item.rota)
    expect(rotas).toEqual(
      expect.arrayContaining([
        'dashboard',
        'mercado',
        'acougueiro',
        'maturacao',
        'seguranca-biologica',
        'desossa-subprodutos',
        'clientes',
        'estoque',
        'financeiro',
        'administrador',
        'configuracoes',
      ]),
    )
  })

  it('bloqueia rota sem papel permitido', () => {
    expect(podeAcessarRota('CAIXA', ['PROPRIETARIO', 'ADMINISTRADOR'])).toBe(false)
    expect(podeAcessarRota('CAIXA', ['PROPRIETARIO', 'ADMINISTRADOR', 'CAIXA'])).toBe(true)
    expect(podeAcessarRota(null, ['PROPRIETARIO'])).toBe(false)
    expect(podeAcessarRota('CAIXA')).toBe(true)
  })

  it('cada cargo abre na sua área inicial', () => {
    expect(ROTA_INICIAL_POR_PAPEL).toEqual({
      PROPRIETARIO: '/dashboard',
      ADMINISTRADOR: '/administrador',
      ACOUGUEIRO: '/acougueiro',
      CAIXA: '/mercado',
    })
  })
})
