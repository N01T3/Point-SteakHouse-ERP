// Livro único de movimentos do estoque — fonte única operacional.
// Cada evento (recebimento, venda, desossa, maturação, perda, transferência,
// devolução, ajuste, descarte) gera um lançamento auditável. O saldo é
// derivado desses lançamentos; nunca alterado de forma silenciosa.
export type TipoMovimentoEstoque =
  | 'recebimento'
  | 'venda'
  | 'cancelamento'
  | 'devolucao'
  | 'perda'
  | 'transferencia'
  | 'ajuste'
  | 'desossa_entrada'
  | 'desossa_saida'
  | 'maturacao_entrada'
  | 'maturacao_saida'
  | 'liberacao_quarentena'
  | 'descarte'

export interface MovimentoLivro {
  id: string
  tipo: TipoMovimentoEstoque
  produtoId: string
  produto: string
  lote: string
  quantidade: number // positivo = entrada, negativo = saída
  custoUnitario?: number
  motivo: string
  operador: string
  terminal?: string
  online: boolean
  referencia?: string // venda #N, ordem, pedido, contagem…
  criadaEm: string // ISO
}

export interface DadosLancamento extends Omit<MovimentoLivro, 'id' | 'criadaEm'> {
  criadaEm?: string
}

export function criarLancamento(dados: DadosLancamento): MovimentoLivro {
  if (!dados.produtoId.trim()) throw new Error('Movimento exige produto.')
  if (!dados.lote.trim()) throw new Error('Movimento exige lote.')
  if (!(Math.abs(dados.quantidade) > 0)) throw new Error('Quantidade deve ser diferente de zero.')
  if (!dados.motivo.trim()) throw new Error('Motivo é obrigatório para auditoria.')
  if (!dados.operador.trim()) throw new Error('Operador é obrigatório para auditoria.')
  return {
    ...dados,
    id: `mov-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
    criadaEm: dados.criadaEm ?? new Date().toISOString(),
  }
}

/** Saldo derivado do livro para um produto/lote. */
export function saldoDoLivro(movimentos: MovimentoLivro[], produtoId: string, lote?: string): number {
  const total = movimentos
    .filter((m) => m.produtoId === produtoId && (!lote || m.lote === lote))
    .reduce((soma, m) => soma + m.quantidade, 0)
  return Math.round(total * 1000) / 1000
}

/** Cadeia de transformação de um lote: todos os lançamentos em ordem. */
export function cadeiaDoLote(movimentos: MovimentoLivro[], lote: string): MovimentoLivro[] {
  return movimentos.filter((m) => m.lote === lote).sort((a, b) => (a.criadaEm < b.criadaEm ? -1 : 1))
}
