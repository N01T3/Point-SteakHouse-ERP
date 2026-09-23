<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { useClientesStore } from '../../clientes/store/clientes.store'
import { useMercadoStore } from '../store/mercado.store'
import type { Venda } from '../tipos'
import CupomVenda from './CupomVenda.vue'
import ModalDevolucao from './ModalDevolucao.vue'

const store = useMercadoStore()
const clientesStore = useClientesStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const devolvendo = ref<Venda | null>(null)
const vendoCupom = ref<Venda | null>(null)
const cancelando = ref<Venda | null>(null)
const motivoCancelamento = ref('')
const erro = ref('')

const podeEstornar = computed(() => auth.temPermissao('caixa.estornar'))

const ROTULO_FORMA: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão',
  PIX: 'PIX',
  FIADO: 'Fiado',
  DIVIDIDO: 'Dividido',
}

const ROTULO_ESTADO: Record<string, string> = {
  CONCLUIDA: 'concluída',
  DEVOLVIDA_PARCIAL: 'devolução parcial',
  DEVOLVIDA_TOTAL: 'devolvida',
  CANCELADA: 'cancelada',
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function confirmarCancelamento(): void {
  erro.value = ''
  try {
    if (!cancelando.value) return
    const venda = cancelando.value
    const operador = auth.usuario?.nome ?? 'operador'
    store.cancelarVenda(venda.id, motivoCancelamento.value, operador)
    if (venda.valorFiado > 0) {
      const id =
        venda.pagamento.clienteId ?? venda.pagamento.parcelas?.find((p) => p.forma === 'FIADO')?.clienteId
      if (id)
        clientesStore.estornarVendaFiado(
          id,
          venda.valorFiado,
          venda.numero,
          operador,
          motivoCancelamento.value,
        )
    }
    cancelando.value = null
    motivoCancelamento.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível cancelar.'
  }
}
</script>

<template>
  <div class="d-flex flex-column ga-3">
    <v-alert v-if="erro" type="error" variant="tonal" density="compact">{{ erro }}</v-alert>
    <v-alert v-if="store.vendas.length === 0" type="info" variant="tonal" density="compact"
      >Nenhuma venda neste turno ainda.</v-alert
    >
    <v-card v-for="venda in store.vendas" :key="venda.id" rounded="xl">
      <v-card-text>
        <div class="d-flex justify-space-between align-center">
          <strong>#{{ venda.numero }} - {{ hora(venda.criadaEm) }}</strong>
          <v-chip
            size="small"
            :color="
              venda.estado === 'CANCELADA' ? 'error' : venda.estado === 'CONCLUIDA' ? 'success' : 'warning'
            "
            variant="tonal"
            >{{ ROTULO_ESTADO[venda.estado] }}</v-chip
          >
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ venda.itens.map((i) => `${i.nome} x ${i.quantidade}`).join(' - ') }}
        </div>
        <div class="d-flex justify-space-between align-center mt-2">
          <span class="text-caption">{{ ROTULO_FORMA[venda.pagamento.forma] }}</span>
          <strong>{{ formatarMoeda(venda.total) }}</strong>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn size="small" variant="text" prepend-icon="mdi-receipt-text" @click="vendoCupom = venda"
          >Cupom</v-btn
        >
        <v-btn
          v-if="podeEstornar && venda.estado === 'CONCLUIDA'"
          size="small"
          variant="text"
          prepend-icon="mdi-undo"
          @click="devolvendo = venda"
          >Devolver</v-btn
        >
        <v-btn
          v-if="podeEstornar && venda.estado === 'CONCLUIDA'"
          size="small"
          variant="text"
          color="error"
          @click="cancelando = venda"
          >Cancelar</v-btn
        >
      </v-card-actions>
    </v-card>
    <v-dialog
      :model-value="cancelando !== null"
      max-width="420"
      @update:model-value="(v) => !v && (cancelando = null)"
    >
      <v-card rounded="xl">
        <v-card-title>Cancelar venda</v-card-title>
        <v-card-text><v-text-field v-model="motivoCancelamento" label="Motivo (obrigatorio)" /></v-card-text>
        <v-card-actions
          ><v-spacer /><v-btn variant="outlined" rounded="xl" @click="cancelando = null">Voltar</v-btn
          ><v-btn color="error" variant="flat" rounded="xl" @click="confirmarCancelamento"
            >Confirmar</v-btn
          ></v-card-actions
        >
      </v-card>
    </v-dialog>
    <ModalDevolucao
      v-if="devolvendo"
      :venda="devolvendo"
      @fechar="devolvendo = null"
      @concluida="devolvendo = null"
    />
    <CupomVenda v-if="vendoCupom" :venda="vendoCupom" @fechar="vendoCupom = null" />
  </div>
</template>
