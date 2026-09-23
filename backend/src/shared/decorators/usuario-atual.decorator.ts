import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

export interface UsuarioNaRequisicao {
  id: string
  papel: string
}

export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): UsuarioNaRequisicao => {
    const requisicao = contexto.switchToHttp().getRequest()
    return requisicao.usuario
  },
)
