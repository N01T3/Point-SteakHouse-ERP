import { beforeEach, describe, expect, it, vi } from 'vitest'

const CHAVE = 'point_site_primeira_visita'

async function importarPrazo() {
  vi.resetModules()
  return import('../prazo-do-site')
}

beforeEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.stubEnv('VITE_AMOSTRA_ONLINE', 'true')
  vi.stubEnv('VITE_AMOSTRA_EXPIRA_EM', '')
})

describe('prazo do site da amostra', () => {
  it('não expira fora do modo amostra', async () => {
    vi.stubEnv('VITE_AMOSTRA_ONLINE', 'false')
    vi.stubEnv('VITE_AMOSTRA_EXPIRA_EM', new Date(Date.now() - 1000).toISOString())
    const { obterExpiracaoDoSite, siteExpirado } = await importarPrazo()
    expect(obterExpiracaoDoSite()).toBeNull()
    expect(siteExpirado()).toBe(false)
  })

  it('usa VITE_AMOSTRA_EXPIRA_EM quando configurado', async () => {
    const futuro = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    vi.stubEnv('VITE_AMOSTRA_EXPIRA_EM', futuro)
    const { obterExpiracaoDoSite, obterTempoRestanteDoSite, siteExpirado } = await importarPrazo()
    expect(obterExpiracaoDoSite()).toBe(Date.parse(futuro))
    expect(siteExpirado()).toBe(false)
    expect(obterTempoRestanteDoSite()).toBeGreaterThan(0)

    const passado = new Date(Date.now() - 1000).toISOString()
    vi.stubEnv('VITE_AMOSTRA_EXPIRA_EM', passado)
    const recarregado = await importarPrazo()
    expect(recarregado.siteExpirado()).toBe(true)
    expect(recarregado.obterTempoRestanteDoSite()).toBe(0)
  })

  it('ignora data inválida e usa o fallback da primeira visita', async () => {
    vi.stubEnv('VITE_AMOSTRA_EXPIRA_EM', 'não-é-data')
    const { DURACAO_PADRAO_SITE_MS, marcarPrimeiraVisita, siteExpirado } = await importarPrazo()
    expect(DURACAO_PADRAO_SITE_MS).toBe(14 * 60 * 60 * 1000)
    marcarPrimeiraVisita()
    expect(siteExpirado()).toBe(false)
    const primeira = Number(localStorage.getItem(CHAVE))
    expect(siteExpirado(primeira + DURACAO_PADRAO_SITE_MS + 1000)).toBe(true)
  })

  it('marcarPrimeiraVisita não sobrescreve o carimbo', async () => {
    const { marcarPrimeiraVisita } = await importarPrazo()
    marcarPrimeiraVisita(1000)
    marcarPrimeiraVisita(2000)
    expect(localStorage.getItem(CHAVE)).toBe('1000')
  })

  it('login da amostra é bloqueado com o site expirado', async () => {
    vi.stubEnv('VITE_DEMO_USUARIO', 'demo')
    vi.stubEnv('VITE_DEMO_SENHA', 'segredo-teste')
    vi.stubEnv('VITE_AMOSTRA_EXPIRA_EM', new Date(Date.now() - 1000).toISOString())
    const { login } = await import('../../../features/auth/services/auth.mock')
    await expect(login('demo', 'segredo-teste')).rejects.toThrow(/encerrado/i)
  })
})
