import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfiguracaoService } from '../../../config/configuracao.service.js'
import type { UsuarioNaRequisicao } from '../../../shared/decorators/usuario-atual.decorator.js'

interface PayloadAcesso {
  sub: string
  papel: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configuracao: ConfiguracaoService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configuracao.jwtAccessSecret,
    })
  }

  validate(payload: PayloadAcesso): UsuarioNaRequisicao {
    return { id: payload.sub, papel: payload.papel }
  }
}
