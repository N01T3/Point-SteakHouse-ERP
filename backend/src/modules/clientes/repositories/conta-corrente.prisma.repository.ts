import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../infra/prisma/prisma.service.js'
import type { ContaCorrenteRepository, ResumoDeSaldoEmAberto } from './conta-corrente.repository.js'

@Injectable()
export class ContaCorrentePrismaRepository implements ContaCorrenteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obterResumoDeSaldoEmAberto(): Promise<ResumoDeSaldoEmAberto> {
    const contas = await this.prisma.contaCorrente.findMany({
      where: { saldoDevedor: { gt: 0 } },
      select: { saldoDevedor: true },
    })

    return {
      saldoTotal: contas.reduce((soma, conta) => soma + conta.saldoDevedor.toNumber(), 0),
      clientesComSaldoAberto: contas.length,
    }
  }
}
