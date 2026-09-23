import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module.js'
import { ConfiguracaoService } from './config/configuracao.service.js'
import { FiltroDeExcecaoGlobal } from './shared/filtros/filtro-de-excecao-global.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configuracao = app.get(ConfiguracaoService)

  app.use(cookieParser())
  app.enableCors({ origin: configuracao.urlDoFrontend, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalFilters(new FiltroDeExcecaoGlobal())

  await app.listen(configuracao.porta)
}
await bootstrap()
