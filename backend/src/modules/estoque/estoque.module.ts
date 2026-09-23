import { Module } from '@nestjs/common'
import { ItemDeEstoquePrismaRepository } from './repositories/item-de-estoque.prisma.repository.js'
import { ITEM_DE_ESTOQUE_REPOSITORY } from './repositories/item-de-estoque.repository.js'
import { ListarAlertasDeEstoqueUseCase } from './use-cases/listar-alertas-de-estoque.use-case.js'

@Module({
  providers: [
    { provide: ITEM_DE_ESTOQUE_REPOSITORY, useClass: ItemDeEstoquePrismaRepository },
    ListarAlertasDeEstoqueUseCase,
  ],
  exports: [ListarAlertasDeEstoqueUseCase],
})
export class EstoqueModule {}
