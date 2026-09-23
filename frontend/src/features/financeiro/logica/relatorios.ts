// Relatórios gerenciais do açougue/mercado — puros e testáveis.
// Fonte: vendas reais + catálogo (grupo/subgrupo com snapshot no item).
// Canceladas saem do faturamento, mas contam na auditoria.

import { resolverGrupo } from '../../mercado/logica/grupos'
import { arredondar } from '../../mercado/logica/mercado'
import type { Devolucao, PerdaMercado, ProdutoMercado, Venda } from '../../mercado/tipos'

export interface FiltroRelatorio {
  grupo?: string
  subgrupo?: string
  forma?: string
  operador?: string
  inicio?: string // yyyy-mm-dd
  fim?: string // yyyy-mm-dd
}

export interface ItemEnriquecido {
  vendaId: string
  vendaNumero: number
  criadaEm: string
  hora: number
  operador: string
  terminal: string
  forma: string
  estado: Venda['estado']
  produtoId: string
  produto: string
  categoria: string
  grupo: string
  subgrupo: string
  fornecedor: string
  quantidade: number
  precoUnitario: number
  desconto: number
  receita: number
  custoUnitario: number
  cmv: number
  lucro: number
}

export function horaDeVenda(iso: string): number {
  const d = new Date(iso)
  const h = d.getHours()
  return Number.isNaN(h) ? 0 : Math.min(23, Math.max(0, h))
}

function mapaProdutos(produtos: ProdutoMercado[]): Map<string, ProdutoMercado> {
  return new Map(produtos.map((p) => [p.id, p]))
}

/** Enriquece itens com snapshot (preserva histórico) + fallback para o catálogo atual. */
export function enriquecerItens(vendas: Venda[], produtos: ProdutoMercado[]): ItemEnriquecido[] {
  const mapa = mapaProdutos(produtos)
  const itens: ItemEnriquecido[] = []
  for (const venda of vendas) {
    for (const item of venda.itens) {
      const produto = mapa.get(item.produtoId)
      const comercial = produto
        ? resolverGrupo(produto)
        : { grupo: item.grupo ?? 'Geral', subgrupo: item.subgrupo ?? 'Geral' }
      const desconto = arredondar((item.descontoPromo ?? 0) + (item.descontoManual ?? 0))
      const receita = arredondar(item.quantidade * item.precoUnitario - desconto)
      const custoUnitario = item.custoUnitario ?? produto?.custoMedio ?? 0
      const cmv = arredondar(item.quantidade * custoUnitario)
      itens.push({
        vendaId: venda.id,
        vendaNumero: venda.numero,
        criadaEm: venda.criadaEm,
        hora: horaDeVenda(venda.criadaEm),
        operador: venda.operador,
        terminal: venda.terminal ?? 'Caixa 01',
        forma: venda.pagamento.forma,
        estado: venda.estado,
        produtoId: item.produtoId,
        produto: item.nome,
        categoria: item.categoria ?? produto?.categoria ?? 'Geral',
        grupo: item.grupo ?? comercial.grupo,
        subgrupo: item.subgrupo ?? comercial.subgrupo,
        fornecedor: produto?.fornecedor ?? 'A definir',
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        desconto,
        receita,
        custoUnitario,
        cmv,
        lucro: arredondar(receita - cmv),
      })
    }
  }
  return itens
}

/** Vendas válidas para faturamento (cancelada sai das contas, preserva histórico). */
export function vendasValidas(vendas: Venda[]): Venda[] {
  return vendas.filter((v) => v.estado !== 'CANCELADA')
}

