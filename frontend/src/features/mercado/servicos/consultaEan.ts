// Consulta externa de GTIN — enriquece o cadastro com dados reais.
// - Oficial GS1 (CNP / Verified by GS1): exige associação e login — sem API
//   pública gratuita; por isso o app valida o padrão GS1 localmente e usa
//   o Open Food Facts (base comunitária aberta, sem chave) para buscar nome,
//   marca e categoria de produtos embalados. Carnes de balcão pesadas na loja
//   não têm GTIN — usam PLU interno.
// https://world.openfoodfacts.org/api/v2/product/{ean}.json
export interface DadosEanExterno {
  nome: string
  marca: string
  categoriaSugerida: string
  quantidadeRotulo: string
}

const CATEGORIAS_APP = ['Carnes', 'Frios', 'Mercearia', 'Bebidas', 'Churrasco', 'Limpeza', 'Geral']

function sugerirCategoria(categorias: string): string {
  const texto = categorias.toLowerCase()
  if (/beer|beverage|drink|juice|soda|water|wine|cacha/.test(texto)) return 'Bebidas'
  if (/meat|beef|pork|poultry|sausage|ham|bacon/.test(texto)) return 'Carnes'
  if (/cheese|dairy|yogurt|milk/.test(texto)) return 'Frios'
  if (/charcoal|cleaning|detergent|soap/.test(texto))
    return texto.includes('charcoal') ? 'Churrasco' : 'Limpeza'
  return 'Mercearia'
}

type FetchFn = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

interface RespostaOFF {
  status?: number
  product?: {
    product_name?: string
    product_name_pt?: string
    brands?: string
    categories?: string
    quantity?: string
  }
}

/** Busca nome/marca/categoria pelo EAN. Lança erro amigável se não achar ou sem rede. */
export async function consultarEan(ean: string, fetchFn: FetchFn = fetch): Promise<DadosEanExterno> {
  const codigo = ean.trim()
  if (!/^\d{13}$/.test(codigo)) throw new Error('Informe um EAN-13 com 13 dígitos para buscar.')
  let resposta: { ok: boolean; json: () => Promise<unknown> }
  try {
    resposta = await fetchFn(
      `https://world.openfoodfacts.org/api/v2/product/${codigo}.json?fields=product_name,product_name_pt,brands,categories,quantity`,
    )
  } catch {
    throw new Error('Sem conexão com a base externa — cadastre manualmente.')
  }
  if (!resposta.ok) throw new Error('Base externa indisponível agora — cadastre manualmente.')
  const dados = (await resposta.json()) as RespostaOFF
  if (dados.status !== 1 || !dados.product?.product_name) {
    throw new Error('EAN não encontrado na base aberta — cadastre manualmente.')
  }
  const produto = dados.product
  const nome = produto.product_name_pt || produto.product_name || ''
  if (!nome.trim()) {
    throw new Error('EAN não encontrado na base aberta — cadastre manualmente.')
  }
  return {
    nome: nome.trim(),
    marca: (produto.brands ?? '').split(',')[0]?.trim() || '—',
    categoriaSugerida: sugerirCategoria(produto.categories ?? ''),
    quantidadeRotulo: produto.quantity ?? '',
  }
}

export { CATEGORIAS_APP }
