import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../infra/prisma/prisma.service.js'
import type {
  CorteMaisVendido,
  DistribuicaoPorCanal,
  FaturamentoDoDia,
  PedidoRepository,
} from './pedido.repository.js'

function inicioDoDiaDeHoje(): Date {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  return data
}

function inicioDosUltimos7Dias(): Date {
  const data = inicioDoDiaDeHoje()
  data.setDate(data.getDate() - 6)
  return data
}

function chaveDoDia(data: Date): string {
  return data.toISOString().slice(0, 10)
}

@Injectable()
export class PedidoPrismaRepository implements PedidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obterFaturamentoDeHoje(): Promise<number> {
    const resultado = await this.prisma.pedido.aggregate({
      _sum: { valorTotal: true },
      where: { criadoEm: { gte: inicioDoDiaDeHoje() } },
    })
    return resultado._sum.valorTotal?.toNumber() ?? 0
  }

  async calcularTicketMedioDeHoje(): Promise<number> {
    const resultado = await this.prisma.pedido.aggregate({
      _sum: { valorTotal: true },
      _count: { _all: true },
      where: { criadoEm: { gte: inicioDoDiaDeHoje() } },
    })
    const total = resultado._sum.valorTotal?.toNumber() ?? 0
    const quantidade = resultado._count._all
    return quantidade > 0 ? total / quantidade : 0
  }

  async obterFaturamentoDosUltimos7Dias(): Promise<FaturamentoDoDia[]> {
    const inicio = inicioDosUltimos7Dias()
    const pedidos = await this.prisma.pedido.findMany({
      where: { criadoEm: { gte: inicio } },
      select: { criadoEm: true, valorTotal: true },
    })

    const totalPorDia = new Map<string, number>()
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio)
      dia.setDate(dia.getDate() + i)
      totalPorDia.set(chaveDoDia(dia), 0)
    }
    for (const pedido of pedidos) {
      const chave = chaveDoDia(pedido.criadoEm)
      totalPorDia.set(chave, (totalPorDia.get(chave) ?? 0) + pedido.valorTotal.toNumber())
    }

    return [...totalPorDia.entries()].map(([chave, valor]) => ({ data: new Date(chave), valor }))
  }

  async obterDistribuicaoPorCanalUltimos7Dias(): Promise<DistribuicaoPorCanal> {
    const grupos = await this.prisma.pedido.groupBy({
      by: ['canal'],
      where: { criadoEm: { gte: inicioDosUltimos7Dias() } },
      _sum: { valorTotal: true },
    })

    const totalSalao = grupos.find((g) => g.canal === 'SALAO')?._sum.valorTotal?.toNumber() ?? 0
    const totalMercado = grupos.find((g) => g.canal === 'MERCADO')?._sum.valorTotal?.toNumber() ?? 0
    const total = totalSalao + totalMercado

    if (total === 0) return { salao: 0, mercado: 0 }
    return {
      salao: Math.round((totalSalao / total) * 100),
      mercado: Math.round((totalMercado / total) * 100),
    }
  }

  async obterTopCortesVendidosDaSemana(limite: number): Promise<CorteMaisVendido[]> {
    const itens = await this.prisma.itemDePedido.findMany({
      where: { pedido: { criadoEm: { gte: inicioDosUltimos7Dias() } } },
      include: { corte: true },
    })

    const porCorte = new Map<string, { kg: number; receita: number }>()
    for (const item of itens) {
      const atual = porCorte.get(item.corte.nome) ?? { kg: 0, receita: 0 }
      atual.kg += item.pesoKg.toNumber()
      atual.receita += item.valorTotal.toNumber()
      porCorte.set(item.corte.nome, atual)
    }

    return [...porCorte.entries()]
      .map(([corteNome, valores]) => ({ corteNome, kg: valores.kg, receita: valores.receita }))
      .sort((a, b) => b.kg - a.kg)
      .slice(0, limite)
  }
}
