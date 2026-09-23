import { onMounted, onUnmounted, ref } from 'vue'
import type {
  AlertaDeEstoque,
  CorteMaisVendido,
  DistribuicaoDoMercado,
  FaturamentoDoDia,
  PecaEmMaturacao,
  ResumoGerencial,
} from '../services/dashboard.api'
import {
  obterAlertasEstoque,
  obterCamaraMaturacao,
  obterDistribuicaoCanal,
  obterFaturamentoSemanal,
  obterResumoGerencial,
  obterTopCortes,
  // Fonte de dados trocada para mocks enquanto o backend não roda localmente —
  // trocar de volta para './dashboard.api' quando o Postgres estiver disponível.
} from '../services/dashboard.mock'

const INTERVALO_DE_ATUALIZACAO_MS = 45_000

export function useResumoGerencial() {
  const resumo = ref<ResumoGerencial | null>(null)
  const faturamentoSemanal = ref<FaturamentoDoDia[]>([])
  const distribuicaoCanal = ref<DistribuicaoDoMercado | null>(null)
  const topCortes = ref<CorteMaisVendido[]>([])
  const camaraMaturacao = ref<PecaEmMaturacao[]>([])
  const alertasEstoque = ref<AlertaDeEstoque[]>([])
  const carregando = ref(true)
  const erro = ref('')

  let temporizador: ReturnType<typeof setInterval> | undefined

  async function carregar(): Promise<void> {
    try {
      const [r, fs, dc, tc, cm, ae] = await Promise.all([
        obterResumoGerencial(),
        obterFaturamentoSemanal(),
        obterDistribuicaoCanal(),
        obterTopCortes(),
        obterCamaraMaturacao(),
        obterAlertasEstoque(),
      ])
      resumo.value = r
      faturamentoSemanal.value = fs
      distribuicaoCanal.value = dc
      topCortes.value = tc
      camaraMaturacao.value = cm
      alertasEstoque.value = ae
      erro.value = ''
    } catch (e) {
      erro.value = e instanceof Error ? e.message : 'Não foi possível carregar o painel.'
    } finally {
      carregando.value = false
    }
  }

  onMounted(() => {
    carregar()
    temporizador = setInterval(carregar, INTERVALO_DE_ATUALIZACAO_MS)
  })

  onUnmounted(() => {
    if (temporizador) clearInterval(temporizador)
  })

  return {
    resumo,
    faturamentoSemanal,
    distribuicaoCanal,
    topCortes,
    camaraMaturacao,
    alertasEstoque,
    carregando,
    erro,
  }
}
