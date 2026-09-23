import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './controllers/auth.controller.js'
import { UsuariosController } from './controllers/usuarios.controller.js'
import { JwtStrategy } from './estrategias/jwt.strategy.js'
import { UsuarioPrismaRepository } from './repositories/usuario.prisma.repository.js'
import { USUARIO_REPOSITORY } from './repositories/usuario.repository.js'
import { AutenticarUsuarioUseCase } from './use-cases/autenticar-usuario.use-case.js'
import { RegistrarUsuarioUseCase } from './use-cases/registrar-usuario.use-case.js'
import { RenovarTokenUseCase } from './use-cases/renovar-token.use-case.js'

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController, UsuariosController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: UsuarioPrismaRepository },
    AutenticarUsuarioUseCase,
    RenovarTokenUseCase,
    RegistrarUsuarioUseCase,
    JwtStrategy,
  ],
})
export class UsuariosModule {}
