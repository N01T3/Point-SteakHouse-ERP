import { requisitar } from '../../../shared/services/clienteHttp'
import type { PapelUsuario, Permissao } from '../../../shared/tipos/papel'

export type { PapelUsuario, Permissao }

export interface UsuarioAutenticado {
  id: string
  nome: string
  identificador: string
  papel: PapelUsuario
  permissoes: Permissao[]
  rotaInicial: string
}

export interface RespostaLogin {
  tokenDeAcesso: string
  usuario: UsuarioAutenticado
}

export function login(identificador: string, senha: string): Promise<RespostaLogin> {
  return requisitar<RespostaLogin>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identificador, senha }),
    semAutenticacao: true,
  })
}

export function renovarSessao(): Promise<{ tokenDeAcesso: string; usuario: UsuarioAutenticado }> {
  return requisitar('/auth/renovar', { method: 'POST', semAutenticacao: true })
}
