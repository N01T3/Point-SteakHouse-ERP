import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ConfiguracaoService } from './configuracao.service.js'
import { validarVariaveisDeAmbiente } from './validacao-de-ambiente.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validarVariaveisDeAmbiente,
    }),
  ],
  providers: [ConfiguracaoService],
  exports: [ConfiguracaoService],
})
export class ConfiguracaoModule {}
