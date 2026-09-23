export enum PapelUsuario {
  PROPRIETARIO = 'PROPRIETARIO',
  ADMINISTRADOR = 'ADMINISTRADOR',
  ACOUGUEIRO = 'ACOUGUEIRO',
  CAIXA = 'CAIXA',
}

export interface PropriedadesUsuario {
  id: string
  nome: string
  email: string
  senhaHash: string
  papel: PapelUsuario
  refreshTokenHash: string | null
}

export class Usuario {
  readonly id: string
  readonly nome: string
  readonly email: string
  readonly senhaHash: string
  readonly papel: PapelUsuario
  readonly refreshTokenHash: string | null

  constructor(propriedades: PropriedadesUsuario) {
    this.id = propriedades.id
    this.nome = propriedades.nome
    this.email = propriedades.email
    this.senhaHash = propriedades.senhaHash
    this.papel = propriedades.papel
    this.refreshTokenHash = propriedades.refreshTokenHash
  }
}
