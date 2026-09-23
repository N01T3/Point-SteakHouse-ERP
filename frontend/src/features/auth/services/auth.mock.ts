// Login mockado para o app de demonstração — sem backend real.
// Credenciais simples de vitrine: usuário + senha "123".
import { PERMISSOES_POR_PAPEL, ROTA_INICIAL_POR_PAPEL } from '../../../shared/tipos/papel'
import type { RespostaLogin, UsuarioAutenticado } from './auth.api'

interface CredencialDemo {
  usuario: UsuarioAutenticado
  senha: string
}

const CREDENCIAIS_DEMO: CredencialDemo[] = [
  {
    usuario: {
      id: 'usuario-dono',
      nome: 'Dono',
      identificador: 'dono',
      papel: 'PROPRIETARIO',
      permissoes: PERMISSOES_POR_PAPEL.PROPRIETARIO,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.PROPRIETARIO,
    },
    senha: '123',
  },
  {
    usuario: {
      id: 'usuario-admin',
      nome: 'Marcos Gerente',
      identificador: 'administrador',
      papel: 'ADMINISTRADOR',
      permissoes: PERMISSOES_POR_PAPEL.ADMINISTRADOR,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.ADMINISTRADOR,
    },
    senha: '123',
  },
  {
    usuario: {
      id: 'usuario-acougue',
      nome: 'Rita Açougueira',
      identificador: 'acougueiro',
      papel: 'ACOUGUEIRO',
      permissoes: PERMISSOES_POR_PAPEL.ACOUGUEIRO,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.ACOUGUEIRO,
    },
    senha: '123',
  },
  {
    usuario: {
      id: 'usuario-caixa',
      nome: 'Paulo Caixa',
      identificador: 'caixa',
      papel: 'CAIXA',
      permissoes: PERMISSOES_POR_PAPEL.CAIXA,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.CAIXA,
    },
    senha: '123',
  },
]

function atraso<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), 200))
}

export async function login(identificador: string, senha: string): Promise<RespostaLogin> {
  const credencial = CREDENCIAIS_DEMO.find(
    (c) => c.usuario.identificador === identificador.trim().toLowerCase(),
  )
  if (!credencial || credencial.senha !== senha) {
    await atraso(undefined)
    throw new Error('Credenciais inválidas')
  }
  return atraso({ tokenDeAcesso: `token-mock-${credencial.usuario.identificador}`, usuario: credencial.usuario })
}

/** Redefinição de senha em modo demonstração (dono). Vale para próximos logins. */
export function redefinirSenhaMock(identificador: string, novaSenha: string): void {
  const credencial = CREDENCIAIS_DEMO.find(
    (c) => c.usuario.identificador === identificador.trim().toLowerCase(),
  )
  if (!credencial) throw new Error('Usuário não encontrado.')
  if (novaSenha.length < 3) throw new Error('Senha deve ter ao menos 3 caracteres.')
  credencial.senha = novaSenha
}
