import { ConflictException, Inject, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { PapelUsuario, Usuario } from '../domain/usuario.entity.js'
import { USUARIO_REPOSITORY, type UsuarioRepository } from '../repositories/usuario.repository.js'

export interface DadosParaRegistro {
  nome: string
  email: string
  senha: string
  papel: PapelUsuario
}

@Injectable()
export class RegistrarUsuarioUseCase {
  constructor(@Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository) {}

  async executar(dados: DadosParaRegistro): Promise<Usuario> {
    const existente = await this.usuarioRepository.buscarPorEmail(dados.email)
    if (existente) throw new ConflictException('Já existe um usuário com este e-mail')

    const senhaHash = await bcrypt.hash(dados.senha, 10)
    const usuario = new Usuario({
      id: randomUUID(),
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      papel: dados.papel,
      refreshTokenHash: null,
    })

    return this.usuarioRepository.criar(usuario)
  }
}
