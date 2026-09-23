import type { PapelUsuario } from '../../../shared/tipos/papel'

export interface UsuarioAdmin {
  id: string
  nome: string
  identificador: string
  papel: PapelUsuario
}

export const USUARIOS_MOCK: UsuarioAdmin[] = [
  { id: '1', nome: 'Dono', identificador: 'dono', papel: 'PROPRIETARIO' },
  { id: '2', nome: 'Marcos Gerente', identificador: 'administrador', papel: 'ADMINISTRADOR' },
  { id: '3', nome: 'Rita Açougueira', identificador: 'acougueiro', papel: 'ACOUGUEIRO' },
  { id: '4', nome: 'Paulo Caixa', identificador: 'caixa', papel: 'CAIXA' },
]
