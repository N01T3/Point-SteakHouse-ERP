import { Module } from '@nestjs/common'
import { PecaEmMaturacaoPrismaRepository } from './repositories/peca-em-maturacao.prisma.repository.js'
import { PECA_EM_MATURACAO_REPOSITORY } from './repositories/peca-em-maturacao.repository.js'
import { ListarPecasEmMaturacaoUseCase } from './use-cases/listar-pecas-em-maturacao.use-case.js'

@Module({
  providers: [
    { provide: PECA_EM_MATURACAO_REPOSITORY, useClass: PecaEmMaturacaoPrismaRepository },
    ListarPecasEmMaturacaoUseCase,
  ],
  exports: [ListarPecasEmMaturacaoUseCase],
})
export class MaturacaoModule {}