export function filtrarVendas(vendas: Venda[], produtos: ProdutoMercado[], filtro: FiltroRelatorio): Venda[] {
  const mapa = mapaProdutos(produtos)
  return vendas.filter((v) => {
    if (filtro.forma && v.pagamento.forma !== filtro.forma) return false
    if (filtro.operador && v.operador !== filtro.operador) return false
    const dia = v.criadaEm.slice(0, 10)
    if (filtro.inicio && dia < filtro.inicio) return false
    if (filtro.fim && dia > filtro.fim) return false
    if (filtro.grupo || filtro.subgrupo) {
      const bate = v.itens.some((item) => {
        const produto = mapa.get(item.produtoId)
        const g = item.grupo ?? (produto ? resolverGrupo(produto).grupo : 'Geral')
        const s = item.subgrupo ?? (produto ? resolverGrupo(produto).subgrupo : 'Geral')
        if (filtro.grupo && g !== filtro.grupo) return false
        if (filtro.subgrupo && s !== filtro.subgrupo) return false
        return true
      })
      if (!bate) return false
    }
    return true
  })
}

export interface LinhaGrupo {
  grupo: string
  subgrupo: string
  receita: number
  quantidade: number
  cmv: number
  lucro: number
  margem: number | null
  desconto: number
  vendas: number
  participacao: number
  classeABC: 'A' | 'B' | 'C'
}

/** Agrega por grupo/subgrupo a partir de itens válidos (receita, CMV, margem, ABC). */
export function relatorioPorGrupo(vendas: Venda[], produtos: ProdutoMercado[]): LinhaGrupo[] {
  const itens = enriquecerItens(vendasValidas(vendas), produtos)
  const mapa = new Map<string, LinhaGrupo & { vendasSet: Set<string> }>()
  for (const item of itens) {
    const chave = `${item.grupo}||${item.subgrupo}`
    let linha = mapa.get(chave)
    if (!linha) {
      linha = {
        grupo: item.grupo,
        subgrupo: item.subgrupo,
        receita: 0,
        quantidade: 0,
        cmv: 0,
        lucro: 0,
        margem: null,
        desconto: 0,
        vendas: 0,
        participacao: 0,
        classeABC: 'C',
        vendasSet: new Set(),
      }
      mapa.set(chave, linha)
    }
    linha.receita = arredondar(linha.receita + item.receita)
    linha.quantidade = arredondar(linha.quantidade + item.quantidade)
    linha.cmv = arredondar(linha.cmv + item.cmv)
    linha.lucro = arredondar(linha.lucro + item.lucro)
    linha.desconto = arredondar(linha.desconto + item.desconto)
    linha.vendasSet.add(item.vendaId)
  }
  const linhas = [...mapa.values()]
    .map((l) => ({ ...l, vendas: l.vendasSet.size }))
    .sort((a, b) => b.receita - a.receita)
  const total = linhas.reduce((s, l) => s + l.receita, 0)
  let acumulado = 0
  return linhas.map((l) => {
    acumulado += total > 0 ? l.receita / total : 0
    return {
      grupo: l.grupo,
      subgrupo: l.subgrupo,
      receita: l.receita,
      quantidade: l.quantidade,
      cmv: l.cmv,
      lucro: l.lucro,
      margem: l.receita > 0 ? l.lucro / l.receita : null,
      desconto: l.desconto,
      vendas: l.vendas,
      participacao: total > 0 ? l.receita / total : 0,
      classeABC: (acumulado <= 0.7 ? 'A' : acumulado <= 0.9 ? 'B' : 'C') as 'A' | 'B' | 'C',
    }
  })
}

export interface LinhaProdutoReal {
  produtoId: string
  produto: string
  grupo: string
  subgrupo: string
  receita: number
  quantidade: number
  cmv: number
  lucro: number
  margem: number | null
  participacao: number
  classeABC: 'A' | 'B' | 'C'
}

