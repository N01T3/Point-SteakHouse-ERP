import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../infra/prisma/prisma.service.js'
import type { PecaEmMaturacaoRepository, PecaEmMaturacaoResumo } from './peca-em-maturacao.repository.js'

@Injectable()
export class PecaEmMaturacaoPrismaRepository implements PecaEmMaturacaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarAtivas(): Promise<PecaEmMaturacaoResumo[]> {
    const pecas = await this.prisma.pecaEmMaturacao.findMany({ orderBy: { diasAtual: 'desc' } })
    return pecas.map((peca) => ({
      nome: peca.nome,
      tipo: peca.tipo,
      diasAtual: peca.diasAtual,
      diasTotal: peca.diasTotal,
    }))
  }
}
