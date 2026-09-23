// Dados financeiros de demonstração — 90 dias determinísticos terminando hoje.
// Açougue/mercado: NÃO existe salão, cozinha ou mesa. Receita única do Mercado.
// Visão gerencial simplificada: não substitui contabilidade oficial.
export type Periodo = 'hoje' | '14d' | '90d'
export type Visao = 'competencia' | 'caixa'
export type Granularidade = 'dia' | 'semana' | 'mes'

export interface DiaFinanceiro {
  data: string // ISO yyyy-mm-dd
  receita: number // Mercado (único canal operacional)
  cmv: number
  despesas: number
  fiadoNovo: number
  fiadoRecebido: number
}

const PADRAO_SEMANAL = [8200, 9400, 7600, 11200, 15800, 21300, 18900]

function dataISO(diasAtras: number): string {
  const data = new Date()
  data.setDate(data.getDate() - diasAtras)
  return data.toISOString().slice(0, 10)
}

function gerarDias(quantidade: number): DiaFinanceiro[] {
  const dias: DiaFinanceiro[] = []
  for (let atras = quantidade - 1; atras >= 0; atras--) {
    const indice = quantidade - 1 - atras
    const receita = Math.round(PADRAO_SEMANAL[indice % 7] * (1 + indice * 0.002))
    const fiadoNovo = Math.round(receita * 0.12)
    dias.push({
      data: dataISO(atras),
      receita,
      cmv: Math.round(receita * 0.38),
      despesas: Math.round(receita * 0.22),
      fiadoNovo,
      fiadoRecebido: Math.round(fiadoNovo * 0.9),
    })
  }
  return dias
}

export const DIAS_MOCK: DiaFinanceiro[] = gerarDias(90)

export const SALDO_FIADO_INICIAL = 4350

export interface CustoDetalhado {
  categoria: string
  descricao: string
  valor: number
}

export const CUSTOS_MOCK: CustoDetalhado[] = [
  { categoria: 'Pessoal', descricao: 'Folha açougue + encargos (mês)', valor: 28500 },
  { categoria: 'Pessoal', descricao: 'Diaristas açougue (mês)', valor: 6400 },
  { categoria: 'Energia', descricao: 'Conta de luz · 1.240 kWh', valor: 1180 },
  { categoria: 'Água', descricao: 'Conta de água · 46 m³', valor: 390 },
  { categoria: 'Insumos', descricao: 'Embalagens e limpeza (mês)', valor: 2150 },
  { categoria: 'Taxas', descricao: 'Taxas de cartão/PIX (mês)', valor: 1320 },
]

// --- Desperdícios (aba nova) ---

export type MotivoDesperdicio =
  | 'validade'
  | 'deterioracao'
  | 'quebra_frio'
  | 'producao'
  | 'desossa'
  | 'maturacao'
  | 'devolucao'
  | 'dano'
  | 'outros'

export const ROTULO_MOTIVO_DESPERDICIO: Record<MotivoDesperdicio, string> = {
  validade: 'Validade',
  deterioracao: 'Deterioração',
  quebra_frio: 'Quebra de cadeia fria',
  producao: 'Erro de produção',
  desossa: 'Desossa',
  maturacao: 'Maturação',
  devolucao: 'Devolução',
  dano: 'Dano/avaria',
  outros: 'Outros',
}

export interface Desperdicio {
  id: string
  produto: string
  lote: string
  quantidade: number
  unidade: string
  custoUnitario: number
  valor: number
  motivo: MotivoDesperdicio
  area: string
  data: string
  responsavel: string
}

export const DESPERDICIOS_MOCK: Desperdicio[] = [
  { id: 'd1', produto: 'Linguiça Toscana', lote: 'L2395', quantidade: 2.5, unidade: 'kg', custoUnitario: 18, valor: 45, motivo: 'validade', area: 'Câmara fria 1', data: dataISO(1), responsavel: 'Rita' },
  { id: 'd2', produto: 'Costela', lote: 'L2399', quantidade: 4, unidade: 'kg', custoUnitario: 22, valor: 88, motivo: 'validade', area: 'Câmara fria 1', data: dataISO(2), responsavel: 'Rita' },
  { id: 'd3', produto: 'Fraldinha', lote: 'L2410', quantidade: 1.2, unidade: 'kg', custoUnitario: 30, valor: 36, motivo: 'dano', area: 'Balcão', data: dataISO(3), responsavel: 'Marcos' },
  { id: 'd4', produto: 'Picanha', lote: 'L2408', quantidade: 0.8, unidade: 'kg', custoUnitario: 55, valor: 44, motivo: 'desossa', area: 'Desossa', data: dataISO(5), responsavel: 'Rita' },
]

