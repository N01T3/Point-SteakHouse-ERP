import type { Usuario } from '../domain/usuario.entity.js'

export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>
  buscarPorId(id: string): Promise<Usuario | null>
  criar(usuario: Usuario): Promise<Usuario>
  atualizarRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<void>
}

export const USUARIO_REPOSITORY = Symbol('UsuarioRepository')
