import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { PapelUsuario } from '../../modules/usuarios/domain/usuario.entity.js'
import { CHAVE_PAPEIS } from '../decorators/papeis.decorator.js'
import type { UsuarioNaRequisicao } from '../decorators/usuario-atual.decorator.js'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const papeisPermitidos = this.reflector.getAllAndOverride<PapelUsuario[]>(CHAVE_PAPEIS, [
      contexto.getHandler(),
      contexto.getClass(),
    ])
    if (!papeisPermitidos || papeisPermitidos.length === 0) return true

    const requisicao = contexto.switchToHttp().getRequest()
    const usuario = requisicao.usuario as UsuarioNaRequisicao | undefined
    if (!usuario || !papeisPermitidos.includes(usuario.papel as PapelUsuario)) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso')
    }
    return true
  }
}
