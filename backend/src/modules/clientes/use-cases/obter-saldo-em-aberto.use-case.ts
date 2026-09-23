import { Inject, Injectable } from '@nestjs/common'
import {
  CONTA_CORRENTE_REPOSITORY,
  type ContaCorrenteRepository,
  type ResumoDeSaldoEmAberto,
} from '../repositories/conta-corrente.repository.js'

@Injectable()
export class ObterSaldoEmAbertoUseCase {
  constructor(
    @Inject(CONTA_CORRENTE_REPOSITORY) private readonly contaCorrenteRepository: ContaCorrenteRepository,
  ) {}

  executar(): Promise<ResumoDeSaldoEmAberto> {
    return this.contaCorrenteRepository.obterResumoDeSaldoEmAberto()
  }
}
