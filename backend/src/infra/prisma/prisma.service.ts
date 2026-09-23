import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { ConfiguracaoService } from '../../config/configuracao.service.js'
import { PrismaClient } from '../../generated/prisma/client.js'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configuracao: ConfiguracaoService) {
    super({ adapter: new PrismaPg({ connectionString: configuracao.urlDoBancoDeDados }) })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
