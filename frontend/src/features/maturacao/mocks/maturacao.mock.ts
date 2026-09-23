import type { Camara, PecaEmMaturacao } from '../types'

export const CAMARAS_MOCK: Camara[] = [
  {
    id: 'camara-1',
    nome: 'Câmara 1 — Dry Aged',
    temperaturaAtual: 1.5,
    temperaturaIdealMin: 0,
    temperaturaIdealMax: 3,
    umidadeAtual: 82,
    umidadeIdealMin: 75,
    umidadeIdealMax: 85,
  },
  {
    id: 'camara-2',
    nome: 'Câmara 2 — Wet Aged',
    temperaturaAtual: 4.2,
    temperaturaIdealMin: 0,
    temperaturaIdealMax: 4,
    umidadeAtual: 88,
    umidadeIdealMin: 80,
    umidadeIdealMax: 90,
  },
]

export function criarPecasMock(): PecaEmMaturacao[] {
  return [
    {
      id: 'peca-1',
      nome: 'Contrafilé Angus',
      tecnica: 'dry_aged',
      camaraId: 'camara-1',
      pesoInicialKg: 6.8,
      pesoAtualKg: 6.1,
      diasAtual: 34,
      diasTotal: 45,
      custoInicialPorKg: 48,
    },
    {
      id: 'peca-2',
      nome: 'Bisteca Wagyu',
      tecnica: 'dry_aged',
      camaraId: 'camara-1',
      pesoInicialKg: 5.2,
      pesoAtualKg: 4.98,
      diasAtual: 12,
      diasTotal: 60,
      custoInicialPorKg: 210,
    },
    {
      id: 'peca-3',
      nome: 'Picanha Nelore',
      tecnica: 'wet_aged',
      camaraId: 'camara-2',
      pesoInicialKg: 2.4,
      pesoAtualKg: 2.36,
      diasAtual: 8,
      diasTotal: 10,
      custoInicialPorKg: 62,
    },
    {
      id: 'peca-4',
      nome: 'Ancho Premium',
      tecnica: 'dry_aged',
      camaraId: 'camara-1',
      pesoInicialKg: 4.5,
      pesoAtualKg: 3.7,
      diasAtual: 40,
      diasTotal: 40,
      custoInicialPorKg: 55,
    },
  ]
}
