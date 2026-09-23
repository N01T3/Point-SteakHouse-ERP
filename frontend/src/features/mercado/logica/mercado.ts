// Regras puras do Mercado — sem Vue, sem Pinia, 100% testáveis.
// Espelham as decisões de `mercado-point-steakhouse-profundo.md`.
import type {
  ClienteFiado,
  FormaPagamento,
  LoteProduto,
  ProdutoMercado,
  Promocao,
  TipoMovimentoCaixa,
} from '../tipos'

export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

export function diasParaVencer(validade: string, hoje: string): number {
  const msPorDia = 24 * 60 * 60 * 1000
  const fim = new Date(`${validade}T00:00:00`).getTime()
  const inicio = new Date(`${hoje}T00:00:00`).getTime()
  return Math.round((fim - inicio) / msPorDia)
}

export function loteVencido(lote: LoteProduto, hoje: string): boolean {
  return diasParaVencer(lote.validade, hoje) < 0
}

/** Soma o estoque físico (tudo que não foi descartado/devolvido). */
export function estoqueTotal(produto: ProdutoMercado): number {
  return arredondar(
    produto.lotes
      .filter((lote) => lote.estado !== 'DESCARTADO' && lote.estado !== 'DEVOLVIDO')
      .reduce((soma, lote) => soma + lote.quantidade, 0),
  )
}

/**
 * FEFO: escolhe o lote liberado, não vencido, com menor validade.
 * Ignora quarentena, bloqueios e lotes zerados.
 */
export function loteParaVenda(produto: ProdutoMercado, hoje: string): LoteProduto | null {
  const candidatos = produto.lotes
    .filter((lote) => lote.estado === 'LIBERADO' && lote.quantidade > 0 && !loteVencido(lote, hoje))
    .sort((a, b) => (a.validade < b.validade ? -1 : 1))
  return candidatos[0] ?? null
}

/** Explica por que o produto não pode ser vendido, ou null quando pode. */
export function bloqueioDeVenda(produto: ProdutoMercado, hoje: string): string | null {
  if (loteParaVenda(produto, hoje)) return null
  if (produto.lotes.some((lote) => lote.estado === 'QUARENTENA' && lote.quantidade > 0)) {
    return 'Em quarentena — aguardando conferência'
  }
  if (produto.lotes.some((lote) => loteVencido(lote, hoje) && lote.quantidade > 0)) {
    return 'Vencido — venda bloqueada'
  }
  if (produto.lotes.some((lote) => lote.estado === 'BLOQUEADO')) {
    return produto.lotes.find((lote) => lote.estado === 'BLOQUEADO')?.motivoBloqueio ?? 'Bloqueado para venda'
  }
  return 'Sem estoque disponível'
}

export interface PromocaoAplicada {
  percentual: number
  descricao: string
}

/** Prioridade: markdown de validade → promoção por quantidade. */
export function promocaoDoItem(
  produto: ProdutoMercado,
  lote: LoteProduto,
  quantidade: number,
  promocoes: Promocao[],
  hoje: string,
): PromocaoAplicada | null {
  const markdown = promocoes.find((p) => p.ativa && p.tipo === 'markdown_validade')
  if (markdown?.diasLimite !== undefined && diasParaVencer(lote.validade, hoje) <= markdown.diasLimite) {
    return { percentual: markdown.percentual, descricao: markdown.descricao }
  }
  const porQuantidade = promocoes.find(
    (p) => p.ativa && p.tipo === 'quantidade' && p.produtoId === produto.id && (p.quantidadeMinima ?? 0) <= quantidade,
  )
  if (porQuantidade) return { percentual: porQuantidade.percentual, descricao: porQuantidade.descricao }
  return null
}

export function subtotalItem(quantidade: number, precoUnitario: number, descontoPromo: number, descontoManual: number): number {
  return arredondar(quantidade * precoUnitario - descontoPromo - descontoManual)
}

export function calcularTroco(total: number, recebido: number): number | null {
  if (recebido < total) return null
  return arredondar(recebido - total)
}

export function fiadoDisponivel(cliente: ClienteFiado): number {
  return arredondar(cliente.limite - cliente.saldo)
}

export function podeVenderFiado(cliente: ClienteFiado, total: number): boolean {
  return fiadoDisponivel(cliente) >= total
}

export function esperadoDinheiro(args: {
  valorInicial: number
  vendas: Array<{ total: number; forma: FormaPagamento }>
  movimentos: Array<{ tipo: TipoMovimentoCaixa; valor: number }>
  devolucoesDinheiro: number
}): number {
  const entradas = args.vendas
    .filter((venda) => venda.forma === 'DINHEIRO')
    .reduce((soma, venda) => soma + venda.total, 0)
  const sangrias = args.movimentos
    .filter((mov) => mov.tipo === 'SANGRIA')
    .reduce((soma, mov) => soma + mov.valor, 0)
  const suprimentos = args.movimentos
    .filter((mov) => mov.tipo === 'SUPRIMENTO')
    .reduce((soma, mov) => soma + mov.valor, 0)
  return arredondar(args.valorInicial + entradas + suprimentos - sangrias - args.devolucoesDinheiro)
}

export interface SugestaoReposicao {
  atual: number
  minimo: number
  alvo: number
  sugestao: number
  critica: boolean
}

export function sugestaoReposicao(produto: ProdutoMercado): SugestaoReposicao {
  const atual = estoqueTotal(produto)
  return {
    atual,
    minimo: produto.estoqueMinimo,
    alvo: produto.estoqueAlvo,
    sugestao: arredondar(Math.max(0, produto.estoqueAlvo - atual)),
    critica: atual <= produto.estoqueMinimo,
  }
}
