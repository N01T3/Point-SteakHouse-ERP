// Resolução do bip do leitor (scanner USB/Bluetooth age como teclado + Enter).
// Pura e testável: recebe o texto e o catálogo, diz o que o caixa deve fazer.

import type { ProdutoMercado } from '../tipos'
import { interpretarCodigo } from './codigoBarras'

export type ResolucaoBipe =
  | { tipo: 'adicionar'; produtoId: string; quantidade: number; origem: string }
  | { tipo: 'pesar'; produtoId: string; origem: string }
  | { tipo: 'busca' }
  | { tipo: 'erro'; mensagem: string }

/** PLU pode vir com zeros à esquerda na etiqueta (00101 = 101). */
export function normalizarPlu(codigo: string): string {
  const limpo = codigo.replace(/^0+/, '')
  return limpo === '' ? '0' : limpo
}

function porPlu(produtos: ProdutoMercado[], codigo: string): ProdutoMercado | undefined {
  const alvo = normalizarPlu(codigo)
  return produtos.find((p) => p.plu !== undefined && normalizarPlu(p.plu) === alvo)
}

export function resolverBipe(entrada: string, produtos: ProdutoMercado[]): ResolucaoBipe {
  const codigo = entrada.trim()
  if (!codigo) return { tipo: 'busca' }
  const interpretado = interpretarCodigo(codigo)

  // Texto livre (nome) → busca manual normal.
  if (interpretado.classe === 'invalido' && !/^\d+$/.test(codigo)) return { tipo: 'busca' }
  if (interpretado.classe === 'invalido') {
    return { tipo: 'erro', mensagem: 'Código com dígito inválido — confira a etiqueta e bipe de novo.' }
  }

  if (interpretado.classe === 'gtin-brasil' || interpretado.classe === 'gtin-externo') {
    const produto = produtos.find((p) => p.codigoBarras === codigo)
    if (!produto) {
      return { tipo: 'erro', mensagem: 'Produto não cadastrado — chame o dono/administrador para cadastrar.' }
    }
    if (produto.unidade === 'UN') {
      return { tipo: 'adicionar', produtoId: produto.id, quantidade: 1, origem: `bip ${produto.nome}` }
    }
    return { tipo: 'pesar', produtoId: produto.id, origem: `${produto.nome} bipado — informe o peso` }
  }

  if (interpretado.classe === 'peso-variavel-preco') {
    const produto = porPlu(produtos, interpretado.produtoCodigo ?? '')
    if (!produto) return { tipo: 'erro', mensagem: 'PLU da etiqueta não cadastrado — confira o cadastro.' }
    if (produto.unidade !== 'KG' || produto.preco <= 0 || interpretado.precoEmbutido === undefined) {
      return { tipo: 'erro', mensagem: 'Etiqueta de preço só vale para item vendido por peso.' }
    }
    const quantidade = Math.round((interpretado.precoEmbutido / produto.preco) * 1000) / 1000
    if (!(quantidade > 0)) return { tipo: 'erro', mensagem: 'Valor da etiqueta inválido.' }
    return { tipo: 'adicionar', produtoId: produto.id, quantidade, origem: `etiqueta ${produto.nome}` }
  }

  if (interpretado.classe === 'peso-variavel-peso') {
    const produto = porPlu(produtos, interpretado.produtoCodigo ?? '')
    if (!produto) return { tipo: 'erro', mensagem: 'PLU da etiqueta não cadastrado — confira o cadastro.' }
    if (
      produto.unidade !== 'KG' ||
      interpretado.pesoEmbutidoKg === undefined ||
      !(interpretado.pesoEmbutidoKg > 0)
    ) {
      return { tipo: 'erro', mensagem: 'Etiqueta de peso só vale para item vendido por peso.' }
    }
    return {
      tipo: 'adicionar',
      produtoId: produto.id,
      quantidade: interpretado.pesoEmbutidoKg,
      origem: `etiqueta ${produto.nome}`,
    }
  }

  // PLU / código interno
  const produto = porPlu(produtos, codigo)
  if (!produto) return { tipo: 'erro', mensagem: `PLU ${codigo} não cadastrado.` }
  if (produto.unidade === 'UN') {
    return { tipo: 'adicionar', produtoId: produto.id, quantidade: 1, origem: `PLU ${produto.nome}` }
  }
  return { tipo: 'pesar', produtoId: produto.id, origem: `${produto.nome} — informe o peso` }
}
