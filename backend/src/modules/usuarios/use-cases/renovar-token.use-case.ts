import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { ConfiguracaoService } from '../../../config/configuracao.service.js'
import { USUARIO_REPOSITORY, type UsuarioRepository } from '../repositories/usuario.repository.js'
import type { ResultadoAutenticacao } from './autenticar-usuario.use-case.js'

interface PayloadRefresh {
  sub: string
}

@Injectable()
export class RenovarTokenUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
    private readonly jwtService: JwtService,
    private readonly configuracao: ConfiguracaoService,
  ) {}

  async executar(tokenDeRenovacaoAtual: string): Promise<ResultadoAutenticacao> {
    let payload: PayloadRefresh
    try {
      payload = await this.jwtService.verifyAsync<PayloadRefresh>(tokenDeRenovacaoAtual, {
        secret: this.configuracao.jwtRefreshSecret,
      })
    } catch {
      throw new UnauthorizedException('Sessão expirada')
    }

    const usuario = await this.usuarioRepository.buscarPorId(payload.sub)
    if (!usuario?.refreshTokenHash) throw new UnauthorizedException('Sessão expirada')

    const tokenValido = await bcrypt.compare(tokenDeRenovacaoAtual, usuario.refreshTokenHash)
    if (!tokenValido) {
      // Reuso de um refresh token já rotacionado indica possível roubo — revoga a sessão inteira.
      await this.usuarioRepository.atualizarRefreshTokenHash(usuario.id, null)
      throw new UnauthorizedException('Sessão expirada')
    }

    const tokenDeAcesso = await this.jwtService.signAsync(
      { sub: usuario.id, papel: usuario.papel },
      {
        secret: this.configuracao.jwtAccessSecret,
        expiresIn: this.configuracao.jwtAccessExpiracao as unknown as number,
      },
    )

    const novoTokenDeRenovacao = await this.jwtService.signAsync(
      { sub: usuario.id },
      {
        secret: this.configuracao.jwtRefreshSecret,
        expiresIn: this.configuracao.jwtRefreshExpiracao as unknown as number,
      },
    )

    const novoRefreshTokenHash = await bcrypt.hash(novoTokenDeRenovacao, 10)
    await this.usuarioRepository.atualizarRefreshTokenHash(usuario.id, novoRefreshTokenHash)

    return {
      tokenDeAcesso,
      tokenDeRenovacao: novoTokenDeRenovacao,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    }
  }
}
