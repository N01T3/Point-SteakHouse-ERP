import { requisitar } from '../../../shared/services/clienteHttp'

export interface ResumoGerencial {
  faturamentoHoje: number
  ticketMedio: number
  saldoEmContaFiado: number
  clientesComSaldoAberto: number
  pecasEmMaturacaoCount: number
  pecasProntasNaSemana: number
}

export interface FaturamentoDoDia {
  data: string
  valor: number
}

export interface DistribuicaoDoMercado {
  carnes: number
  complementos: number
}

export interface CorteMaisVendido {
  corteNome: string
  kg: number
  receita: number
}

export interface PecaEmMaturacao {
  nome: string
  tipo: string
  diasAtual: number
  diasTotal: number
  progressoPercentual: number
  prontaNestaSemana: boolean
}

export interface AlertaDeEstoque {
  nome: string
  quantidadeAtual: number
  quantidadeMinima: number
  unidade: string
}

export function obterResumoGerencial(): Promise<ResumoGerencial> {
  return requisitar('/dashboard/resumo')
}

export function obterFaturamentoSemanal(): Promise<FaturamentoDoDia[]> {
  return requisitar('/dashboard/faturamento-semanal')
}

export function obterDistribuicaoCanal(): Promise<DistribuicaoDoMercado> {
  return requisitar('/dashboard/distribuicao-mercado')
}

export function obterTopCortes(): Promise<CorteMaisVendido[]> {
  return requisitar('/dashboard/top-cortes')
}

export function obterCamaraMaturacao(): Promise<PecaEmMaturacao[]> {
  return requisitar('/dashboard/camara-maturacao')
}

export function obterAlertasEstoque(): Promise<AlertaDeEstoque[]> {
  return requisitar('/dashboard/alertas-estoque')
}
