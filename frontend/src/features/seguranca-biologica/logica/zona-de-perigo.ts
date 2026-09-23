const LIMIAR_DE_ALERTA = 0.8 // dispara alerta a partir de 80% do limite acumulado

export function percentualDoLimite(minutosAcumulados: number, limiteMinutos: number): number {
  if (limiteMinutos <= 0) return 0
  return Math.min(1, minutosAcumulados / limiteMinutos)
}

export function ultrapassouOLimite(minutosAcumulados: number, limiteMinutos: number): boolean {
  return minutosAcumulados >= limiteMinutos
}

export function proximoDoLimite(minutosAcumulados: number, limiteMinutos: number): boolean {
  const percentual = percentualDoLimite(minutosAcumulados, limiteMinutos)
  return percentual >= LIMIAR_DE_ALERTA && !ultrapassouOLimite(minutosAcumulados, limiteMinutos)
}
