// Conta corrente de demonstração — 6 clientes com extratos.
// Em produção, vendas do caixa e quitações alimentam o mesmo extrato.
import type { Cliente, LancamentoFiado } from '../tipos'

function diasAtras(dias: number): string {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return data.toISOString()
}

export const CLIENTES_MOCK: Cliente[] = [
  {
    id: 'cli-ana',
    nome: 'Ana Ferreira',
    telefone: '(44) 99912-3456',
    endereco: 'Rua das Palmeiras, 120',
    aniversario: '1988-03-14',
    limite: 500,
    saldo: 320.5,
    ativo: true,
    criadoEm: '2026-01-10T00:00:00',
  },
  {
    id: 'cli-bruno',
    nome: 'Bruno Alves',
    telefone: '(44) 98877-2211',
    limite: 300,
    saldo: 40,
    ativo: true,
    criadoEm: '2026-02-02T00:00:00',
  },
  {
    id: 'cli-carla',
    nome: 'Carla Souza',
    telefone: '(44) 97766-5544',
    endereco: 'Av. Central, 88',
    limite: 200,
    saldo: 195,
    ativo: true,
    criadoEm: '2026-03-15T00:00:00',
  },
  {
    id: 'cli-joao',
    nome: 'João Pereira',
    telefone: '(44) 96655-4433',
    limite: 400,
    saldo: 0,
    ativo: true,
    criadoEm: '2026-04-20T00:00:00',
  },
  {
    id: 'cli-maria',
    nome: 'Maria Santos',
    telefone: '(44) 95544-3322',
    endereco: 'Rua do Comércio, 45',
    aniversario: '1975-09-22',
    limite: 250,
    saldo: 250,
    ativo: true,
    criadoEm: '2026-05-11T00:00:00',
  },
  {
    id: 'cli-pedro',
    nome: 'Pedro Lima',
    telefone: '(44) 94433-2211',
    limite: 150,
    saldo: 20,
    ativo: false,
    criadoEm: '2026-06-01T00:00:00',
  },
]

export const EXTRATO_MOCK: LancamentoFiado[] = [
  {
    id: 'l1',
    clienteId: 'cli-ana',
    tipo: 'venda',
    valor: 220.4,
    vendaNumero: 12,
    operador: 'Marcos',
    criadoEm: diasAtras(2),
  },
  {
    id: 'l2',
    clienteId: 'cli-ana',
    tipo: 'venda',
    valor: 200.1,
    vendaNumero: 18,
    operador: 'Marcos',
    criadoEm: diasAtras(1),
  },
  {
    id: 'l3',
    clienteId: 'cli-ana',
    tipo: 'pagamento',
    valor: 100,
    operador: 'dono',
    observacao: 'PIX',
    criadoEm: diasAtras(1),
  },
  {
    id: 'l4',
    clienteId: 'cli-bruno',
    tipo: 'venda',
    valor: 89.9,
    vendaNumero: 21,
    operador: 'Marcos',
    criadoEm: diasAtras(3),
  },
  {
    id: 'l5',
    clienteId: 'cli-bruno',
    tipo: 'pagamento',
    valor: 49.9,
    operador: 'dono',
    criadoEm: diasAtras(2),
  },
  {
    id: 'l6',
    clienteId: 'cli-carla',
    tipo: 'venda',
    valor: 195,
    vendaNumero: 25,
    operador: 'Marcos',
    criadoEm: diasAtras(9),
  },
  {
    id: 'l7',
    clienteId: 'cli-maria',
    tipo: 'venda',
    valor: 250,
    vendaNumero: 9,
    operador: 'Marcos',
    criadoEm: diasAtras(35),
  },
  {
    id: 'l8',
    clienteId: 'cli-pedro',
    tipo: 'venda',
    valor: 120,
    vendaNumero: 4,
    operador: 'Marcos',
    criadoEm: diasAtras(50),
  },
  {
    id: 'l9',
    clienteId: 'cli-pedro',
    tipo: 'pagamento',
    valor: 100,
    operador: 'dono',
    criadoEm: diasAtras(40),
  },
]
