export interface TokensDeCor {
  bg: string
  surface: string
  surfaceVariant: string
  onBg: string
  onSurface: string
  onSurfaceVariant: string
  outline: string
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  secondary: string
  onSecondary: string
  success: string
  error: string
  errorContainer: string
  onErrorContainer: string
}

export const tokensEscuro: TokensDeCor = {
  bg: '#110D0C',
  surface: '#1B1614',
  surfaceVariant: '#271F1B',
  onBg: '#F3ECE6',
  onSurface: '#F3ECE6',
  onSurfaceVariant: '#BAA99E',
  outline: '#3B2F29',
  primary: '#E4685B',
  onPrimary: '#2C0806',
  primaryContainer: '#5B221B',
  onPrimaryContainer: '#F7D1C8',
  secondary: '#C89A52',
  onSecondary: '#241804',
  success: '#7FC28C',
  error: '#E7A644',
  errorContainer: '#3A2A12',
  onErrorContainer: '#F5D9A0',
}

export const tokensClaro: TokensDeCor = {
  bg: '#FBF4EE',
  surface: '#FFFFFF',
  surfaceVariant: '#F1E2D5',
  onBg: '#241510',
  onSurface: '#241510',
  onSurfaceVariant: '#6C5346',
  outline: '#E4D2C0',
  primary: '#9B2A22',
  onPrimary: '#FFFFFF',
  primaryContainer: '#F7DAD5',
  onPrimaryContainer: '#5A150F',
  secondary: '#8A5F14',
  onSecondary: '#FFFFFF',
  success: '#2E7D46',
  error: '#9C6B12',
  errorContainer: '#FBEBD1',
  onErrorContainer: '#5A3B08',
}

export const NOME_VARIAVEL_CSS: Record<keyof TokensDeCor, string> = {
  bg: '--cor-bg',
  surface: '--cor-surface',
  surfaceVariant: '--cor-surface-variant',
  onBg: '--cor-on-bg',
  onSurface: '--cor-on-surface',
  onSurfaceVariant: '--cor-on-surface-variant',
  outline: '--cor-outline',
  primary: '--cor-primary',
  onPrimary: '--cor-on-primary',
  primaryContainer: '--cor-primary-container',
  onPrimaryContainer: '--cor-on-primary-container',
  secondary: '--cor-secondary',
  onSecondary: '--cor-on-secondary',
  success: '--cor-success',
  error: '--cor-error',
  errorContainer: '--cor-error-container',
  onErrorContainer: '--cor-on-error-container',
}
