import { Inject, Injectable } from '@nestjs/common'
import {
  ITEM_DE_ESTOQUE_REPOSITORY,
  type AlertaDeEstoque,
  type ItemDeEstoqueRepository,
} from '../repositories/item-de-estoque.repository.js'

@Injectable()
export class ListarAlertasDeEstoqueUseCase {
  constructor(
    @Inject(ITEM_DE_ESTOQUE_REPOSITORY) private readonly itemDeEstoqueRepository: ItemDeEstoqueRepository,
  ) {}

  executar(): Promise<AlertaDeEstoque[]> {
    return this.itemDeEstoqueRepository.listarComEstoqueBaixo()
  }
}
