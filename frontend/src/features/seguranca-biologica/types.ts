export type StatusDeConformidade = 'conforme' | 'atencao' | 'critico'

export interface PontoCriticoDeControle {
  id: string
  nome: string
  responsavel: string
  ultimaVerificacao: Date
  status: StatusDeConformidade
  minutosAcumuladosEmZonaDePerigo: number
}

export interface RegistroDeColeta {
  id: string
  indicador: string
  resultado: string
  limiteDeReferencia: string
  status: StatusDeConformidade
  coletadoEm: Date
}

export interface ProximaColeta {
  id: string
  indicador: string
  previstaPara: Date
}

export interface RegistroDeAuditoria {
  id: string
  descricao: string
  responsavel: string
  registradoEm: Date
}

export type StatusDeArmazenamento = 'fresco' | 'atencao' | 'vencido'

export interface ItemReservadoNaGeladeira {
  id: string
  corteNome: string
  pesoKg: number
  reservadoDesde: Date
}
