// Serialização e mesclagem do catálogo local — puro e testável.
// Estratégia: o catálogo local manda; ao mudar a versão demo, itens novos
// da base são acrescentados sem apagar alterações locais.
import type { ProdutoMercado } from '../tipos'
import { enriquecerProduto } from './grupos'

export const CHAVE_CATALOGO = 'mercado:catalogo:v3'
export const VERSAO_CATALOGO = 3

export interface CatalogoSalvo {
  versao: number
  salvoEm: string
  produtos: ProdutoMercado[]
}

export function serializarCatalogo(produtos: ProdutoMercado[]): CatalogoSalvo {
  return {
    versao: VERSAO_CATALOGO,
    salvoEm: new Date().toISOString(),
    produtos: JSON.parse(JSON.stringify(produtos)) as ProdutoMercado[],
  }
}

export function mesclarCatalogo(base: ProdutoMercado[], salvo: CatalogoSalvo | null): ProdutoMercado[] {
  if (!salvo || !Array.isArray(salvo.produtos)) return base
  const precisaEnriquecer = (lista: ProdutoMercado[]): boolean => lista.some((p) => !p.grupo || !p.subgrupo)
  if (salvo.versao === VERSAO_CATALOGO) return precisaEnriquecer(salvo.produtos) ? salvo.produtos.map(enriquecerProduto) : salvo.produtos
  const idsLocais = new Set(salvo.produtos.map((p) => p.id))
  const locais = precisaEnriquecer(salvo.produtos) ? salvo.produtos.map(enriquecerProduto) : salvo.produtos
  const baseEnriquecida = precisaEnriquecer(base) ? base.map(enriquecerProduto) : base
  return [...locais, ...baseEnriquecida.filter((p) => !idsLocais.has(p.id))]
}

/** Valida um JSON importado antes de substituir o catálogo. */
export function validarCatalogoImportado(dados: unknown): ProdutoMercado[] {
  if (!Array.isArray(dados) || dados.length === 0) throw new Error('Arquivo sem produtos.')
  const produtos = dados as Partial<ProdutoMercado>[]
  for (const [i, p] of produtos.entries()) {
    if (!p || typeof p.nome !== 'string' || !p.nome.trim()) throw new Error(`Item ${i + 1} sem nome.`)
    if (typeof p.preco !== 'number' || !(p.preco > 0)) throw new Error(`"${p.nome}": preço inválido.`)
    if (p.codigoBarras !== undefined && typeof p.codigoBarras !== 'string') {
      throw new Error(`"${p.nome}": código de barras inválido.`)
    }
  }
  return produtos.map((p, i) => ({
    id: typeof p.id === 'string' && p.id ? p.id : `importado-${i + 1}`,
    nome: (p.nome as string).trim(),
    categoria: typeof p.categoria === 'string' && p.categoria ? p.categoria : 'Geral',
    grupo: typeof p.grupo === 'string' && p.grupo ? p.grupo : undefined,
    subgrupo: typeof p.subgrupo === 'string' && p.subgrupo ? p.subgrupo : undefined,
    unidade: (p.unidade === 'UN' ? 'UN' : 'KG') as ProdutoMercado['unidade'],
    preco: p.preco as number,
    custoMedio: typeof p.custoMedio === 'number' ? p.custoMedio : 0,
    margemAlvo: 0.3,
    fornecedor: typeof p.fornecedor === 'string' ? p.fornecedor : 'A definir',
    ativo: true,
    codigoBarras: p.codigoBarras,
    plu: typeof p.plu === 'string' ? p.plu : undefined,
    estoqueMinimo: 0,
    estoqueAlvo: 0,
    lotes: [] as ProdutoMercado['lotes'],
  })).map(enriquecerProduto)
}
