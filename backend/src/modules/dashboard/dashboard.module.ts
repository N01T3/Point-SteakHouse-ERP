import { Module } from '@nestjs/common'
import { ClientesModule } from '../clientes/clientes.module.js'
import { EstoqueModule } from '../estoque/estoque.module.js'
import { MaturacaoModule } from '../maturacao/maturacao.module.js'
import { PedidosModule } from '../pedidos/pedidos.module.js'
import { DashboardController } from './controllers/dashboard.controller.js'
import { ObterResumoGerencialUseCase } from './use-cases/obter-resumo-gerencial.use-case.js'

@Module({
  imports: [PedidosModule, ClientesModule, MaturacaoModule, EstoqueModule],
  controllers: [DashboardController],
  providers: [ObterResumoGerencialUseCase],
})
export class DashboardModule {}
