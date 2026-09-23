import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { ConfiguracaoService } from '../../../config/configuracao.service.js'
import { LoginDto } from '../dtos/login.dto.js'
import { AutenticarUsuarioUseCase } from '../use-cases/autenticar-usuario.use-case.js'
import { RenovarTokenUseCase } from '../use-cases/renovar-token.use-case.js'

const NOME_COOKIE_REFRESH = 'tokenDeRenovacao'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly autenticarUsuario: AutenticarUsuarioUseCase,
    private readonly renovarToken: RenovarTokenUseCase,
    private readonly configuracao: ConfiguracaoService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) resposta: Response) {
    const resultado = await this.autenticarUsuario.executar(dto.email, dto.senha)
    this.definirCookieDeRenovacao(resposta, resultado.tokenDeRenovacao)
    return { tokenDeAcesso: resultado.tokenDeAcesso, usuario: resultado.usuario }
  }

  @Post('renovar')
  @HttpCode(HttpStatus.OK)
  async renovar(@Req() requisicao: Request, @Res({ passthrough: true }) resposta: Response) {
    const tokenAtual = requisicao.cookies?.[NOME_COOKIE_REFRESH] as string | undefined
    if (!tokenAtual) throw new UnauthorizedException('Sessão expirada')

    const resultado = await this.renovarToken.executar(tokenAtual)
    this.definirCookieDeRenovacao(resposta, resultado.tokenDeRenovacao)
    return { tokenDeAcesso: resultado.tokenDeAcesso, usuario: resultado.usuario }
  }

  private definirCookieDeRenovacao(resposta: Response, token: string): void {
    resposta.cookie(NOME_COOKIE_REFRESH, token, {
      httpOnly: true,
      secure: this.configuracao.ambiente === 'production',
      sameSite: 'strict',
      path: '/auth',
    })
  }
}
