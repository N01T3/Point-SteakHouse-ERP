import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  calcularCustoBasePorKg,
  calcularCustoEfetivoPorKg,
  calcularPesoAproveitavelKg,
  calcularRendimentoRealizado,
} from '../logica/custeio'
import { criarPecasBrutasMock, TEMPLATES_DESOSSA_MOCK } from '../mocks/desossa.mock'
import type { OrdemDeDesossa, PecaBruta, SaidaDeDesossa } from '../types'

function novoId(prefixo: string): string {
  return `${prefixo}-${crypto.randomUUID()}`
}

export const useDesossaStore = defineStore('desossa', () => {
  const templates = ref(TEMPLATES_DESOSSA_MOCK)
  const pecasBrutasPendentes = ref<PecaBruta[]>(criarPecasBrutasMock())
  const ordensConcluidas = ref<OrdemDeDesossa[]>([])
  const erro = ref('')

  function registrarPecaBruta(dados: Omit<PecaBruta, 'id' | 'recebidoEm'>): PecaBruta {
    erro.value = ''
    if (!dados.fornecedor.trim()) throw new Error('Fornecedor é obrigatório.')
    if (!dados.tipoDePeca.trim()) throw new Error('Tipo de peça é obrigatório.')
    if (!(dados.pesoKg > 0)) throw new Error('Peso deve ser maior que zero.')
    if (!(dados.custoPorKg >= 0)) throw new Error('Custo por kg inválido.')
    const peca: PecaBruta = {
      ...dados,
      fornecedor: dados.fornecedor.trim(),
      tipoDePeca: dados.tipoDePeca.trim(),
      id: novoId('peca-bruta'),
      recebidoEm: new Date(),
    }
    pecasBrutasPendentes.value.unshift(peca)
    return peca
  }

  /** Valida soma dos cortes: não pode ultrapassar o peso da peça. */
  function validarSaidas(pesoPecaKg: number, saidas: SaidaDeDesossa[]): string | null {
    if (saidas.length === 0) return 'Informe ao menos um corte ou subproduto.'
    if (!saidas.some((s) => s.classificacao === 'CORTE' && s.pesoKg > 0))
      return 'Informe ao menos um corte de venda.'
    const total = saidas.reduce((s, x) => s + x.pesoKg, 0)
    if (total - pesoPecaKg > 0.001)
      return `Soma das saídas (${total.toFixed(2)} kg) ultrapassa a peça (${pesoPecaKg.toFixed(2)} kg).`
    return null
  }

  function concluirDesossa(
    pecaBrutaId: string,
    saidas: SaidaDeDesossa[],
    rendimentoEsperado: number,
  ): OrdemDeDesossa {
    const indice = pecasBrutasPendentes.value.findIndex((peca) => peca.id === pecaBrutaId)
    if (indice === -1) throw new Error('Peça não encontrada.')

    const pecaBruta = pecasBrutasPendentes.value[indice]
    const problema = validarSaidas(pecaBruta.pesoKg, saidas)
    if (problema) throw new Error(problema)

    const [removida] = pecasBrutasPendentes.value.splice(indice, 1)
    const custoTotal = removida.pesoKg * removida.custoPorKg
    const pesoAproveitavel = calcularPesoAproveitavelKg(saidas)
    const custoBasePorKg = calcularCustoBasePorKg(custoTotal, pesoAproveitavel)
    const custoEfetivo = calcularCustoEfetivoPorKg(custoBasePorKg)

    const ordem: OrdemDeDesossa = {
      id: novoId('ordem'),
      pecaBruta: removida,
      saidas,
      rendimentoEsperado,
      rendimentoRealizado: calcularRendimentoRealizado(removida.pesoKg, saidas),
      custoEfetivoPorKg: custoEfetivo,
      concluidaEm: new Date(),
      enviadaAoEstoque: false,
      custoPorCorte: saidas
        .filter((s) => s.classificacao === 'CORTE')
        .map((s) => ({
          nome: s.nome,
          pesoKg: s.pesoKg,
          custoTotal: Math.round(s.pesoKg * custoEfetivo * 100) / 100,
        })),
    }
    ordensConcluidas.value.unshift(ordem)
    return ordem
  }

  function marcarEnviada(ordemId: string): void {
    const o = ordensConcluidas.value.find((x) => x.id === ordemId)
    if (!o) throw new Error('Ordem não encontrada.')
    if (o.enviadaAoEstoque) throw new Error('Ordem já enviada ao estoque.')
    o.enviadaAoEstoque = true
  }

  function cancelarOrdem(ordemId: string): void {
    const i = ordensConcluidas.value.findIndex((x) => x.id === ordemId)
    if (i === -1) throw new Error('Ordem não encontrada.')
    const ordem = ordensConcluidas.value[i]
    if (ordem.enviadaAoEstoque) throw new Error('Ordem já enviada ao estoque — faça estorno no livro.')
    ordensConcluidas.value.splice(i, 1)
    pecasBrutasPendentes.value.unshift(ordem.pecaBruta)
  }

  return {
    templates,
    pecasBrutasPendentes,
    ordensConcluidas,
    erro,
    registrarPecaBruta,
    validarSaidas,
    concluirDesossa,
    marcarEnviada,
    cancelarOrdem,
  }
})
