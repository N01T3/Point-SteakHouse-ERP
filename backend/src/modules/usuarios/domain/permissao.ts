import { PapelUsuario } from './usuario.entity.js'

export type Permissao =
  | 'financeiro.visualizar'
  | 'financeiro.lancar'
  | 'financeiro.pagar'
  | 'financeiro.exportar'
  | 'financeiro.ver_margem'
  | 'estoque.visualizar'
  | 'estoque.ajustar'
  | 'estoque.repor'
  | 'estoque.descartar'
  | 'mercado.vender'
  | 'mercado.ver_gestao'
  | 'mercado.alterar_preco'
  | 'mercado.aplicar_desconto'
  | 'caixa.abrir_turno'
  | 'caixa.fechar_turno'
  | 'caixa.sangria'
  | 'caixa.estornar'
  | 'carne.visualizar'
  | 'carne.confirmar_recebimento'
  | 'carne.confirmar_desossa'
  | 'carne.confirmar_maturacao'
  | 'clientes.marcar_fiado'
  | 'clientes.quitar_fiado'
  | 'usuarios.gerenciar'
  | 'cargos.solicitar'
  | 'cargos.gerenciar'
  | 'auditoria.visualizar'
  | 'auditoria.total'

const TODAS_AS_PERMISSOES: Permissao[] = [
  'financeiro.visualizar',
  'financeiro.lancar',
  'financeiro.pagar',
  'financeiro.exportar',
  'financeiro.ver_margem',
  'estoque.visualizar',
  'estoque.ajustar',
  'estoque.repor',
  'estoque.descartar',
  'mercado.vender',
  'mercado.ver_gestao',
  'mercado.alterar_preco',
  'mercado.aplicar_desconto',
  'caixa.abrir_turno',
  'caixa.fechar_turno',
  'caixa.sangria',
  'caixa.estornar',
  'carne.visualizar',
  'carne.confirmar_recebimento',
  'carne.confirmar_desossa',
  'carne.confirmar_maturacao',
  'clientes.marcar_fiado',
  'clientes.quitar_fiado',
  'usuarios.gerenciar',
  'cargos.solicitar',
  'cargos.gerenciar',
  'auditoria.visualizar',
  'auditoria.total',
]

// Conjunto padrão por papel, refletindo a "Matriz inicial" do documento de
// cargos e permissões. A criação de cargos personalizados (solicitação do
// Administrador + aprovação do Proprietário) é um fluxo futuro — por ora,
// todo usuário recebe o conjunto padrão do seu papel.
export const PERMISSOES_POR_PAPEL: Record<PapelUsuario, Permissao[]> = {
  [PapelUsuario.PROPRIETARIO]: TODAS_AS_PERMISSOES,
  [PapelUsuario.ADMINISTRADOR]: [
    'financeiro.visualizar',
    'financeiro.lancar',
    'financeiro.pagar',
    'financeiro.exportar',
    'estoque.visualizar',
    'estoque.ajustar',
    'estoque.repor',
    'estoque.descartar',
    'mercado.ver_gestao',
    'clientes.quitar_fiado',
    'auditoria.visualizar',
  ],
  [PapelUsuario.ACOUGUEIRO]: [
    'carne.visualizar',
    'carne.confirmar_recebimento',
    'carne.confirmar_desossa',
    'carne.confirmar_maturacao',
    'estoque.visualizar',
    'auditoria.visualizar',
  ],
  [PapelUsuario.CAIXA]: [
    'mercado.vender',
    'caixa.abrir_turno',
    'caixa.fechar_turno',
    'caixa.sangria',
    'clientes.marcar_fiado',
    'auditoria.visualizar',
  ],
}

export function obterPermissoesDoPapel(papel: PapelUsuario): Permissao[] {
  return PERMISSOES_POR_PAPEL[papel]
}
