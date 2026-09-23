export interface FaturamentoDoDia {
  data: Date
  valor: number
}

export interface DistribuicaoPorCanal {
  salao: number
  mercado: number
}

export interface CorteMaisVendido {
  corteNome: string
  kg: number
  receita: number
}

export interface PedidoRepository {
  obterFaturamentoDeHoje(): Promise<number>
  calcularTicketMedioDeHoje(): Promise<number>
  obterFaturamentoDosUltimos7Dias(): Promise<FaturamentoDoDia[]>
  obterDistribuicaoPorCanalUltimos7Dias(): Promise<DistribuicaoPorCanal>
  obterTopCortesVendidosDaSemana(limite: number): Promise<CorteMaisVendido[]>
}

export const PEDIDO_REPOSITORY = Symbol('PedidoRepository')
