import { Injectable } from '@nestjs/common'

// Implementação real chega na Fase 2: last-write-wins por timestamp do
// dispositivo, com log de auditoria para conflitos resolvidos automaticamente.
@Injectable()
export class ResolucaoDeConflitoService {}
