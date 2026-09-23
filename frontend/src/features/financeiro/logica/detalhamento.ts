// Cálculos do detalhamento financeiro — puros e testáveis.
// Mistura base histórica (mock) com sessão real (turno, custos fixos, estoque).
import { estoqueTotal } from '../../mercado/logica/mercado'
import type { ProdutoMercado } from '../../mercado/tipos'
import type { CustoDetalhado, DiaFinanceiro } from '../mock/financeiro.mock'
import type { CustoFixo } from '../tipos'
import type { ResumoFinanceiro } from './financeiro'

export interface SerieTemporal {
  rotulos: string[]
  receita: number[]
  cmv: number[]
  lucro: number[]
}

function rotuloDia(iso: string): string {
  return iso.slice(5).split('-').reverse().join('/')
}

/** Soma dias em baldes semanais quando há muitos pontos (legibilidade do gráfico). */
export function serieResultado(dias: DiaFinanceiro[]): SerieTemporal {
  let base = dias
  if (dias.length > 31) {
    const agregados: DiaFinanceiro[] = []
    for (let i = 0; i < dias.length; i += 7) {
      const balde = dias.slice(i, i + 7)
      agregados.push({
        data: balde[balde.length - 1].data,
        receita: balde.reduce((s, d) => s + d.receita, 0),
        cmv: balde.reduce((s, d) => s + d.cmv, 0),
        despesas: balde.reduce((s, d) => s + d.despesas, 0),
        fiadoNovo: balde.reduce((s, d) => s + d.fiadoNovo, 0),
        fiadoRecebido: balde.reduce((s, d) => s + d.fiadoRecebido, 0),
      })
    }
    base = agregados
  }
  return {
    rotulos: base.map((d) => rotuloDia(d.data)),
    receita: base.map((d) => d.receita),
    cmv: base.map((d) => d.cmv),
    lucro: base.map((d) => Math.round(d.receita - d.cmv - d.despesas)),
  }
}

export interface DiaCaixa {
  data: string
  entradas: number
  saidas: number
  saldo: number
}

export function fluxoCaixa(dias: DiaFinanceiro[]): DiaCaixa[] {
  let acumulado = 0
  return dias.map((d) => {
    const entradas = Math.round(d.receita - d.fiadoNovo + d.fiadoRecebido)
    const saidas = Math.round(d.cmv + d.despesas)
    acumulado = Math.round(acumulado + entradas - saidas)
    return { data: d.data, entradas, saidas, saldo: entradas - saidas }
  })
}

export function saldoAcumulado(fluxo: DiaCaixa[]): number[] {
  let acc = 0
  return fluxo.map((f) => (acc = Math.round(acc + f.saldo)))
}

/** Projeção simples: média diária líquida × dias. */
export function projetarCaixa(fluxo: DiaCaixa[], diasFuturos = 30): number | null {
  if (fluxo.length === 0) return null
  const media = fluxo.reduce((s, f) => s + f.saldo, 0) / fluxo.length
  return Math.round(media * diasFuturos)
}

export interface Degrau {
  rotulo: string
  inicio: number
  fim: number
  total: boolean
  positivo: boolean
}

/** Cascata do DRE: receita → CMV → despesas → perdas → lucro. */
export function waterfallDre(resumo: ResumoFinanceiro): Degrau[] {
  const lucroBruto = resumo.receita - resumo.cmv
  const aposDespesas = lucroBruto - resumo.despesas
  const lucro = aposDespesas - resumo.desperdicio
  return [
    { rotulo: 'Receita', inicio: 0, fim: resumo.receita, total: false, positivo: true },
    { rotulo: 'CMV', inicio: resumo.receita, fim: lucroBruto, total: false, positivo: false },
    { rotulo: 'Despesas', inicio: lucroBruto, fim: aposDespesas, total: false, positivo: false },
    { rotulo: 'Perdas', inicio: aposDespesas, fim: lucro, total: false, positivo: false },
    { rotulo: 'Lucro', inicio: 0, fim: lucro, total: true, positivo: lucro >= 0 },
  ]
}

export interface FatiaDespesa {
  categoria: string
  valor: number
  percentual: number
}

