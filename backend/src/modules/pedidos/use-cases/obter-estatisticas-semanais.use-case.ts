import { Inject, Injectable } from '@nestjs/common'
import {
  PEDIDO_REPOSITORY,
  type CorteMaisVendido,
  type DistribuicaoPorCanal,
  type FaturamentoDoDia,
  type PedidoRepository,
} from '../repositories/pedido.repository.js'

export interface EstatisticasSemanais {
  faturamentoSemanal: FaturamentoDoDia[]
  distribuicaoCanal: DistribuicaoPorCanal
  topCortes: CorteMaisVendido[]
}

const LIMITE_PADRAO_TOP_CORTES = 5

@Injectable()
export class ObterEstatisticasSemanaisUseCase {
  constructor(@Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: PedidoRepository) {}

  async executar(limiteTopCortes = LIMITE_PADRAO_TOP_CORTES): Promise<EstatisticasSemanais> {
    const [faturamentoSemanal, distribuicaoCanal, topCortes] = await Promise.all([
      this.pedidoRepository.obterFaturamentoDosUltimos7Dias(),
      this.pedidoRepository.obterDistribuicaoPorCanalUltimos7Dias(),
      this.pedidoRepository.obterTopCortesVendidosDaSemana(limiteTopCortes),
    ])
    return { faturamentoSemanal, distribuicaoCanal, topCortes }
  }
}
