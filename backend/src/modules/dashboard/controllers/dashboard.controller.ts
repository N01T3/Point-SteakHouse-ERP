import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { Papeis } from '../../../shared/decorators/papeis.decorator.js'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js'
import { RolesGuard } from '../../../shared/guards/roles.guard.js'
import { PapelUsuario } from '../../usuarios/domain/usuario.entity.js'
import { ListarAlertasDeEstoqueUseCase } from '../../estoque/use-cases/listar-alertas-de-estoque.use-case.js'
import { ListarPecasEmMaturacaoUseCase } from '../../maturacao/use-cases/listar-pecas-em-maturacao.use-case.js'
import { ObterEstatisticasSemanaisUseCase } from '../../pedidos/use-cases/obter-estatisticas-semanais.use-case.js'
import { ObterResumoGerencialUseCase } from '../use-cases/obter-resumo-gerencial.use-case.js'

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Papeis(PapelUsuario.PROPRIETARIO)
export class DashboardController {
  constructor(
    private readonly obterResumoGerencial: ObterResumoGerencialUseCase,
    private readonly obterEstatisticasSemanais: ObterEstatisticasSemanaisUseCase,
    private readonly listarPecasEmMaturacao: ListarPecasEmMaturacaoUseCase,
    private readonly listarAlertasDeEstoque: ListarAlertasDeEstoqueUseCase,
  ) {}

  @Get('resumo')
  obterResumo() {
    return this.obterResumoGerencial.executar()
  }

  @Get('faturamento-semanal')
  async listarFaturamentoSemanal() {
    const { faturamentoSemanal } = await this.obterEstatisticasSemanais.executar()
    return faturamentoSemanal
  }

  @Get('distribuicao-canal')
  async listarDistribuicaoCanal() {
    const { distribuicaoCanal } = await this.obterEstatisticasSemanais.executar()
    return distribuicaoCanal
  }

  @Get('top-cortes')
  async listarTopCortes(@Query('limite') limite?: string) {
    const limiteNumerico = limite ? Number(limite) : undefined
    const { topCortes } = await this.obterEstatisticasSemanais.executar(limiteNumerico)
    return topCortes
  }

  @Get('camara-maturacao')
  async listarCamaraMaturacao() {
    const { pecas } = await this.listarPecasEmMaturacao.executar()
    return pecas
  }

  @Get('alertas-estoque')
  listarAlertasEstoque() {
    return this.listarAlertasDeEstoque.executar()
  }
}
