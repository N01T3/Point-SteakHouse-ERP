// Papéis, permissões e navegação por cargo — espelha o documento
// `cargos-e-permissoes-point-steakhouse.md`. Tudo aqui é usado em modo
// demonstração (mocks); quando o backend existir, permissões e rota
// inicial devem vir da resposta do login, nunca ser decididas no cliente.
export type PapelUsuario = 'PROPRIETARIO' | 'ADMINISTRADOR' | 'ACOUGUEIRO' | 'CAIXA'

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

export const PERMISSOES_POR_PAPEL: Record<PapelUsuario, Permissao[]> = {
  PROPRIETARIO: [
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
  ],
  ADMINISTRADOR: [
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
    'cargos.solicitar',
    'auditoria.visualizar',
  ],
  ACOUGUEIRO: [
    'carne.visualizar',
    'carne.confirmar_recebimento',
    'carne.confirmar_desossa',
    'carne.confirmar_maturacao',
    'estoque.visualizar',
    'auditoria.visualizar',
  ],
  CAIXA: [
    'mercado.vender',
    'caixa.abrir_turno',
    'caixa.fechar_turno',
    'caixa.sangria',
    'clientes.marcar_fiado',
    'auditoria.visualizar',
  ],
}

export const ROTA_INICIAL_POR_PAPEL: Record<PapelUsuario, string> = {
  PROPRIETARIO: '/dashboard',
  ADMINISTRADOR: '/administrador',
  ACOUGUEIRO: '/acougueiro',
  CAIXA: '/mercado',
}

export const ROTULO_DO_PAPEL: Record<PapelUsuario, string> = {
  PROPRIETARIO: 'Proprietário',
  ADMINISTRADOR: 'Administrador',
  ACOUGUEIRO: 'Açougueiro',
  CAIXA: 'Caixa',
}

export type SecaoDeMenu = 'operacao' | 'gestao' | 'administracao'

export interface ItemDeMenu {
  rota: string
  titulo: string
  secao: SecaoDeMenu
  papeisPermitidos: PapelUsuario[]
}

export const ITENS_DE_MENU: ItemDeMenu[] = [
  {
    rota: 'dashboard',
    titulo: 'Dashboard',
    secao: 'gestao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'],
  },
  {
    rota: 'mercado',
    titulo: 'Mercado',
    secao: 'operacao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'CAIXA'],
  },
  {
    rota: 'acougueiro',
    titulo: 'Açougue',
    secao: 'operacao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'],
  },
  {
    rota: 'maturacao',
    titulo: 'Câmara de Maturação',
    secao: 'operacao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'],
  },
  {
    rota: 'seguranca-biologica',
    titulo: 'Segurança Biológica',
    secao: 'operacao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'],
  },
  {
    rota: 'desossa-subprodutos',
    titulo: 'Desossa & Subprodutos',
    secao: 'operacao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'],
  },
  {
    rota: 'clientes',
    titulo: 'Clientes',
    secao: 'gestao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'],
  },
  {
    rota: 'estoque',
    titulo: 'Estoque',
    secao: 'gestao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'],
  },
  {
    rota: 'financeiro',
    titulo: 'Finanças',
    secao: 'gestao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'],
  },
  {
    rota: 'administrador',
    titulo: 'Administração',
    secao: 'administracao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'],
  },
  {
    rota: 'acesso',
    titulo: 'Acesso e Auditoria',
    secao: 'administracao',
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'],
  },
  {
    rota: 'configuracoes',
    titulo: 'Configurações',
    secao: 'administracao',
    papeisPermitidos: ['PROPRIETARIO'],
  },
]

export function filtrarMenuPorPapel(papel: PapelUsuario): ItemDeMenu[] {
  return ITENS_DE_MENU.filter((item) => item.papeisPermitidos.includes(papel))
}

export function podeAcessarRota(papel: PapelUsuario | null, papeisPermitidos?: PapelUsuario[]): boolean {
  if (!papeisPermitidos || papeisPermitidos.length === 0) return true
  if (!papel) return false
  return papeisPermitidos.includes(papel)
}
