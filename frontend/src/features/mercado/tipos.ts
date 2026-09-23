// Tipos do Mercado — ciclo operacional descrito em
// `mercado-point-steakhouse-profundo.md`: produto → lote/validade → venda
// → pagamento → caixa → devolução. Valores em reais com 2 casas; pesos em kg.
export type UnidadeVenda = 'KG' | 'UN'

export type EstadoLote = 'LIBERADO' | 'QUARENTENA' | 'BLOQUEADO' | 'DESCARTADO' | 'DEVOLVIDO'

/** Origem do lote — base da rastreabilidade ponta a ponta. */
export interface OrigemLote {
  tipo: 'compra' | 'desossa' | 'maturacao' | 'producao'
  referencia?: string // pedido, ordem de desossa, peça maturada…
  fornecedor?: string
  pecaBrutaId?: string
  responsavel?: string
}

export interface LoteProduto {
  lote: string
  validade: string // ISO yyyy-mm-dd
  quantidade: number
  estado: EstadoLote
  /** Local físico; ausente = 'Loja' (compatível com dados antigos). */
  local?: string
  motivoBloqueio?: string
  custoUnitario?: number
  origem?: OrigemLote
}

export interface ProdutoMercado {
  id: string
  nome: string
  categoria: string
  /** Hierarquia comercial — grupo > subgrupo > item. */
  grupo?: string
  subgrupo?: string
  unidade: UnidadeVenda
  preco: number
  custoMedio: number
  margemAlvo?: number
  fornecedor?: string
  ativo?: boolean
  codigoBarras?: string
  plu?: string
  estoqueMinimo: number
  estoqueAlvo: number
  lotes: LoteProduto[]
}

export type TipoPromocao = 'markdown_validade' | 'quantidade'

export interface Promocao {
  id: string
  descricao: string
  tipo: TipoPromocao
  percentual: number
  ativa: boolean
  produtoId?: string
  diasLimite?: number
  quantidadeMinima?: number
}

export interface ClienteFiado {
  id: string
  nome: string
  limite: number
  saldo: number
}

export type FormaPagamento = 'DINHEIRO' | 'CARTAO' | 'PIX' | 'FIADO'

export interface ItemCarrinho {
  produtoId: string
  nome: string
  /** Snapshot comercial — preserva grupo/subgrupo/categoria do momento da venda. */
  categoria?: string
  grupo?: string
  subgrupo?: string
  custoUnitario?: number
  unidade: UnidadeVenda
  quantidade: number
  precoUnitario: number
  descontoPromo: number
  descontoManual: number
  descricaoPromo?: string
  motivoDesconto?: string
  lote: string
  validade: string
}

export interface ParcelaPagamento {
  forma: FormaPagamento
  valor: number
  clienteId?: string
  clienteNome?: string
}

export interface PagamentoVenda {
  /** À vista usa uma forma; dividido combina parcelas que somam o total. */
  forma: FormaPagamento | 'DIVIDIDO'
  valorRecebido?: number
  troco?: number
  clienteId?: string
  clienteNome?: string
  parcelas?: ParcelaPagamento[]
}

export type EstadoVenda = 'CONCLUIDA' | 'DEVOLVIDA_PARCIAL' | 'DEVOLVIDA_TOTAL' | 'CANCELADA'

export interface Venda {
  id: string
  numero: number
  itens: ItemCarrinho[]
  subtotal: number
  descontoTotal: number
  total: number
  pagamento: PagamentoVenda
  /** Partes do total por forma — base do esperado em dinheiro e do fiado do turno. */
  valorDinheiro: number
  valorFiado: number
  operador: string
  terminal?: string
  criadaEm: string // ISO
  sincronizada: boolean
  estado: EstadoVenda
  canceladaEm?: string
  motivoCancelamento?: string
  canceladaPor?: string
  reimpressoes?: number
}

export interface VendaSuspensa {
  id: string
  rotulo: string
  itens: ItemCarrinho[]
  criadaEm: string
}

export type TipoMovimentoCaixa = 'SANGRIA' | 'SUPRIMENTO'

export interface MovimentoCaixa {
  id: string
  tipo: TipoMovimentoCaixa
  valor: number
  motivo: string
  criadoEm: string
}

export type DestinoDevolucao = 'VENDAVEL' | 'QUARENTENA' | 'DESCARTE'

export interface ItemDevolvido {
  produtoId: string
  nome: string
  quantidade: number
  valor: number
  destino: DestinoDevolucao
}

export interface Devolucao {
  id: string
  vendaId: string
  numeroVenda: number
  itens: ItemDevolvido[]
  motivo: string
  valorTotal: number
  operador: string
  criadaEm: string
}

export interface TurnoCaixa {
  id: string
  operador: string
  terminal: string
  abertoEm: string
  valorInicial: number
  estado: 'ABERTO' | 'FECHADO'
  fechadoEm?: string
  valorContado?: number
  diferenca?: number
  aprovadorDivergencia?: string
}

export type MotivoPerdaMercado =
  | 'validade'
  | 'deterioracao'
  | 'quebra_frio'
  | 'desossa'
  | 'maturacao'
  | 'dano'
  | 'outros'

export interface PerdaMercado {
  id: string
  produtoId: string
  produto: string
  lote: string
  quantidade: number
  valor: number
  motivo: MotivoPerdaMercado
  responsavel: string
  criadaEm: string
}

export interface RecebimentoMercado {
  id: string
  fornecedor: string
  produto: string
  quantidade: number
  custoUnitario: number
  lote: string
  validade: string
  temperatura?: number
  divergencia?: string
  criadaEm: string
}

export const LOCAIS_ESTOQUE = [
  'Loja',
  'Balcão',
  'Câmara fria 1',
  'Câmara fria 2',
  'Depósito',
  'Quarentena',
] as const

export type LocalEstoque = (typeof LOCAIS_ESTOQUE)[number] | string

/** Local efetivo do lote (lotes antigos sem local ficam na Loja). */
export function localDoLote(lote: { local?: string }): string {
  return lote.local ?? 'Loja'
}

export interface TransferenciaEstoque {
  id: string
  produtoId: string
  produto: string
  lote: string
  origem: string
  destino: string
  quantidade: number
  motivo: string
  operador: string
  criadaEm: string
}

export type StatusContagem = 'pendente' | 'aprovada'

export interface ContagemEstoque {
  id: string
  produtoId: string
  produto: string
  lote: string
  local: string
  contado: number
  sistema: number
  diferenca: number
  motivo: string
  operador: string
  aprovador?: string
  status: StatusContagem
  criadaEm: string
}

export interface Fornecedor {
  id: string
  nome: string
  contato?: string
  leadTimeDias?: number
  pedidoMinimo?: number
  criadoEm: string
}

export interface ItemPedidoCompra {
  produtoId: string
  produto: string
  quantidade: number
  custoUnitario: number
}

export type StatusPedido = 'aberto' | 'recebido-parcial' | 'recebido' | 'cancelado'

export interface PedidoCompra {
  id: string
  numero: number
  fornecedorId: string
  fornecedor: string
  itens: ItemPedidoCompra[]
  valorTotal: number
  status: StatusPedido
  entregaPrevista?: string
  operador: string
  criadoEm: string
}

export interface RastroLote {
  produto?: string
  validade?: string
  estoquePorLocal: Array<{ local: string; quantidade: number; estado: string }>
  vendas: Array<{
    numero: number
    criadaEm: string
    operador: string
    clienteNome?: string
    quantidade: number
  }>
}
