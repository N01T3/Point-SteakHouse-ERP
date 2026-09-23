export interface AlertaDeEstoque {
  nome: string
  quantidadeAtual: number
  quantidadeMinima: number
  unidade: string
}

export interface ItemDeEstoqueRepository {
  listarComEstoqueBaixo(): Promise<AlertaDeEstoque[]>
}

export const ITEM_DE_ESTOQUE_REPOSITORY = Symbol('ItemDeEstoqueRepository')
