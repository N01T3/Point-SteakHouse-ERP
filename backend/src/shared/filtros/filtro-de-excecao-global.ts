import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common'
import type { Response } from 'express'

@Catch()
export class FiltroDeExcecaoGlobal implements ExceptionFilter {
  catch(excecao: unknown, host: ArgumentsHost): void {
    const resposta = host.switchToHttp().getResponse<Response>()

    if (excecao instanceof HttpException) {
      resposta.status(excecao.getStatus()).json(excecao.getResponse())
      return
    }

    resposta.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Erro interno do servidor' })
  }
}
