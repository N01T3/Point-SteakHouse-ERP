import { Injectable } from '@nestjs/common'
import { ObterSaldoEmAbertoUseCase } from '../../clientes/use-cases/obter-saldo-em-aberto.use-case.js'
import { ListarPecasEmMaturacaoUseCase } from '../../maturacao/use-cases/listar-pecas-em-maturacao.use-case.js'
import { ObterResumoDeVendasDoDiaUseCase } from '../../pedidos/use-cases/obter-resumo-de-vendas-do-dia.use-case.js'

export interface ResumoGerencial {
  faturamentoHoje: number
  ticketMedio: number
  saldoEmContaFiado: number
  clientesComSaldoAberto: number
  pecasEmMaturacaoCount: number
  pecasProntasNaSemana: number
}

@Injectable()
export class ObterResumoGerencialUseCase {
  constructor(
    private readonly obterResumoDeVendasDoDia: ObterResumoDeVendasDoDiaUseCase,
    private readonly obterSaldoEmAberto: ObterSaldoEmAbertoUseCase,
    private readonly listarPecasEmMaturacao: ListarPecasEmMaturacaoUseCase,
  ) {}

  async executar(): Promise<ResumoGerencial> {
    const [vendas, saldo, maturacao] = await Promise.all([
      this.obterResumoDeVendasDoDia.executar(),
      this.obterSaldoEmAberto.executar(),
      this.listarPecasEmMaturacao.executar(),
    ])

    return {
      faturamentoHoje: vendas.faturamentoHoje,
      ticketMedio: vendas.ticketMedio,
      saldoEmContaFiado: saldo.saldoTotal,
      clientesComSaldoAberto: saldo.clientesComSaldoAberto,
      pecasEmMaturacaoCount: maturacao.totalAtivas,
      pecasProntasNaSemana: maturacao.prontasNaSemana,
    }
  }
}
