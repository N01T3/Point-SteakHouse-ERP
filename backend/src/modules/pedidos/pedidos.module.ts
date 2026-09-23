import { Module } from '@nestjs/common'
import { PedidoPrismaRepository } from './repositories/pedido.prisma.repository.js'
import { PEDIDO_REPOSITORY } from './repositories/pedido.repository.js'
import { ObterEstatisticasSemanaisUseCase } from './use-cases/obter-estatisticas-semanais.use-case.js'
import { ObterResumoDeVendasDoDiaUseCase } from './use-cases/obter-resumo-de-vendas-do-dia.use-case.js'

@Module({
  providers: [
    { provide: PEDIDO_REPOSITORY, useClass: PedidoPrismaRepository },
    ObterResumoDeVendasDoDiaUseCase,
    ObterEstatisticasSemanaisUseCase,
  ],
  exports: [ObterResumoDeVendasDoDiaUseCase, ObterEstatisticasSemanaisUseCase],
})
export class PedidosModule {}
