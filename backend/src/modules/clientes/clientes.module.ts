import { Module } from '@nestjs/common'
import { ContaCorrentePrismaRepository } from './repositories/conta-corrente.prisma.repository.js'
import { CONTA_CORRENTE_REPOSITORY } from './repositories/conta-corrente.repository.js'
import { ObterSaldoEmAbertoUseCase } from './use-cases/obter-saldo-em-aberto.use-case.js'

@Module({
  providers: [
    { provide: CONTA_CORRENTE_REPOSITORY, useClass: ContaCorrentePrismaRepository },
    ObterSaldoEmAbertoUseCase,
  ],
  exports: [ObterSaldoEmAbertoUseCase],
})
export class ClientesModule {}
