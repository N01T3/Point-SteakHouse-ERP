// Agregações financeiras puras — testáveis, sem Vue.
// Açougue/mercado: canal único (Mercado). Sem salão/cozinha/mesa.
import {
  SALDO_FIADO_INICIAL,
  type Desperdicio,
  type DiaFinanceiro,
  type Granularidade,
  type MargemPorItem,
  type Periodo,
  type Visao,
} from '../mock/financeiro.mock'

export interface ResumoFinanceiro {
  receita: number
  receitaRecebida: number
  cmv: number
  despesas: number
  desperdicio: number
  lucroBruto: number
  lucroLiquido: number
  margemLiquida: number | null
  fiadoNovo: number
  fiadoRecebido: number
  saldoFiadoFinal: number
}

export interface LinhaDre {
  rotulo: string
  valor: number
  destaque?: boolean
}

export interface PontoFiadoLucro {
  rotulo: string
  fiadoNovo: number
  fiadoRecebido: number
  saldoFiado: number
  lucro: number
}

export function filtrarDias(dias: DiaFinanceiro[], periodo: Periodo): DiaFinanceiro[] {
  if (periodo === 'hoje') return dias.slice(-1)
  if (periodo === '14d') return dias.slice(-14)
  return dias.slice(-90)
}

export function agregar(dias: DiaFinanceiro[], desperdicioPeriodo = 0): ResumoFinanceiro {
  let receita = 0
  let cmv = 0
  let despesas = 0
  let fiadoNovo = 0
  let fiadoRecebido = 0
  for (const dia of dias) {
    receita += dia.receita
    cmv += dia.cmv
    despesas += dia.despesas
    fiadoNovo += dia.fiadoNovo
    fiadoRecebido += dia.fiadoRecebido
  }
  const receitaRecebida = receita - fiadoNovo + fiadoRecebido
  const lucroBruto = receita - cmv
  const lucroLiquido = lucroBruto - despesas - desperdicioPeriodo
  return {
    receita: Math.round(receita),
    receitaRecebida: Math.round(receitaRecebida),
    cmv: Math.round(cmv),
    despesas: Math.round(despesas),
    desperdicio: Math.round(desperdicioPeriodo),
    lucroBruto: Math.round(lucroBruto),
    lucroLiquido: Math.round(lucroLiquido),
    margemLiquida: receita > 0 ? lucroLiquido / receita : null,
    fiadoNovo: Math.round(fiadoNovo),
    fiadoRecebido: Math.round(fiadoRecebido),
    saldoFiadoFinal: Math.round(SALDO_FIADO_INICIAL + fiadoNovo - fiadoRecebido),
  }
}

export function montarDre(resumo: ResumoFinanceiro, visao: Visao): LinhaDre[] {
  const receita = visao === 'caixa' ? resumo.receitaRecebida : resumo.receita
  const lucroBruto = receita - resumo.cmv
  return [
    { rotulo: visao === 'caixa' ? 'Receita recebida (Mercado)' : 'Receita bruta (Mercado)', valor: Math.round(receita) },
    { rotulo: '(−) CMV', valor: -resumo.cmv },
    { rotulo: 'Lucro bruto', valor: Math.round(lucroBruto), destaque: true },
    { rotulo: '(−) Mão de obra (açougue/caixa)', valor: -Math.round(resumo.despesas * 0.52) },
    { rotulo: '(−) Energia e água', valor: -Math.round(resumo.despesas * 0.09) },
    { rotulo: '(−) Embalagens e insumos', valor: -Math.round(resumo.despesas * 0.21) },
    { rotulo: '(−) Outras despesas', valor: -Math.round(resumo.despesas * 0.18) },
    { rotulo: '(−) Perdas e desperdícios', valor: -resumo.desperdicio },
    { rotulo: 'Lucro líquido gerencial', valor: Math.round(lucroBruto - resumo.despesas - resumo.desperdicio), destaque: true },
  ]
}

function rotuloDoBucket(dias: DiaFinanceiro[], granularidade: Granularidade): string {
  const primeiro = dias[0].data.slice(5).split('-').reverse().join('/')
  const ultimo = dias[dias.length - 1].data.slice(5).split('-').reverse().join('/')
  if (granularidade === 'dia') return ultimo
  return `${primeiro}–${ultimo}`
}

