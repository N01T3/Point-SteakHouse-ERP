import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { AmbienteValidado } from './validacao-de-ambiente.js'

@Injectable()
export class ConfiguracaoService {
  constructor(private readonly configService: ConfigService<AmbienteValidado, true>) {}

  get ambiente(): AmbienteValidado['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true })
  }

  get porta(): number {
    return this.configService.get('PORT', { infer: true })
  }

  get urlDoFrontend(): string {
    return this.configService.get('FRONTEND_URL', { infer: true })
  }

  get urlDoBancoDeDados(): string {
    return this.configService.get('DATABASE_URL', { infer: true })
  }

  get jwtAccessSecret(): string {
    return this.configService.get('JWT_ACCESS_SECRET', { infer: true })
  }

  get jwtAccessExpiracao(): string {
    return this.configService.get('JWT_ACCESS_EXPIRACAO', { infer: true })
  }

  get jwtRefreshSecret(): string {
    return this.configService.get('JWT_REFRESH_SECRET', { infer: true })
  }

  get jwtRefreshExpiracao(): string {
    return this.configService.get('JWT_REFRESH_EXPIRACAO', { infer: true })
  }
}
