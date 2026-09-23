<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import AdministracaoMercado from '../components/AdministracaoMercado.vue'
import CaixaVenda from '../components/CaixaVenda.vue'
import CatalogoProdutos from '../components/CatalogoProdutos.vue'
import GestaoMercado from '../components/GestaoMercado.vue'
import HistoricoVendas from '../components/HistoricoVendas.vue'
import PainelTurno from '../components/PainelTurno.vue'
import { useMercadoStore } from '../store/mercado.store'

type Aba = 'caixa' | 'produtos' | 'historico' | 'turno' | 'gestao' | 'admin'

const store = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const aba = ref<Aba>('caixa')
const valorInicial = ref<number | null>(200)
const erro = ref('')

const podeVerGestao = computed(() => auth.papel === 'PROPRIETARIO' || auth.papel === 'ADMINISTRADOR')

watch(
  () => store.eanParaCadastrar,
  (codigo) => {
    if (codigo) aba.value = 'produtos'
  },
)

function abrir(): void {
  erro.value = ''
  try {
    if (valorInicial.value === null) return
    store.abrirTurno(valorInicial.value, auth.usuario?.nome ?? 'operador')
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível abrir o turno.'
  }
}
</script>

<template>
  <div class="m3-page">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-h5 font-weight-bold">Mercado</h1>
        <p v-if="store.turno" class="text-body-2 text-medium-emphasis">
          {{ store.turno.terminal }} · {{ store.turno.operador }} ·
          {{ store.turno.estado === 'ABERTO' ? 'turno aberto' : 'turno fechado' }}
        </p>
      </div>
      <v-chip
        v-if="store.turno"
        :color="store.online ? 'success' : 'warning'"
        variant="tonal"
        :prepend-icon="store.online ? 'mdi-wifi' : 'mdi-wifi-off'"
        @click="store.alternarOnline()"
      >
        {{ store.online ? 'Online · sincronizado' : `Offline · ${store.vendasPendentesSinc} pendentes` }}
      </v-chip>
    </div>

    <v-card v-if="!store.turno" rounded="xl" variant="elevated" max-width="520">
      <v-card-title>Abrir turno</v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Conte o dinheiro da gaveta e informe o valor inicial.
        </p>
        <v-text-field
          v-model.number="valorInicial"
          type="number"
          label="Valor inicial (R$)"
          prefix="R$"
          min="0"
          step="0.01"
        />
        <v-alert v-if="erro" type="error" variant="tonal" density="compact">{{ erro }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" variant="flat" prepend-icon="mdi-cash-register" @click="abrir"
          >Abrir caixa</v-btn
        >
      </v-card-actions>
    </v-card>

    <template v-else>
      <v-tabs v-model="aba" color="primary" show-arrows>
        <v-tab value="caixa" prepend-icon="mdi-cart">Caixa</v-tab>
        <v-tab value="produtos" prepend-icon="mdi-storefront">Produtos · {{ store.produtos.length }}</v-tab>
        <v-tab value="historico" prepend-icon="mdi-receipt-text"
          >Vendas{{ store.vendas.length > 0 ? ` (${store.vendas.length})` : '' }}</v-tab
        >
        <v-tab value="turno" prepend-icon="mdi-clock">Turno</v-tab>
        <v-tab v-if="podeVerGestao" value="gestao" prepend-icon="mdi-chart-bar"
          >Gestão · {{ formatarMoeda(store.faturamentoTurno) }}</v-tab
        >
        <v-tab v-if="podeVerGestao" value="admin" prepend-icon="mdi-cog">Admin</v-tab>
      </v-tabs>
      <v-divider class="mb-1" />

      <v-window v-model="aba">
        <v-window-item value="caixa"><CaixaVenda /></v-window-item>
        <v-window-item value="produtos"><CatalogoProdutos /></v-window-item>
        <v-window-item value="historico"><HistoricoVendas /></v-window-item>
        <v-window-item value="turno"><PainelTurno /></v-window-item>
        <v-window-item v-if="podeVerGestao" value="gestao"><GestaoMercado /></v-window-item>
        <v-window-item v-if="podeVerGestao" value="admin"><AdministracaoMercado /></v-window-item>
      </v-window>
    </template>
  </div>
</template>