export function margemRealPorProduto(vendas: Venda[], produtos: ProdutoMercado[]): LinhaProdutoReal[] {
  const itens = enriquecerItens(vendasValidas(vendas), produtos)
  const mapa = new Map<string, LinhaProdutoReal>()
  for (const item of itens) {
    const atual = mapa.get(item.produtoId) ?? {
      produtoId: item.produtoId,
      produto: item.produto,
      grupo: item.grupo,
      subgrupo: item.subgrupo,
      receita: 0,
      quantidade: 0,
      cmv: 0,
      lucro: 0,
      margem: null,
      participacao: 0,
      classeABC: 'C' as const,
    }
    atual.receita = arredondar(atual.receita + item.receita)
    atual.quantidade = arredondar(atual.quantidade + item.quantidade)
    atual.cmv = arredondar(atual.cmv + item.cmv)
    atual.lucro = arredondar(atual.lucro + item.lucro)
    mapa.set(item.produtoId, atual)
  }
  const linhas = [...mapa.values()].sort((a, b) => b.receita - a.receita)
  const total = linhas.reduce((s, l) => s + l.receita, 0)
  let acumulado = 0
  return linhas.map((l) => {
    acumulado += total > 0 ? l.receita / total : 0
    return {
      ...l,
      margem: l.receita > 0 ? l.lucro / l.receita : null,
      participacao: total > 0 ? l.receita / total : 0,
      classeABC: (acumulado <= 0.7 ? 'A' : acumulado <= 0.9 ? 'B' : 'C') as 'A' | 'B' | 'C',
    }
  })
}

export interface LinhaHora {
  hora: number
  vendas: number
  receita: number
  ticketMedio: number | null
  quantidade: number
  cmv: number
  lucro: number
  margem: number | null
  desconto: number
  cancelamentos: number
}

/** 24 linhas (00–23): vendas, receita, ticket, CMV, lucro e cancelamentos. */
export function relatorioPorHora(vendas: Venda[], produtos: ProdutoMercado[]): LinhaHora[] {
  const mapa = mapaProdutos(produtos)
  const linhas: LinhaHora[] = Array.from({ length: 24 }, (_, hora) => ({
    hora,
    vendas: 0,
    receita: 0,
    ticketMedio: null,
    quantidade: 0,
    cmv: 0,
    lucro: 0,
    margem: null,
    desconto: 0,
    cancelamentos: 0,
  }))
  for (const venda of vendas) {
    const hora = horaDeVenda(venda.criadaEm)
    const linha = linhas[hora]
    if (venda.estado === 'CANCELADA') {
      linha.cancelamentos += 1
      continue
    }
    linha.vendas += 1
    linha.receita = arredondar(linha.receita + venda.total)
    linha.desconto = arredondar(linha.desconto + venda.descontoTotal)
    for (const item of venda.itens) {
      const produto = mapa.get(item.produtoId)
      const custo = item.custoUnitario ?? produto?.custoMedio ?? 0
      linha.quantidade = arredondar(linha.quantidade + item.quantidade)
      linha.cmv = arredondar(linha.cmv + item.quantidade * custo)
    }
  }
  for (const linha of linhas) {
    linha.lucro = arredondar(linha.receita - linha.cmv)
    linha.ticketMedio = linha.vendas > 0 ? arredondar(linha.receita / linha.vendas) : null
    linha.margem = linha.receita > 0 ? linha.lucro / linha.receita : null
  }
  return linhas
}

export interface LinhaOperador {
  operador: string
  vendas: number
  receita: number
  ticketMedio: number | null
  desconto: number
  cancelamentos: number
}

export function relatorioPorOperador(vendas: Venda[]): LinhaOperador[] {
  const mapa = new Map<string, LinhaOperador>()
  for (const venda of vendas) {
    const atual = mapa.get(venda.operador) ?? {
      operador: venda.operador,
      vendas: 0,
      receita: 0,
      ticketMedio: null,
      desconto: 0,
      cancelamentos: 0,
    }
    if (venda.estado === 'CANCELADA') {
      atual.cancelamentos += 1
    } else {
      atual.vendas += 1
      atual.receita = arredondar(atual.receita + venda.total)
      atual.desconto = arredondar(atual.desconto + venda.descontoTotal)
    }
    mapa.set(venda.operador, atual)
  }
  return [...mapa.values()]
    .map((l) => ({ ...l, ticketMedio: l.vendas > 0 ? arredondar(l.receita / l.vendas) : null }))
    .sort((a, b) => b.receita - a.receita)
}

