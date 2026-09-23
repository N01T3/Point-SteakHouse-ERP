import type { StatusDeArmazenamento } from '../types'

// Referência: USDA FSIS / FoodSafety.gov "Cold Storage Chart" — carne bovina
// crua mantida refrigerada (≤4°C / 40°F) é considerada segura por 3 a 5 dias.
// Usado aqui para classificar peças reservadas na geladeira do PDV.
export const LIMITE_ATENCAO_DIAS = 3
export const LIMITE_VENCIDO_DIAS = 5

export function calcularDiasArmazenado(reservadoDesde: Date, agora: Date = new Date()): number {
  return (agora.getTime() - reservadoDesde.getTime()) / (1000 * 60 * 60 * 24)
}

export function classificarStatusDeArmazenamento(diasArmazenado: number): StatusDeArmazenamento {
  if (diasArmazenado >= LIMITE_VENCIDO_DIAS) return 'vencido'
  if (diasArmazenado >= LIMITE_ATENCAO_DIAS) return 'atencao'
  return 'fresco'
}

export const NOMES_STATUS_ARMAZENAMENTO: Record<StatusDeArmazenamento, string> = {
  fresco: 'Fresco',
  atencao: 'Atenção',
  vencido: 'Vencido — descartar',
}
