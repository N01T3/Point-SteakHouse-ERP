import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { ConfiguracaoService } from '../../../config/configuracao.service.js'
import { USUARIO_REPOSITORY, type UsuarioRepository } from '../repositories/usuario.repository.js'

export interface ResultadoAutenticacao {
  tokenDeAcesso: string
  tokenDeRenovacao: string
  usuario: { id: string; nome: string; email: string; papel: string }
}

@Injectable()
export class AutenticarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
    private readonly jwtService: JwtService,
    private readonly configuracao: ConfiguracaoService,
  ) {}

  async executar(email: string, senha: string): Promise<ResultadoAutenticacao> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email)
    if (!usuario) throw new UnauthorizedException('Credenciais inválidas')

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash)
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas')

    const tokenDeAcesso = await this.jwtService.signAsync(
      { sub: usuario.id, papel: usuario.papel },
      {
        secret: this.configuracao.jwtAccessSecret,
        expiresIn: this.configuracao.jwtAccessExpiracao as unknown as number,
      },
    )

    const tokenDeRenovacao = await this.jwtService.signAsync(
      { sub: usuario.id },
      {
        secret: this.configuracao.jwtRefreshSecret,
        expiresIn: this.configuracao.jwtRefreshExpiracao as unknown as number,
      },
    )

    const refreshTokenHash = await bcrypt.hash(tokenDeRenovacao, 10)
    await this.usuarioRepository.atualizarRefreshTokenHash(usuario.id, refreshTokenHash)

    return {
      tokenDeAcesso,
      tokenDeRenovacao,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    }
  }
}
