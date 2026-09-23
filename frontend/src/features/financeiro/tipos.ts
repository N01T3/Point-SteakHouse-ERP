// Tipos operacionais do Financeiro — fonte única da gestão.
// Receita/CMV reais vêm do Mercado; aqui vivem custos, contas e desperdícios.
import type { Conta, Desperdicio } from './mock/financeiro.mock'

export interface CustoFixo {
  id: string
  descricao: string
  categoria: string
  centroCusto: string
  valorMensal: number
  ativo: boolean
  criadoEm: string
  criadoPor: string
}

export interface DadosCustoFixo {
  descricao: string
  categoria: string
  centroCusto: string
  valorMensal: number
}

export interface DreReal {
  receita: number
  cmv: number
  lucroBruto: number
  custosFixos: number
  contasPagas: number
  desperdicio: number
  lucroLiquido: number
  margemLiquida: number | null
}

export function validarCustoFixo(dados: DadosCustoFixo): string | null {
  if (!dados.descricao.trim()) return 'Descrição é obrigatória.'
  if (!dados.categoria.trim()) return 'Categoria é obrigatória.'
  if (!(dados.valorMensal > 0)) return 'Valor mensal deve ser maior que zero.'
  return null
}

export function montarDreReal(args: {
  receita: number
  cmv: number
  custosFixos: number
  contasPagas: number
  desperdicio: number
}): DreReal {
  const lucroBruto = args.receita - args.cmv
  const lucroLiquido = lucroBruto - args.custosFixos - args.contasPagas - args.desperdicio
  return {
    receita: args.receita,
    cmv: args.cmv,
    lucroBruto,
    custosFixos: args.custosFixos,
    contasPagas: args.contasPagas,
    desperdicio: args.desperdicio,
    lucroLiquido,
    margemLiquida: args.receita > 0 ? lucroLiquido / args.receita : null,
  }
}

export type { Conta, Desperdicio }
