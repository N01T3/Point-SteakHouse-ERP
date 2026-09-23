import { PapelUsuario } from './usuario.entity.js'

export const ROTA_INICIAL_POR_PAPEL: Record<PapelUsuario, string> = {
  [PapelUsuario.PROPRIETARIO]: '/dashboard',
  [PapelUsuario.ADMINISTRADOR]: '/administrador',
  [PapelUsuario.ACOUGUEIRO]: '/acougueiro',
  [PapelUsuario.CAIXA]: '/mercado',
}

export function obterRotaInicial(papel: PapelUsuario): string {
  return ROTA_INICIAL_POR_PAPEL[papel]
}
