import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CAMARAS_MOCK, criarPecasMock } from '../mocks/maturacao.mock'
import type { PecaEmMaturacao } from '../types'

export const useMaturacaoStore = defineStore('maturacao', () => {
  const camaras = CAMARAS_MOCK
  const pecas = ref<PecaEmMaturacao[]>(criarPecasMock())
  const pecasFinalizadas = ref<PecaEmMaturacao[]>([])

  function iniciarMaturacao(dados: {
    nome: string
    tecnica: PecaEmMaturacao['tecnica']
    camaraId: string
    pesoInicialKg: number
    diasTotal: number
    custoInicialPorKg: number
    loteOrigem?: string
    responsavel?: string
  }): PecaEmMaturacao {
    if (!dados.nome.trim()) throw new Error('Nome da peça é obrigatório.')
    if (!camaras.some((c) => c.id === dados.camaraId)) throw new Error('Câmara inválida.')
    if (!(dados.pesoInicialKg > 0)) throw new Error('Peso inicial deve ser maior que zero.')
    if (!(dados.diasTotal > 0)) throw new Error('Prazo deve ser maior que zero.')
    if (!(dados.custoInicialPorKg >= 0)) throw new Error('Custo inválido.')
    const peca: PecaEmMaturacao = {
      id: `peca-${crypto.randomUUID()}`,
      nome: dados.nome.trim(),
      tecnica: dados.tecnica,
      camaraId: dados.camaraId,
      pesoInicialKg: dados.pesoInicialKg,
      pesoAtualKg: dados.pesoInicialKg,
      diasAtual: 0,
      diasTotal: Math.round(dados.diasTotal),
      custoInicialPorKg: dados.custoInicialPorKg,
      loteOrigem: dados.loteOrigem?.trim() || undefined,
      responsavel: dados.responsavel?.trim() || undefined,
      finalizada: false,
    }
    pecas.value.unshift(peca)
    return peca
  }

  function registrarPesagem(pecaId: string, novoPesoKg: number): void {
    const peca = pecas.value.find((p) => p.id === pecaId)
    if (!peca) throw new Error('Peça não encontrada.')
    if (!(novoPesoKg > 0)) throw new Error('Peso deve ser maior que zero.')
    if (novoPesoKg > peca.pesoInicialKg + 0.001) throw new Error('Peso atual não pode superar o inicial.')
    peca.pesoAtualKg = Math.round(novoPesoKg * 1000) / 1000
  }

  function finalizarMaturacao(pecaId: string): PecaEmMaturacao {
    const indice = pecas.value.findIndex((peca) => peca.id === pecaId)
    if (indice === -1) {
      if (pecasFinalizadas.value.some((p) => p.id === pecaId)) throw new Error('Peça já finalizada.')
      throw new Error('Peça não encontrada.')
    }
    const [peca] = pecas.value.splice(indice, 1)
    peca.finalizada = true
    pecasFinalizadas.value.unshift(peca)
    return peca
  }

  return { camaras, pecas, pecasFinalizadas, iniciarMaturacao, registrarPesagem, finalizarMaturacao }
})
