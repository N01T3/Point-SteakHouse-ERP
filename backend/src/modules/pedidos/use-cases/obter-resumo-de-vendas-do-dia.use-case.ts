import { Inject, Injectable } from '@nestjs/common'
import { PEDIDO_REPOSITORY, type PedidoRepository } from '../repositories/pedido.repository.js'

export interface ResumoDeVendasDoDia {
  faturamentoHoje: number
  ticketMedio: number
}

@Injectable()
export class ObterResumoDeVendasDoDiaUseCase {
  constructor(@Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: PedidoRepository) {}

  async executar(): Promise<ResumoDeVendasDoDia> {
    const [faturamentoHoje, ticketMedio] = await Promise.all([
      this.pedidoRepository.obterFaturamentoDeHoje(),
      this.pedidoRepository.calcularTicketMedioDeHoje(),
    ])
    return { faturamentoHoje, ticketMedio }
  }
}
