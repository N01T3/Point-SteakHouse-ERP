// Dados de demonstração reproduzindo os valores de Main.dc.html, usados enquanto
// o backend não roda localmente (sem Postgres disponível ainda). Mesma assinatura
// de dashboard.api.ts — trocar o import em useResumoGerencial.ts quando o backend
// estiver disponível.
import type {
  AlertaDeEstoque,
  CorteMaisVendido,
  DistribuicaoDoMercado,
  FaturamentoDoDia,
  PecaEmMaturacao,
  ResumoGerencial,
} from './dashboard.api'

function atraso<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), 150))
}

// Segunda-feira fixa, só para ancorar o dia-da-semana de cada barra — o gráfico
// de demonstração deve sempre mostrar Seg..Dom nessa ordem, não a semana real.
const SEGUNDA_DE_REFERENCIA = new Date('2024-01-01T12:00:00')

function dataDoDiaDaSemana(offsetDesdeSegunda: number): string {
  const data = new Date(SEGUNDA_DE_REFERENCIA)
  data.setDate(data.getDate() + offsetDesdeSegunda)
  return data.toISOString()
}

export function obterResumoGerencial(): Promise<ResumoGerencial> {
  return atraso({
    faturamentoHoje: 8420,
    ticketMedio: 186,
    saldoEmContaFiado: 4350,
    clientesComSaldoAberto: 12,
    pecasEmMaturacaoCount: 7,
    pecasProntasNaSemana: 2,
  })
}

export function obterFaturamentoSemanal(): Promise<FaturamentoDoDia[]> {
  const valoresPorDia = [8200, 9400, 7600, 11200, 15800, 21300, 18900] // Seg..Dom
  return atraso(valoresPorDia.map((valor, indice) => ({ data: dataDoDiaDaSemana(indice), valor })))
}

export function obterDistribuicaoCanal(): Promise<DistribuicaoDoMercado> {
  return atraso({ carnes: 64, complementos: 36 })
}

export function obterTopCortes(): Promise<CorteMaisVendido[]> {
  return atraso([
    { corteNome: 'Picanha Maturada 28d', kg: 142, receita: 18460 },
    { corteNome: 'Ancho', kg: 98, receita: 11760 },
    { corteNome: 'Filé Mignon', kg: 41, receita: 7380 },
    { corteNome: 'Fraldinha', kg: 76, receita: 6840 },
    { corteNome: 'Costela Smoked', kg: 54, receita: 5940 },
  ])
}

export function obterCamaraMaturacao(): Promise<PecaEmMaturacao[]> {
  return atraso([
    {
      nome: 'Contrafilé Angus',
      tipo: 'dry_aged',
      diasAtual: 34,
      diasTotal: 45,
      progressoPercentual: Math.round((34 / 45) * 100),
      prontaNestaSemana: false,
    },
    {
      nome: 'Bisteca Wagyu',
      tipo: 'dry_aged',
      diasAtual: 12,
      diasTotal: 60,
      progressoPercentual: Math.round((12 / 60) * 100),
      prontaNestaSemana: false,
    },
    {
      nome: 'Picanha Nelore',
      tipo: 'wet_aged',
      diasAtual: 8,
      diasTotal: 10,
      progressoPercentual: Math.round((8 / 10) * 100),
      prontaNestaSemana: true,
    },
  ])
}

export function obterAlertasEstoque(): Promise<AlertaDeEstoque[]> {
  return atraso([{ nome: 'Filé Mignon', quantidadeAtual: 3.2, quantidadeMinima: 10, unidade: 'kg' }])
}
