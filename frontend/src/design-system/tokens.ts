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
  warning: string
  warningContainer: string
  onWarningContainer: string
  tertiary: string
  onTertiary: string
  tertiaryContainer: string
  onTertiaryContainer: string
}

export const tokensEscuro: TokensDeCor = {
  bg: '#0B0B0D',
  surface: '#151518',
  surfaceVariant: '#232329',
  onBg: '#F5F2EC',
  onSurface: '#F5F2EC',
  onSurfaceVariant: '#B9B2A8',
  outline: '#2F2F37',
  primary: '#D7263D',
  onPrimary: '#FFFFFF',
  primaryContainer: '#5C1216',
  onPrimaryContainer: '#FFDAD9',
  secondary: '#E0BE74',
  onSecondary: '#3A2C07',
  success: '#93D194',
  error: '#FFB4AB',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD4',
  warning: '#E8B84B',
  warningContainer: '#4A3500',
  onWarningContainer: '#FFE1A8',
  tertiary: '#93D194',
  onTertiary: '#0C390F',
  tertiaryContainer: '#1E5222',
  onTertiaryContainer: '#C2EFC0',
}

export const tokensClaro: TokensDeCor = {
  bg: '#F6F4F1',
  surface: '#FFFFFF',
  surfaceVariant: '#ECE9E3',
  onBg: '#161216',
  onSurface: '#161216',
  onSurfaceVariant: '#5D5751',
  outline: '#DBD6CE',
  primary: '#A31621',
  onPrimary: '#FFFFFF',
  primaryContainer: '#F8D2D4',
  onPrimaryContainer: '#4A0A10',
  secondary: '#8C6D2F',
  onSecondary: '#FFFFFF',
  success: '#2F6B33',
  error: '#BA1A1A',
  errorContainer: '#FFDAD4',
  onErrorContainer: '#410002',
  warning: '#7A4E00',
  warningContainer: '#FFE1A8',
  onWarningContainer: '#2E1D00',
  tertiary: '#2F6B33',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#C2EFC0',
  onTertiaryContainer: '#062B0A',
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
  warning: '--cor-warning',
  warningContainer: '--cor-warning-container',
  onWarningContainer: '--cor-on-warning-container',
  tertiary: '--cor-tertiary',
  onTertiary: '--cor-on-tertiary',
  tertiaryContainer: '--cor-tertiary-container',
  onTertiaryContainer: '--cor-on-tertiary-container',
}
