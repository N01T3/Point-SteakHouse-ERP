<script setup lang="ts">
import { ref } from 'vue'
import BadgeStatus from '../../../shared/components/BadgeStatus.vue'
import Botao from '../../../shared/components/Botao.vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useModoDetalhado } from '../../../shared/composables/useModoDetalhado'
import { useTema } from '../../../shared/composables/useTema'
import { useAuthStore } from '../../auth/store/auth.store'
import { useFinanceiroStore } from '../../financeiro/store/financeiro.store'
import { useMaturacaoStore } from '../../maturacao/store/maturacao.store'
import { useMercadoStore } from '../../mercado/store/mercado.store'
import { useSegurancaBiologicaStore } from '../../seguranca-biologica/store/seguranca-biologica.store'
import BannerAlertaEstoque from '../components/BannerAlertaEstoque.vue'
import CartaoKpi from '../components/CartaoKpi.vue'
import GraficoDistribuicaoCanal from '../components/GraficoDistribuicaoCanal.vue'
import GraficoFaturamentoSemanal from '../components/GraficoFaturamentoSemanal.vue'
import ListaTopCortes from '../components/ListaTopCortes.vue'
import WidgetCamaraDeMaturacao from '../components/WidgetCamaraDeMaturacao.vue'
import { useResumoGerencial } from '../composables/useResumoGerencial'

const { formatarMoeda, formatarDataPorExtenso } = useFormatador()
const { modoEscuro, alternar } = useTema()
const auth = useAuthStore()
const mercado = useMercadoStore()
const maturacao = useMaturacaoStore()
const fin = useFinanceiroStore()
const bio = useSegurancaBiologicaStore()
const { modo, definir } = useModoDetalhado()
const {
  resumo,
  faturamentoSemanal,
  distribuicaoCanal,
  topCortes,
  camaraMaturacao,
  alertasEstoque,
  carregando,
  erro,
} = useResumoGerencial()

const erroDemo = ref('')

function carregarDemo(): void {
  erroDemo.value = ''
  try {
    mercado.carregarVendasDemonstracao(auth.usuario?.nome ?? 'demo')
    fin.carregarExemplo(auth.usuario?.nome ?? 'demo')
  } catch (e) {
    erroDemo.value = e instanceof Error ? e.message : 'Não foi possível carregar a demonstração.'
  }
}
</script>

<template>
  <div class="pagina">
    <div class="cabecalho">
      <div class="titulos">
        <div class="titulo">Visão geral de hoje</div>
        <div class="data">{{ formatarDataPorExtenso() }}</div>
      </div>
      <div class="acoes">
        <BadgeStatus tom="sucesso">Online · sincronizado</BadgeStatus>
        <Botao @clique="alternar">{{ modoEscuro ? 'Modo escuro' : 'Modo claro' }}</Botao>
      </div>
    </div>

    <div v-if="erro" class="erro">{{ erro }}</div>

    <div class="kpis">
      <CartaoKpi
        titulo="Receita turno (real)"
        :valor="formatarMoeda(mercado.resumoOperacional.receita)"
        nota="Mercado"
      />
      <CartaoKpi
        titulo="Margem turno (real)"
        :valor="formatarMoeda(mercado.resumoOperacional.margem)"
        nota="receita − CMV"
      />
      <CartaoKpi
        titulo="Peças em maturação (real)"
        :valor="String(maturacao.pecas.length)"
        :nota="`${maturacao.pecasFinalizadas.length} finalizadas`"
      />
      <CartaoKpi
        titulo="Fixos ativos"
        :valor="formatarMoeda(fin.totalCustosFixosAtivos)"
        :nota="`${bio.acoes.filter((a) => a.status === 'aberta').length} ações sanitárias abertas`"
      />
    </div>
    <div v-if="mercado.vendas.length === 0" class="demo-linha">
      <span class="demo-texto">Sem movimento no turno — os gráficos reais ficam zerados.</span>
      <button type="button" class="botao-detalhes" @click="carregarDemo">
        Carregar vendas de demonstração
      </button>
      <span v-if="erroDemo" class="erro">{{ erroDemo }}</span>
    </div>

    <template v-if="!carregando && resumo">
      <div class="kpis">
        <CartaoKpi titulo="Faturamento hoje" :valor="formatarMoeda(resumo.faturamentoHoje)" />
        <CartaoKpi titulo="Ticket médio" :valor="formatarMoeda(resumo.ticketMedio)" nota="Mercado" />
        <CartaoKpi
          titulo="Saldo em conta (fiado)"
          :valor="formatarMoeda(resumo.saldoEmContaFiado)"
          :nota="`${resumo.clientesComSaldoAberto} clientes com saldo aberto`"
        />
        <CartaoKpi
          titulo="Peças em maturação"
          :valor="String(resumo.pecasEmMaturacaoCount)"
          :nota="`${resumo.pecasProntasNaSemana} prontas esta semana`"
        />
      </div>

      <!-- Modo simples do Proprietário: estado + alerta + próxima ação -->
      <template v-if="modo === 'simples' && auth.papel === 'PROPRIETARIO'">
        <BannerAlertaEstoque :alertas="alertasEstoque" />
        <GraficoFaturamentoSemanal :dados="faturamentoSemanal" />
        <button type="button" class="botao-detalhes" @click="definir('detalhado')">
          Ver gráficos e detalhes →
        </button>
      </template>

      <template v-else>
        <div class="linha-graficos">
          <GraficoFaturamentoSemanal :dados="faturamentoSemanal" />
          <GraficoDistribuicaoCanal
            v-if="distribuicaoCanal"
            :distribuicao="distribuicaoCanal"
            :faturamento-semanal="faturamentoSemanal"
          />
        </div>

        <div class="linha-listas">
          <ListaTopCortes :cortes="topCortes" />
          <WidgetCamaraDeMaturacao :pecas="camaraMaturacao" />
        </div>

        <BannerAlertaEstoque :alertas="alertasEstoque" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.pagina {
  padding: 36px 44px 60px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.titulos {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.titulo {
  font-family: var(--fonte-display);
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.data {
  font-size: 13.5px;
  color: var(--cor-on-surface-variant);
}

.acoes {
  display: flex;
  align-items: center;
  gap: 10px;
}

.erro {
  font-size: 13px;
  color: var(--cor-error);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.linha-graficos {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 18px;
  align-items: stretch;
}

.linha-listas {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 18px;
  align-items: stretch;
}

.botao-detalhes {
  align-self: flex-start;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  border-radius: 100px;
  padding: 12px 22px;
  min-height: 44px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.demo-linha {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.demo-texto {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

@media (max-width: 1024px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .linha-graficos,
  .linha-listas {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .pagina {
    padding: 24px 16px 90px;
    gap: 18px;
  }

  .kpis {
    grid-template-columns: 1fr;
  }
}
</style>