// --- Lucro por item vendido (aba nova) ---

export interface MargemPorItem {
  produtoId: string
  produto: string
  categoria: string
  quantidade: number
  unidade: string
  receita: number
  custoMedio: number
  cmv: number
  margem: number
  margemPercentual: number | null
  precoMinimo: number
  emRisco: boolean
}

export const MARGEM_POR_ITEM_MOCK: MargemPorItem[] = [
  { produtoId: 'picanha', produto: 'Picanha', categoria: 'Carnes', quantidade: 38.5, unidade: 'kg', receita: 3461.5, custoMedio: 55, cmv: 2117.5, margem: 1344, margemPercentual: 0.388, precoMinimo: 78.57, emRisco: false },
  { produtoId: 'ancho', produto: 'Ancho', categoria: 'Carnes', quantidade: 27.3, unidade: 'kg', receita: 2044.77, custoMedio: 46, cmv: 1255.8, margem: 788.97, margemPercentual: 0.386, precoMinimo: 65.71, emRisco: false },
  { produtoId: 'file-mignon', produto: 'Filé Mignon', categoria: 'Carnes', quantidade: 9.8, unidade: 'kg', receita: 979.02, custoMedio: 72, cmv: 705.6, margem: 273.42, margemPercentual: 0.279, precoMinimo: 102.86, emRisco: true },
  { produtoId: 'fraldinha', produto: 'Fraldinha', categoria: 'Carnes', quantidade: 21.4, unidade: 'kg', receita: 1067.86, custoMedio: 30, cmv: 642, margem: 425.86, margemPercentual: 0.399, precoMinimo: 42.86, emRisco: false },
  { produtoId: 'costela', produto: 'Costela', categoria: 'Carnes', quantidade: 33.1, unidade: 'kg', receita: 1320.69, custoMedio: 22, cmv: 728.2, margem: 592.49, margemPercentual: 0.449, precoMinimo: 31.43, emRisco: false },
  { produtoId: 'carvao', produto: 'Carvão 3kg', categoria: 'Churrasco', quantidade: 42, unidade: 'un', receita: 961.8, custoMedio: 14, cmv: 588, margem: 373.8, margemPercentual: 0.389, precoMinimo: 20, emRisco: false },
]

// --- Contas a pagar e receber (aba nova) ---

export type StatusConta = 'previsto' | 'a_vencer' | 'vencido' | 'pago' | 'cancelado'

export interface Conta {
  id: string
  descricao: string
  categoria: string
  centroCusto: string
  valor: number
  vencimento: string
  status: StatusConta
  tipo: 'pagar' | 'receber'
}

export const CONTAS_MOCK: Conta[] = [
  { id: 'c1', descricao: 'Energia · competência atual', categoria: 'Energia', centroCusto: 'Equipamentos/câmaras', valor: 1180, vencimento: dataISO(-2), status: 'a_vencer', tipo: 'pagar' },
  { id: 'c2', descricao: 'Fornecedor carne · lote semanal', categoria: 'Compras de carne', centroCusto: 'Compra de carnes', valor: 18400, vencimento: dataISO(-5), status: 'a_vencer', tipo: 'pagar' },
  { id: 'c3', descricao: 'Aluguel do ponto', categoria: 'Aluguel', centroCusto: 'Administração', valor: 6500, vencimento: dataISO(4), status: 'pago', tipo: 'pagar' },
  { id: 'c4', descricao: 'Fiado Ana Ferreira · parcela', categoria: 'Fiado', centroCusto: 'Administração', valor: 320.5, vencimento: dataISO(-9), status: 'vencido', tipo: 'receber' },
  { id: 'c5', descricao: 'Água · 46 m³', categoria: 'Água', centroCusto: 'Energia/água', valor: 390, vencimento: dataISO(1), status: 'pago', tipo: 'pagar' },
]

// --- Fiado aging (aba fiado) ---

export interface FaixaAging {
  faixa: string
  valor: number
  clientes: number
}

export const FIADO_AGING_MOCK: FaixaAging[] = [
  { faixa: 'A vencer', valor: 1980, clientes: 6 },
  { faixa: '1–7 dias', valor: 940, clientes: 4 },
  { faixa: '8–30 dias', valor: 890, clientes: 3 },
  { faixa: '31–60 dias', valor: 320.5, clientes: 1 },
  { faixa: 'Acima de 60 dias', valor: 219.5, clientes: 1 },
]

export const CENTROS_DE_CUSTO_ACOUGUE = [
  'Compra de carnes',
  'Desossa',
  'Maturação',
  'Embalagem',
  'Equipamentos/câmaras',
  'Energia/água',
  'Pessoal',
  'Transporte',
  'Perdas',
  'Administração',
]
