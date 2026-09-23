import type {
  ItemReservadoNaGeladeira,
  PontoCriticoDeControle,
  ProximaColeta,
  RegistroDeAuditoria,
  RegistroDeColeta,
} from '../types'

function horasAtras(horas: number): Date {
  const data = new Date()
  data.setHours(data.getHours() - horas)
  return data
}

function diasAtras(dias: number): Date {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return data
}

function diasAFrente(dias: number): Date {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return data
}

export function criarItensNaGeladeiraMock(): ItemReservadoNaGeladeira[] {
  return [
    { id: 'geladeira-1', corteNome: 'Picanha Maturada 28d', pesoKg: 4.2, reservadoDesde: diasAtras(1) },
    { id: 'geladeira-2', corteNome: 'Ancho', pesoKg: 3.1, reservadoDesde: diasAtras(3.5) },
    { id: 'geladeira-3', corteNome: 'Fraldinha', pesoKg: 2.6, reservadoDesde: diasAtras(6) },
  ]
}

export function criarCcpsMock(): PontoCriticoDeControle[] {
  return [
    {
      id: 'ccp-recebimento',
      nome: 'Recebimento de matéria-prima',
      responsavel: 'Rita Açougueira',
      ultimaVerificacao: horasAtras(2),
      status: 'conforme',
      minutosAcumuladosEmZonaDePerigo: 15,
    },
    {
      id: 'ccp-camaras-frias',
      nome: 'Câmaras frias',
      responsavel: 'Marcos Caixa',
      ultimaVerificacao: horasAtras(1),
      status: 'conforme',
      minutosAcumuladosEmZonaDePerigo: 0,
    },
    {
      id: 'ccp-maturacao',
      nome: 'Câmara de maturação',
      responsavel: 'Rita Açougueira',
      ultimaVerificacao: horasAtras(4),
      status: 'atencao',
      minutosAcumuladosEmZonaDePerigo: 200,
    },
    {
      id: 'ccp-higienizacao',
      nome: 'Higienização',
      responsavel: 'Marcos Caixa',
      ultimaVerificacao: horasAtras(6),
      status: 'conforme',
      minutosAcumuladosEmZonaDePerigo: 0,
    },
    {
      id: 'ccp-coleta',
      nome: 'Coleta de amostras',
      responsavel: 'Dono',
      ultimaVerificacao: horasAtras(30),
      status: 'critico',
      minutosAcumuladosEmZonaDePerigo: 260,
    },
  ]
}

export function criarColetasMock(): RegistroDeColeta[] {
  return [
    {
      id: 'coleta-1',
      indicador: 'Mesófilos aeróbios',
      resultado: '1,2 × 10³ UFC/g',
      limiteDeReferencia: '≤ 5 × 10⁵ UFC/g',
      status: 'conforme',
      coletadoEm: horasAtras(72),
    },
    {
      id: 'coleta-2',
      indicador: 'Coliformes totais',
      resultado: '< 10 UFC/g',
      limiteDeReferencia: '≤ 10² UFC/g',
      status: 'conforme',
      coletadoEm: horasAtras(72),
    },
    {
      id: 'coleta-3',
      indicador: 'Salmonella spp',
      resultado: 'Ausente/25g',
      limiteDeReferencia: 'Ausente/25g',
      status: 'conforme',
      coletadoEm: horasAtras(72),
    },
    {
      id: 'coleta-4',
      indicador: 'Listeria monocytogenes',
      resultado: 'Presente/25g',
      limiteDeReferencia: 'Ausente/25g',
      status: 'critico',
      coletadoEm: horasAtras(48),
    },
  ]
}

export function criarProximasColetasMock(): ProximaColeta[] {
  return [
    { id: 'proxima-1', indicador: 'Mesófilos aeróbios', previstaPara: diasAFrente(2) },
    { id: 'proxima-2', indicador: 'E. coli', previstaPara: diasAFrente(5) },
    { id: 'proxima-3', indicador: 'Listeria monocytogenes (recoleta)', previstaPara: diasAFrente(1) },
  ]
}

export function criarAuditoriaMock(): RegistroDeAuditoria[] {
  return [
    {
      id: 'aud-1',
      descricao: 'Verificação de CCP: Recebimento de matéria-prima',
      responsavel: 'Rita Açougueira',
      registradoEm: horasAtras(2),
    },
    {
      id: 'aud-2',
      descricao: 'Verificação de CCP: Câmaras frias',
      responsavel: 'Marcos Caixa',
      registradoEm: horasAtras(1),
    },
    {
      id: 'aud-3',
      descricao: 'Coleta microbiológica registrada: Listeria monocytogenes',
      responsavel: 'Dono',
      registradoEm: horasAtras(48),
    },
    {
      id: 'aud-4',
      descricao: 'Verificação de CCP: Coleta de amostras',
      responsavel: 'Dono',
      registradoEm: horasAtras(30),
    },
  ]
}
