import { Module } from '@nestjs/common'
import { ConfiguracaoModule } from './config/configuracao.module.js'
import { PrismaModule } from './infra/prisma/prisma.module.js'
import { DashboardModule } from './modules/dashboard/dashboard.module.js'
import { UsuariosModule } from './modules/usuarios/usuarios.module.js'

@Module({
  imports: [ConfiguracaoModule, PrismaModule, UsuariosModule, DashboardModule],
})
export class AppModule {}
