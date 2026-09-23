import type { UsuarioGerenciado } from '../tipos'

export const USUARIOS_GERENCIADOS_MOCK: UsuarioGerenciado[] = [
  { id: 'usuario-dono', nome: 'Dono', identificador: 'dono', papel: 'PROPRIETARIO', ativo: true },
  { id: 'usuario-admin', nome: 'Marcos Gerente', identificador: 'administrador', papel: 'ADMINISTRADOR', ativo: true },
  { id: 'usuario-acougue', nome: 'Rita Açougueira', identificador: 'acougueiro', papel: 'ACOUGUEIRO', ativo: true },
  { id: 'usuario-caixa', nome: 'Paulo Caixa', identificador: 'caixa', papel: 'CAIXA', ativo: true },
]
