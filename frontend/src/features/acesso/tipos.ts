// Gestão de acesso em modo demonstração: usuários, cargos personalizados e
// auditoria de acessos. Espelha `cargos-e-permissoes-point-steakhouse.md`.
import type { PapelUsuario, Permissao } from '../../shared/tipos/papel'

export interface UsuarioGerenciado {
  id: string
  nome: string
  identificador: string
  papel: PapelUsuario
  ativo: boolean
  ultimoLogin?: string // ISO
}

export type StatusCargo = 'solicitado' | 'aprovado' | 'recusado' | 'desativado'

export interface AlteracaoCargo {
  versao: number
  antes: Permissao[]
  depois: Permissao[]
  autor: string
  motivo: string
  data: string // ISO
}

export interface CargoPersonalizado {
  id: string
  nome: string
  descricao: string
  permissoes: Permissao[]
  status: StatusCargo
  solicitadoPor: string
  versao: number
  historico: AlteracaoCargo[]
  criadoEm: string // ISO
}

export type TipoEventoAuditoria = 'login' | 'logout' | 'login-negado' | 'usuario' | 'cargo' | 'permissao'

export interface EventoAuditoria {
  id: string
  tipo: TipoEventoAuditoria
  descricao: string
  responsavel: string
  criadoEm: string // ISO
}