/** Donut de despesas: custos base + fixos da sessão, top 6 + outros. */
export function despesasPorCategoria(base: CustoDetalhado[], fixos: CustoFixo[]): FatiaDespesa[] {
  const mapa = new Map<string, number>()
  for (const c of base) mapa.set(c.categoria, (mapa.get(c.categoria) ?? 0) + c.valor)
  for (const f of fixos.filter((x) => x.ativo))
    mapa.set(f.categoria, (mapa.get(f.categoria) ?? 0) + f.valorMensal)
  const total = [...mapa.values()].reduce((s, v) => s + v, 0)
  if (total <= 0) return []
  const ordenadas = [...mapa.entries()].sort((a, b) => b[1] - a[1])
  const top = ordenadas.slice(0, 6)
  const resto = ordenadas.slice(6).reduce((s, [, v]) => s + v, 0)
  const fatias = top.map(([categoria, valor]) => ({
    categoria,
    valor: Math.round(valor),
    percentual: Math.round((valor / total) * 100),
  }))
  if (resto > 0)
    fatias.push({
      categoria: 'Outros',
      valor: Math.round(resto),
      percentual: Math.round((resto / total) * 100),
    })
  return fatias
}

export interface ItemEstoqueValorizado {
  produto: string
  quantidade: number
  unidade: string
  custoMedio: number
  valor: number
}

export function estoqueValorizado(produtos: ProdutoMercado[]): {
  itens: ItemEstoqueValorizado[]
  total: number
} {
  const itens = produtos
    .map((p) => {
      const quantidade = Math.round(estoqueTotal(p) * 1000) / 1000
      return {
        produto: p.nome,
        quantidade,
        unidade: p.unidade,
        custoMedio: p.custoMedio,
        valor: Math.round(quantidade * p.custoMedio * 100) / 100,
      }
    })
    .filter((i) => i.quantidade > 0)
    .sort((a, b) => b.valor - a.valor)
  return { itens, total: Math.round(itens.reduce((s, i) => s + i.valor, 0) * 100) / 100 }
}

export interface ResumoRendimento {
  ordens: number
  recebidoKg: number
  aproveitavelKg: number
  rendimento: number | null
  custoEfetivoMedio: number | null
}

export function resumirRendimento(
  ordens: Array<{
    pecaBruta: { pesoKg: number }
    saidas: Array<{ pesoKg: number; classificacao: string }>
    rendimentoRealizado: number
    custoEfetivoPorKg: number
  }>,
): ResumoRendimento {
  const recebidoKg = Math.round(ordens.reduce((s, o) => s + o.pecaBruta.pesoKg, 0) * 100) / 100
  const aproveitavelKg =
    Math.round(
      ordens.reduce(
        (s, o) => s + o.saidas.filter((x) => x.classificacao === 'CORTE').reduce((a, x) => a + x.pesoKg, 0),
        0,
      ) * 100,
    ) / 100
  const custoPonderado = ordens.reduce((s, o) => s + o.custoEfetivoPorKg * o.pecaBruta.pesoKg, 0)
  return {
    ordens: ordens.length,
    recebidoKg,
    aproveitavelKg,
    rendimento: recebidoKg > 0 ? Math.round((aproveitavelKg / recebidoKg) * 1000) / 1000 : null,
    custoEfetivoMedio: recebidoKg > 0 ? Math.round((custoPonderado / recebidoKg) * 100) / 100 : null,
  }
}

export interface Comparativo {
  receitaAtual: number
  receitaAnterior: number
  variacaoReceita: number | null
  lucroAtual: number
  lucroAnterior: number
  variacaoLucro: number | null
}

/** Compara o período atual com a janela anterior de mesmo tamanho (quando há histórico). */
export function compararComAnterior(todos: DiaFinanceiro[], atual: DiaFinanceiro[]): Comparativo | null {
  if (atual.length === 0 || todos.length < atual.length * 2) return null
  const fim = todos.length - atual.length
  const anterior = todos.slice(Math.max(0, fim - atual.length), fim)
  const soma = (lista: DiaFinanceiro[], campo: 'receita' | 'cmv' | 'despesas') =>
    lista.reduce((s, d) => s + d[campo], 0)
  const receitaAtual = soma(atual, 'receita')
  const receitaAnterior = soma(anterior, 'receita')
  const lucroAtual = receitaAtual - soma(atual, 'cmv') - soma(atual, 'despesas')
  const lucroAnterior = receitaAnterior - soma(anterior, 'cmv') - soma(anterior, 'despesas')
  return {
    receitaAtual,
    receitaAnterior,
    variacaoReceita: receitaAnterior > 0 ? (receitaAtual - receitaAnterior) / receitaAnterior : null,
    lucroAtual,
    lucroAnterior,
    variacaoLucro: lucroAnterior !== 0 ? (lucroAtual - lucroAnterior) / Math.abs(lucroAnterior) : null,
  }
}

/** Prazo médio estimado de recebimento a partir do saldo fiado e da receita diária. */
export function prazoMedioRecebimento(saldoFiado: number, receitaDiaria: number): number | null {
  if (receitaDiaria <= 0) return null
  return Math.round((saldoFiado / receitaDiaria) * 10) / 10
}
