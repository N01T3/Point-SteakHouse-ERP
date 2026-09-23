// Checklist sanitário + temperaturas + ações corretivas — operação real auditável.
export type TurnoChecklist = 'abertura' | 'manipulacao' | 'fechamento'

export interface ItemChecklist {
  id: string
  rotulo: string
  ok: boolean
}

export interface ChecklistSanitario {
  id: string
  turno: TurnoChecklist
  itens: ItemChecklist[]
  responsavel: string
  observacao?: string
  criadoEm: string
}

export interface RegistroTemperatura {
  id: string
  local: string
  temperatura: number
  umidade?: number
  responsavel: string
  criadoEm: string
}

export interface AcaoCorretiva {
  id: string
  descricao: string
  lote?: string
  responsavel: string
  status: 'aberta' | 'concluida'
  criadaEm: string
}

export const MODELOS_CHECKLIST: Record<TurnoChecklist, string[]> = {
  abertura: [
    'Câmaras 0–4°C conferidas',
    'Balcão higienizado',
    'Utensílios sanitizados',
    'Lotes/validade conferidos',
  ],
  manipulacao: ['Mãos/luvas conforme', 'Tábuas por cor', 'Temperatura de exposição OK', 'Etiquetas legíveis'],
  fechamento: ['Sobras etiquetadas', 'Câmaras fechadas', 'Piso/balcão higienizados', 'Lixo descartado'],
}

export function criarChecklist(
  turno: TurnoChecklist,
  responsavel: string,
  estados: boolean[],
  observacao?: string,
): ChecklistSanitario {
  const modelo = MODELOS_CHECKLIST[turno]
  if (!responsavel.trim()) throw new Error('Responsável é obrigatório.')
  if (estados.length !== modelo.length) throw new Error('Marque todos os itens do checklist.')
  return {
    id: `chk-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`,
    turno,
    itens: modelo.map((rotulo, i) => ({ id: `i-${i}`, rotulo, ok: estados[i] })),
    responsavel: responsavel.trim(),
    observacao: observacao?.trim() || undefined,
    criadoEm: new Date().toISOString(),
  }
}

export function validarTemperatura(local: string, temperatura: number, responsavel: string): string | null {
  if (!local.trim()) return 'Local é obrigatório.'
  if (!Number.isFinite(temperatura) || temperatura < -30 || temperatura > 30)
    return 'Temperatura fora da faixa (-30 a 30°C).'
  if (!responsavel.trim()) return 'Responsável é obrigatório.'
  return null
}