export interface LinhaPagamento {
  forma: string
  vendas: number
  receita: number
  participacao: number
}

export function relatorioPorPagamento(vendas: Venda[]): LinhaPagamento[] {
  const mapa = new Map<string, LinhaPagamento>()
  for (const venda of vendasValidas(vendas)) {
    const atual = mapa.get(venda.pagamento.forma) ?? {
      forma: venda.pagamento.forma,
      vendas: 0,
      receita: 0,
      participacao: 0,
    }
    atual.vendas += 1
    atual.receita = arredondar(atual.receita + venda.total)
    mapa.set(venda.pagamento.forma, atual)
  }
  const linhas = [...mapa.values()].sort((a, b) => b.receita - a.receita)
  const total = linhas.reduce((s, l) => s + l.receita, 0)
  return linhas.map((l) => ({ ...l, participacao: total > 0 ? l.receita / total : 0 }))
}

export interface LinhaFornecedor {
  fornecedor: string
  receita: number
  cmv: number
  lucro: number
  margem: number | null
  itens: number
}

export function relatorioPorFornecedor(vendas: Venda[], produtos: ProdutoMercado[]): LinhaFornecedor[] {
  const itens = enriquecerItens(vendasValidas(vendas), produtos)
  const mapa = new Map<string, LinhaFornecedor>()
  for (const item of itens) {
    const atual = mapa.get(item.fornecedor) ?? {
      fornecedor: item.fornecedor,
      receita: 0,
      cmv: 0,
      lucro: 0,
      margem: null,
      itens: 0,
    }
    atual.receita = arredondar(atual.receita + item.receita)
    atual.cmv = arredondar(atual.cmv + item.cmv)
    atual.lucro = arredondar(atual.lucro + item.lucro)
    atual.itens += 1
    mapa.set(item.fornecedor, atual)
  }
  return [...mapa.values()]
    .map((l) => ({ ...l, margem: l.receita > 0 ? l.lucro / l.receita : null }))
    .sort((a, b) => b.receita - a.receita)
}

export interface LinhaPerdaGrupo {
  grupo: string
  subgrupo: string
  valor: number
  quantidade: number
}

export function perdasPorGrupo(perdas: PerdaMercado[], produtos: ProdutoMercado[]): LinhaPerdaGrupo[] {
  const mapa = mapaProdutos(produtos)
  const agregado = new Map<string, LinhaPerdaGrupo>()
  for (const perda of perdas) {
    const produto = mapa.get(perda.produtoId)
    const comercial = produto ? resolverGrupo(produto) : { grupo: 'Geral', subgrupo: 'Geral' }
    const chave = `${comercial.grupo}||${comercial.subgrupo}`
    const atual = agregado.get(chave) ?? {
      grupo: comercial.grupo,
      subgrupo: comercial.subgrupo,
      valor: 0,
      quantidade: 0,
    }
    atual.valor = arredondar(atual.valor + perda.valor)
    atual.quantidade = arredondar(atual.quantidade + perda.quantidade)
    agregado.set(chave, atual)
  }
  return [...agregado.values()].sort((a, b) => b.valor - a.valor)
}

export interface ResumoAuditoria {
  vendasValidas: number
  canceladas: number
  devolvidas: number
  descontoTotal: number
  reimpressoes: number
  divergenciasCaixa: number
}

/** Auditoria operacional: o que saiu do faturamento sem apagar histórico. */
export function resumirAuditoria(vendas: Venda[], devolucoes: Devolucao[]): ResumoAuditoria {
  return {
    vendasValidas: vendas.filter((v) => v.estado !== 'CANCELADA').length,
    canceladas: vendas.filter((v) => v.estado === 'CANCELADA').length,
    devolvidas: devolucoes.length,
    descontoTotal: arredondar(
      vendas.filter((v) => v.estado !== 'CANCELADA').reduce((s, v) => s + v.descontoTotal, 0),
    ),
    reimpressoes: vendas.reduce((s, v) => s + (v.reimpressoes ?? 0), 0),
    divergenciasCaixa: 0,
  }
}
