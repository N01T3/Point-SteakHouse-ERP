import { Injectable } from '@nestjs/common'

// Implementação real chega na Fase 2 (Comanda/PDV): deduplicação por
// idempotencyKey e persistência dos comandos offline enviados pelo cliente.
@Injectable()
export class FilaDeComandosService {}
