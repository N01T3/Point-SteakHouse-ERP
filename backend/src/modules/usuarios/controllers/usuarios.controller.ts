import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { Papeis } from '../../../shared/decorators/papeis.decorator.js'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../../shared/guards/roles.guard.js'
import { PapelUsuario } from '../domain/usuario.entity.js'
import { RegistrarUsuarioDto } from '../dtos/registrar-usuario.dto.js'
import { RegistrarUsuarioUseCase } from '../use-cases/registrar-usuario.use-case.js'

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly registrarUsuario: RegistrarUsuarioUseCase) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Papeis(PapelUsuario.PROPRIETARIO)
  async registrar(@Body() dto: RegistrarUsuarioDto) {
    const usuario = await this.registrarUsuario.executar(dto)
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
  }
}
