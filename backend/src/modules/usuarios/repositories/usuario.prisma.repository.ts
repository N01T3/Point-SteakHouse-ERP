import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../infra/prisma/prisma.service.js'
import { PapelUsuario, Usuario } from '../domain/usuario.entity.js'
import type { UsuarioRepository } from './usuario.repository.js'

interface RegistroUsuario {
  id: string
  nome: string
  email: string
  senhaHash: string
  papel: string
  refreshTokenHash: string | null
}

function paraDominio(registro: RegistroUsuario): Usuario {
  return new Usuario({
    id: registro.id,
    nome: registro.nome,
    email: registro.email,
    senhaHash: registro.senhaHash,
    papel: registro.papel as PapelUsuario,
    refreshTokenHash: registro.refreshTokenHash,
  })
}

@Injectable()
export class UsuarioPrismaRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { email } })
    return registro ? paraDominio(registro) : null
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { id } })
    return registro ? paraDominio(registro) : null
  }

  async criar(usuario: Usuario): Promise<Usuario> {
    const registro = await this.prisma.usuario.create({
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        senhaHash: usuario.senhaHash,
        papel: usuario.papel,
        refreshTokenHash: usuario.refreshTokenHash,
      },
    })
    return paraDominio(registro)
  }

  async atualizarRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.prisma.usuario.update({ where: { id }, data: { refreshTokenHash } })
  }
}
