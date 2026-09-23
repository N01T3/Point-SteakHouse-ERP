import { beforeEach, describe, expect, it, vi } from 'vitest'

const CHAVE = 'point_demo_primeiro_uso'

async function importarMock() {
  vi.resetModules()
  return import('../auth.mock')
}

beforeEach(() => {
  vi.stubEnv('VITE_AMOSTRA_ONLINE', 'true')
  vi.stubEnv('VITE_DEMO_USUARIO', 'demo')
  vi.stubEnv('VITE_DEMO_SENHA', 'segredo-teste')
  localStorage.clear()
  vi.useRealTimers()
})

describe('amostra online: credencial única com queima de 4h', () => {
  it('aceita só demo/segredo-teste e rejeita as contas de dev', async () => {
    const { login } = await importarMock()
    await expect(login('dono', '123')).rejects.toThrow(/inválidas/i)
    await expect(login('demo', 'errada')).rejects.toThrow(/inválidas/i)
    const resposta = await login('demo', 'segredo-teste')
    expect(resposta.usuario.identificador).toBe('demo')
    expect(resposta.usuario.papel).toBe('PROPRIETARIO')
  })

  it('senha vazia no dashboard cai no padrão documentado (sem travamento total)', async () => {
    vi.stubEnv('VITE_DEMO_SENHA', '')
    const { login } = await importarMock()
    const { SENHA_DEMO_PADRAO } = await import('../auth.mock')
    const resposta = await login('demo', SENHA_DEMO_PADRAO)
    expect(resposta.usuario.identificador).toBe('demo')
  })
  it('carimba o primeiro uso e bloqueia após 4h', async () => {
    const { DEMO_DURACAO_MS, demonstracaoExpirada, login, obterTempoRestanteDemo } =
      await importarMock()
    expect(DEMO_DURACAO_MS).toBe(4 * 60 * 60 * 1000)
    expect(localStorage.getItem(CHAVE)).toBeNull()

    await login('demo', 'segredo-teste')
    const primeiro = Number(localStorage.getItem(CHAVE))
    expect(primeiro).toBeGreaterThan(0)
    expect(demonstracaoExpirada()).toBe(false)
    expect(obterTempoRestanteDemo()).toBeGreaterThan(0)

    // Simula 4h + 1s depois do primeiro uso.
    expect(demonstracaoExpirada(primeiro + DEMO_DURACAO_MS + 1000)).toBe(true)
    vi.setSystemTime(new Date(primeiro + DEMO_DURACAO_MS + 1000))
    await expect(login('demo', 'segredo-teste')).rejects.toThrow(/expirada/i)
  })

  it('ignora espaços acidentais nas envs do dashboard', async () => {
    vi.stubEnv('VITE_AMOSTRA_ONLINE', ' true ')
    vi.stubEnv('VITE_DEMO_SENHA', '  segredo-teste  ')
    const { login, modoAmostraOnline } = await importarMock()
    expect(modoAmostraOnline()).toBe(true)
    const resposta = await login('demo', 'segredo-teste')
    expect(resposta.usuario.identificador).toBe('demo')
  })
  it('bloqueia redefinição de senha na amostra', async () => {
    const { redefinirSenhaMock } = await importarMock()
    expect(() => redefinirSenhaMock('demo', 'nova')).toThrow(/indisponível/i)
  })
})
