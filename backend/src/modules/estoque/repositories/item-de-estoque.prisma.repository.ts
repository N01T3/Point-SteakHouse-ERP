import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../infra/prisma/prisma.service.js'
import type { AlertaDeEstoque, ItemDeEstoqueRepository } from './item-de-estoque.repository.js'

@Injectable()
export class ItemDeEstoquePrismaRepository implements ItemDeEstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarComEstoqueBaixo(): Promise<AlertaDeEstoque[]> {
    const itens = await this.prisma.itemDeEstoque.findMany()

    // Prisma não permite comparar duas colunas diretamente no `where`, então o
    // filtro acontece em memória — aceitável no volume de um único restaurante.
    return itens
      .filter((item) => item.quantidadeAtual.lessThanOrEqualTo(item.quantidadeMinima))
      .map((item) => ({
        nome: item.nome,
        quantidadeAtual: item.quantidadeAtual.toNumber(),
        quantidadeMinima: item.quantidadeMinima.toNumber(),
        unidade: item.unidade,
      }))
  }
}
