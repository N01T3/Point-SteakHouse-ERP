import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../../features/auth/store/auth.store'
import { lerModoSalvo, useModoDetalhado } from '../useModoDetalhado'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

async function entrarComo(identificador: string) {
  const auth = useAuthStore()
  await auth.entrar(identificador, '123')
  return auth
}

describe('modo simples/detalhado', () => {
  it('começa simples e só o proprietário ativa o detalhado', async () => {
    await entrarComo('dono')
    const { modo, podeDetalhar, definir } = useModoDetalhado()
    expect(modo.value).toBe('simples')
    expect(podeDetalhar()).toBe(true)
    definir('detalhado')
    expect(modo.value).toBe('detalhado')
  })

  it('administrador não consegue detalhado', async () => {
    await entrarComo('administrador')
    const { modo, definir } = useModoDetalhado()
    definir('detalhado')
    expect(modo.value).toBe('simples')
  })

  it('preferência é salva por usuário', async () => {
    await entrarComo('dono')
    const { definir } = useModoDetalhado()
    definir('detalhado')
    expect(lerModoSalvo('usuario-dono')).toBe('detalhado')
    expect(lerModoSalvo('usuario-admin')).toBe('simples')
  })
})
