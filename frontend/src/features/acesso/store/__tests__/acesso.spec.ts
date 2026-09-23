import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { redefinirSenhaMock } from '../../../auth/services/auth.mock'
import { useAcessoStore } from '../acesso.store'

beforeEach(() => {
  setActivePinia(createPinia())
  redefinirSenhaMock('caixa', '123')
})

describe('usuários', () => {
  it('bloqueia e reativa, mas nunca o proprietário', () => {
    const store = useAcessoStore()
    store.alternarAtivo('usuario-caixa', 'Dono', true)
    expect(store.usuarios.find((u) => u.id === 'usuario-caixa')?.ativo).toBe(false)
    expect(() => store.alternarAtivo('usuario-dono', 'Dono', true)).toThrow(/proprietário/i)
  })

  it('exige permissão para gerenciar', () => {
    const store = useAcessoStore()
    expect(() => store.alternarAtivo('usuario-caixa', 'Marcos', false)).toThrow(/usuarios\.gerenciar/i)
  })

  it('redefine senha valendo para próximos logins', async () => {
    const store = useAcessoStore()
    const { login } = await import('../../../auth/services/auth.mock')
    store.redefinirSenha('usuario-caixa', 'nova123', 'Dono', true)
    await expect(login('caixa', '123')).rejects.toThrow()
    const resposta = await login('caixa', 'nova123')
    expect(resposta.usuario.identificador).toBe('caixa')
  })
})

describe('cargos personalizados', () => {
  it('solicita e aprova com reautenticação do proprietário', async () => {
    const store = useAcessoStore()
    const cargo = store.solicitarCargo(
      { nome: 'Auxiliar', descricao: 'Apoio', permissoes: ['estoque.visualizar'] },
      'Marcos Gerente',
      true,
    )
    expect(cargo.status).toBe('solicitado')
    await expect(store.aprovarCargo(cargo.id, 'dono', 'errada')).rejects.toThrow(/reautenticação/i)
    await store.aprovarCargo(cargo.id, 'dono', '123')
    expect(store.cargos[0].status).toBe('aprovado')
  })

  it('não aprova duas vezes nem com papel errado', async () => {
    const store = useAcessoStore()
    const cargo = store.solicitarCargo(
      { nome: 'X', descricao: '', permissoes: ['estoque.visualizar'] },
      'M',
      true,
    )
    await expect(store.aprovarCargo(cargo.id, 'caixa', '123')).rejects.toThrow(/proprietário/i)
  })

  it('versiona alterações de permissão com motivo', () => {
    const store = useAcessoStore()
    const cargo = store.solicitarCargo(
      { nome: 'Y', descricao: '', permissoes: ['estoque.visualizar'] },
      'M',
      true,
    )
    expect(() => store.alterarPermissoesCargo(cargo.id, ['estoque.visualizar'], 'Dono', '', true)).toThrow(
      /motivo/i,
    )
    store.alterarPermissoesCargo(
      cargo.id,
      ['estoque.visualizar', 'estoque.repor'],
      'Dono',
      'incluir reposição',
      true,
    )
    expect(cargo.versao).toBe(2)
    expect(cargo.historico).toHaveLength(1)
    expect(cargo.historico[0].antes).toEqual(['estoque.visualizar'])
    store.desativarCargo(cargo.id, 'Dono', true)
    expect(cargo.status).toBe('desativado')
  })
})

describe('auditoria', () => {
  it('registra eventos e filtra por tipo', () => {
    const store = useAcessoStore()
    store.auditar('login', 'Login: Dono', 'Dono')
    store.auditar('login-negado', 'Tentativa x', 'sistema')
    expect(store.eventosPorTipo('login')).toHaveLength(1)
    expect(store.eventosPorTipo('todos')).toHaveLength(2)
  })
})