export function fiadoVsLucro(dias: DiaFinanceiro[], granularidade: Granularidade): PontoFiadoLucro[] {
  const tamanho = granularidade === 'dia' ? 1 : granularidade === 'semana' ? 7 : 30
  const quantidade = granularidade === 'dia' ? 14 : granularidade === 'semana' ? 8 : 3
  const janela = dias.slice(-tamanho * quantidade)

  let saldo = SALDO_FIADO_INICIAL
  const pontos: PontoFiadoLucro[] = []
  for (let i = 0; i < janela.length; i += tamanho) {
    const bucket = janela.slice(i, i + tamanho)
    if (bucket.length === 0) continue
    const resumo = agregar(bucket)
    saldo += resumo.fiadoNovo - resumo.fiadoRecebido
    pontos.push({
      rotulo: rotuloDoBucket(bucket, granularidade),
      fiadoNovo: resumo.fiadoNovo,
      fiadoRecebido: resumo.fiadoRecebido,
      saldoFiado: Math.round(saldo),
      lucro: resumo.lucroLiquido,
    })
  }
  return pontos
}

/** Série diária de resultado (receita − CMV − despesas) para o fluxo de caixa. */
export function serieResultadoDiario(dias: DiaFinanceiro[]): Array<{ data: string; valor: number }> {
  return dias.map((dia) => ({
    data: dia.data,
    valor: Math.round(dia.receita - dia.cmv - dia.despesas),
  }))
}

// --- Desperdícios ---

export interface ResumoDesperdicio {
  totalKg: number
  totalReais: number
  percentualReceita: number | null
  porMotivo: Array<{ motivo: string; valor: number; quantidade: number }>
  porProduto: Array<{ produto: string; valor: number; quantidade: number }>
}

export function resumirDesperdicios(itens: Desperdicio[], receitaPeriodo: number): ResumoDesperdicio {
  const totalReais = Math.round(itens.reduce((soma, item) => soma + item.valor, 0))
  const totalKg = Math.round(itens.reduce((soma, item) => soma + item.quantidade, 0) * 100) / 100
  const porMotivoMap = new Map<string, { valor: number; quantidade: number }>()
  const porProdutoMap = new Map<string, { valor: number; quantidade: number }>()
  for (const item of itens) {
    const motivo = porMotivoMap.get(item.motivo) ?? { valor: 0, quantidade: 0 }
    motivo.valor += item.valor
    motivo.quantidade += item.quantidade
    porMotivoMap.set(item.motivo, motivo)
    const produto = porProdutoMap.get(item.produto) ?? { valor: 0, quantidade: 0 }
    produto.valor += item.valor
    produto.quantidade += item.quantidade
    porProdutoMap.set(item.produto, produto)
  }
  return {
    totalKg,
    totalReais,
    percentualReceita: receitaPeriodo > 0 ? totalReais / receitaPeriodo : null,
    porMotivo: [...porMotivoMap.entries()]
      .map(([motivo, dados]) => ({ motivo, ...dados, valor: Math.round(dados.valor) }))
      .sort((a, b) => b.valor - a.valor),
    porProduto: [...porProdutoMap.entries()]
      .map(([produto, dados]) => ({ produto, ...dados, valor: Math.round(dados.valor) }))
      .sort((a, b) => b.valor - a.valor),
  }
}

// --- Lucro por item ---

export function margemMediaItens(itens: MargemPorItem[]): number | null {
  const receita = itens.reduce((soma, item) => soma + item.receita, 0)
  const margem = itens.reduce((soma, item) => soma + item.margem, 0)
  if (receita <= 0) return null
  return margem / receita
}

/** Curva ABC por receita: A ≈ 70%, B ≈ 20%, C ≈ resto. */
export function curvaABC(itens: MargemPorItem[]): Array<MargemPorItem & { classe: 'A' | 'B' | 'C' }> {
  const ordenados = [...itens].sort((a, b) => b.receita - a.receita)
  const total = ordenados.reduce((soma, item) => soma + item.receita, 0)
  let acumulado = 0
  return ordenados.map((item) => {
    acumulado += total > 0 ? item.receita / total : 0
    const classe = acumulado <= 0.7 ? 'A' : acumulado <= 0.9 ? 'B' : 'C'
    return { ...item, classe }
  })
}

/** Preço mínimo para atingir a margem alvo: custo / (1 − alvo). */
export function precoMinimo(custoMedio: number, margemAlvo: number): number | null {
  if (margemAlvo >= 1 || margemAlvo < 0) return null
  return Math.round((custoMedio / (1 - margemAlvo)) * 100) / 100
}

/** Ponto de equilíbrio: custos fixos / índice de margem de contribuição. */
export function pontoDeEquilibrio(custosFixos: number, indiceMargemContribuicao: number): number | null {
  if (indiceMargemContribuicao <= 0) return null
  return Math.round(custosFixos / indiceMargemContribuicao)
}
