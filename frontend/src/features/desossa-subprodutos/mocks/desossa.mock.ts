import type { PecaBruta, TemplateDeDesossa } from '../types'

export const TEMPLATES_DESOSSA_MOCK: TemplateDeDesossa[] = [
  {
    id: 'traseiro',
    tipoDePeca: 'Traseiro',
    cortesEsperados: [
      { nome: 'Picanha', percentualEsperado: 0.06 },
      { nome: 'Alcatra', percentualEsperado: 0.09 },
      { nome: 'Maminha', percentualEsperado: 0.04 },
      { nome: 'Coxão Mole', percentualEsperado: 0.12 },
    ],
  },
  {
    id: 'dianteiro',
    tipoDePeca: 'Dianteiro',
    cortesEsperados: [
      { nome: 'Acém', percentualEsperado: 0.18 },
      { nome: 'Peito', percentualEsperado: 0.1 },
      { nome: 'Músculo', percentualEsperado: 0.08 },
    ],
  },
  {
    id: 'ponta-de-agulha',
    tipoDePeca: 'Ponta de Agulha',
    cortesEsperados: [
      { nome: 'Costela', percentualEsperado: 0.35 },
      { nome: 'Ponta de Agulha', percentualEsperado: 0.15 },
    ],
  },
]

export function criarPecasBrutasMock(): PecaBruta[] {
  return [
    {
      id: 'pb-1',
      fornecedor: 'Frigorífico Serra Azul',
      tipoDePeca: 'Traseiro',
      pesoKg: 92,
      custoPorKg: 24,
      recebidoEm: new Date(),
    },
    {
      id: 'pb-2',
      fornecedor: 'Frigorífico Serra Azul',
      tipoDePeca: 'Ponta de Agulha',
      pesoKg: 38,
      custoPorKg: 19,
      recebidoEm: new Date(),
    },
  ]
}
