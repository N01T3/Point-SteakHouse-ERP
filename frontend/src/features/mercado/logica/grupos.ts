// Hierarquia comercial grupo > subgrupo — pura e testável.
// Grupo preserva o histórico: o item vendido carrega snapshot; o resolver
// serve para produtos antigos e para o catálogo ainda sem grupo preenchido.
import type { ProdutoMercado } from '../tipos'

export interface GrupoComercial {
  grupo: string
  subgrupo: string
}

export const GRUPOS_COMERCIAIS: Array<{ grupo: string; subgrupos: string[] }> = [
  { grupo: 'Carnes', subgrupos: ['Cortes bovinos', 'Cortes suínos', 'Embutidos', 'Maturados', 'Aves'] },
  { grupo: 'Mercearia', subgrupos: ['Grãos', 'Básicos', 'Café e açúcar'] },
  { grupo: 'Bebidas', subgrupos: ['Refrigerantes', 'Cervejas'] },
  { grupo: 'Churrasco', subgrupos: ['Carvão e acendimento', 'Temperos e sal'] },
  { grupo: 'Frios', subgrupos: ['Queijos e frios'] },
  { grupo: 'Limpeza', subgrupos: ['Geral'] },
  { grupo: 'Geral', subgrupos: ['Geral'] },
]

const SUBGRUPO_POR_PRODUTO: Record<string, string> = {
  picanha: 'Cortes bovinos',
  ancho: 'Cortes bovinos',
  'file-mignon': 'Cortes bovinos',
  fraldinha: 'Cortes bovinos',
  costela: 'Cortes bovinos',
  maminha: 'Cortes bovinos',
  alcatra: 'Cortes bovinos',
  'contra-file': 'Cortes bovinos',
  linguica: 'Embutidos',
  'costelinha-suina': 'Cortes suínos',
  mussarela: 'Queijos e frios',
  arroz: 'Grãos',
  feijao: 'Grãos',
  cafe: 'Café e açúcar',
  acucar: 'Café e açúcar',
  'oleo-soja': 'Básicos',
  refrigerante: 'Refrigerantes',
  'cerveja-lata': 'Cervejas',
  carvao: 'Carvão e acendimento',
  'sal-grosso': 'Temperos e sal',
}

const GRUPO_POR_CATEGORIA: Record<string, string> = {
  Carnes: 'Carnes',
  Frios: 'Frios',
  Mercearia: 'Mercearia',
  Bebidas: 'Bebidas',
  Churrasco: 'Churrasco',
  Limpeza: 'Limpeza',
}

function normalizar(valor: string | undefined): string {
  return (valor ?? '').trim()
}

/** Resolve grupo/subgrupo com fallback determinístico para dados antigos. */
export function resolverGrupo(
  produto: Pick<ProdutoMercado, 'id' | 'nome' | 'categoria' | 'grupo' | 'subgrupo'>,
): GrupoComercial {
  const grupoExplicito = normalizar(produto.grupo)
  const subExplicito = normalizar(produto.subgrupo)
  if (grupoExplicito) {
    const def = GRUPOS_COMERCIAIS.find((g) => g.grupo === grupoExplicito)
    const subgrupo = subExplicito || def?.subgrupos[0] || 'Geral'
    return { grupo: grupoExplicito, subgrupo }
  }
  const grupo = GRUPO_POR_CATEGORIA[produto.categoria] ?? (produto.categoria?.trim() || 'Geral')
  const porId = SUBGRUPO_POR_PRODUTO[produto.id]
  if (porId) return { grupo, subgrupo: porId }
  const nome = produto.nome.toLowerCase()
  if (grupo === 'Carnes') {
    if (nome.includes('suín') || nome.includes('suin') || nome.includes('porco'))
      return { grupo, subgrupo: 'Cortes suínos' }
    if (nome.includes('lingui') || nome.includes('salsich') || nome.includes('toscana'))
      return { grupo, subgrupo: 'Embutidos' }
    if (nome.includes('maturad') || nome.includes('dry') || nome.includes('wet'))
      return { grupo, subgrupo: 'Maturados' }
    if (nome.includes('frango') || nome.includes('ave')) return { grupo, subgrupo: 'Aves' }
    return { grupo, subgrupo: 'Cortes bovinos' }
  }
  const def = GRUPOS_COMERCIAIS.find((g) => g.grupo === grupo)
  return { grupo, subgrupo: def?.subgrupos[0] ?? 'Geral' }
}

/** Garante grupo/subgrupo em listas antigas (catálogo local, importação). */
export function enriquecerProduto<
  T extends Pick<ProdutoMercado, 'id' | 'nome' | 'categoria' | 'grupo' | 'subgrupo'>,
>(produto: T): T {
  const resolvido = resolverGrupo(
    produto as Pick<ProdutoMercado, 'id' | 'nome' | 'categoria' | 'grupo' | 'subgrupo'>,
  )
  if (produto.grupo && produto.subgrupo) return produto
  return {
    ...produto,
    grupo: produto.grupo || resolvido.grupo,
    subgrupo: produto.subgrupo || resolvido.subgrupo,
  }
}
