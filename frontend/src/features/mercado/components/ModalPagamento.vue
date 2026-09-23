<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { calcularTroco, fiadoDisponivel } from '../logica/mercado'
import { useMercadoStore } from '../store/mercado.store'
import type { FormaPagamento, PagamentoVenda, ParcelaPagamento } from '../tipos'

const props = defineProps<{ total: number }>()
const emit = defineEmits<{
  fechar: []
  confirmar: [pagamento: PagamentoVenda]
}>()

const store = useMercadoStore()
const { formatarMoeda } = useFormatador()
const { mobile } = useDisplay()

const modo = ref<'avista' | 'dividido'>('avista')
const forma = ref<FormaPagamento>('DINHEIRO')
const recebido = ref<number | null>(null)
const clienteId = ref('')
const erro = ref('')

const parcelas = ref<Array<{ forma: FormaPagamento; valor: number | null }>>([
  { forma: 'CARTAO', valor: null },
  { forma: 'DINHEIRO', valor: null },
])
const recebidoDividido = ref<number | null>(null)

const ROTULO_FORMA: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão',
  PIX: 'PIX',
  FIADO: 'Fiado',
}

const FORMAS: FormaPagamento[] = ['DINHEIRO', 'CARTAO', 'PIX', 'FIADO']

const ICONE_FORMA: Record<FormaPagamento, string> = {
  DINHEIRO: 'mdi-cash',
  CARTAO: 'mdi-credit-card',
  PIX: 'mdi-lightning-bolt',
  FIADO: 'mdi-account-clock',
}

const troco = computed(() =>
  forma.value === 'DINHEIRO' && recebido.value !== null ? calcularTroco(props.total, recebido.value) : null,
)
const cliente = computed(() => store.clientes.find((c) => c.id === clienteId.value) ?? null)

const somaParcelas = computed(
  () => Math.round(parcelas.value.reduce((soma, p) => soma + (p.valor ?? 0), 0) * 100) / 100,
)
const restante = computed(() => Math.round((props.total - somaParcelas.value) * 100) / 100)
const temDinheiroDividido = computed(() => parcelas.value.some((p) => p.forma === 'DINHEIRO'))
const valorDinheiroDividido = computed(
  () =>
    Math.round(
      parcelas.value.filter((p) => p.forma === 'DINHEIRO').reduce((soma, p) => soma + (p.valor ?? 0), 0) *
        100,
    ) / 100,
)
const trocoDividido = computed(() =>
  recebidoDividido.value !== null ? calcularTroco(valorDinheiroDividido.value, recebidoDividido.value) : null,
)
const temFiadoDividido = computed(() => parcelas.value.some((p) => p.forma === 'FIADO'))

function adicionarParcela(): void {
  parcelas.value.push({ forma: 'PIX', valor: null })
}

function removerParcela(indice: number): void {
  if (parcelas.value.length > 2) parcelas.value.splice(indice, 1)
}

function confirmar(): void {
  erro.value = ''
  if (modo.value === 'dividido') {
    if (temFiadoDividido.value && !cliente.value) {
      erro.value = 'Parcela em fiado exige cliente selecionado.'
      return
    }
    const lista: ParcelaPagamento[] = []
    for (const p of parcelas.value) {
      if (p.valor === null || !(p.valor > 0)) {
        erro.value = 'Informe valor maior que zero em todas as parcelas.'
        return
      }
      lista.push({
        forma: p.forma,
        valor: Math.round(p.valor * 100) / 100,
        ...(p.forma === 'FIADO' && cliente.value ? { clienteId: cliente.value.id } : {}),
      })
    }
    if (Math.abs(somaParcelas.value - props.total) > 0.005) {
      erro.value = `Parcelas somam ${formatarMoeda(somaParcelas.value)} — falta ${formatarMoeda(restante.value)}.`
      return
    }
    if (temDinheiroDividido.value) {
      if (recebidoDividido.value === null || trocoDividido.value === null) {
        erro.value = 'Informe o valor recebido em dinheiro.'
        return
      }
    }
    emit('confirmar', {
      forma: 'DIVIDIDO',
      parcelas: lista,
      ...(temDinheiroDividido.value
        ? { valorRecebido: recebidoDividido.value as number, troco: trocoDividido.value as number }
        : {}),
      ...(temFiadoDividido.value && cliente.value ? { clienteId: cliente.value.id } : {}),
    })
    return
  }
  if (forma.value === 'DINHEIRO') {
    if (recebido.value === null || troco.value === null) {
      erro.value = 'Informe um valor recebido maior ou igual ao total.'
      return
    }
    emit('confirmar', { forma: 'DINHEIRO', valorRecebido: recebido.value, troco: troco.value })
  } else if (forma.value === 'FIADO') {
    if (!cliente.value) {
      erro.value = 'Selecione o cliente do fiado.'
      return
    }
    emit('confirmar', { forma: 'FIADO', clienteId: cliente.value.id })
  } else {
    emit('confirmar', { forma: forma.value })
  }
}
</script>

<template>
  <v-dialog
    :model-value="true"
    max-width="480"
    :fullscreen="mobile"
    :transition="mobile ? 'dialog-bottom-transition' : 'dialog-transition'"
    @update:model-value="(v) => !v && emit('fechar')"
  >
    <v-card rounded="xl">
      <v-card-title>Pagamento - {{ formatarMoeda(total) }}</v-card-title>
      <v-card-text class="d-flex flex-column ga-3">
        <v-btn-toggle v-model="modo" color="primary" density="comfortable" rounded="xl" border mandatory>
          <v-btn value="avista">A vista</v-btn>
          <v-btn value="dividido">Dividido</v-btn>
        </v-btn-toggle>
        <template v-if="modo === 'avista'">
          <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Forma de pagamento">
            <v-card
              v-for="opcao in FORMAS"
              :key="opcao"
              :variant="forma === opcao ? 'tonal' : 'outlined'"
              :color="forma === opcao ? 'primary' : undefined"
              rounded="lg"
              hover
              @click="forma = opcao"
            >
              <v-card-text class="d-flex align-center ga-2 py-3">
                <v-icon :icon="ICONE_FORMA[opcao]" />
                <span class="font-weight-medium">{{ ROTULO_FORMA[opcao] }}</span>
                <v-spacer />
                <v-icon v-if="forma === opcao" icon="mdi-check-circle" color="primary" />
              </v-card-text>
            </v-card>
          </div>
          <v-text-field
            v-if="forma === 'DINHEIRO'"
            v-model.number="recebido"
            type="number"
            label="Valor recebido"
            prefix="R$"
          />
          <v-alert v-if="forma === 'DINHEIRO' && troco !== null" type="info" variant="tonal" density="compact"
            >Troco: {{ formatarMoeda(troco) }}</v-alert
          >
          <v-select
            v-if="forma === 'FIADO'"
            v-model="clienteId"
            label="Cliente"
            :items="
              store.clientes.map((c) => ({
                title: c.nome + ' - disponivel ' + formatarMoeda(fiadoDisponivel(c)),
                value: c.id,
              }))
            "
          />
        </template>
        <template v-else>
          <v-card
            v-for="(parcela, indice) in parcelas"
            :key="indice"
            variant="outlined"
            rounded="lg"
          >
            <v-card-text class="d-flex ga-2 align-center">
              <v-select
                v-model="parcela.forma"
                label="Forma"
                :items="Object.entries(ROTULO_FORMA).map(([value, title]) => ({ title, value }))"
                density="compact"
                hide-details
                style="max-width: 150px"
              />
              <v-text-field
                v-model.number="parcela.valor"
                type="number"
                label="Valor"
                prefix="R$"
                density="compact"
                hide-details
              />
              <v-btn
                v-if="parcelas.length > 2"
                icon="mdi-close"
                size="small"
                variant="text"
                @click="removerParcela(indice)"
              />
            </v-card-text>
          </v-card>
          <v-btn variant="text" prepend-icon="mdi-plus" @click="adicionarParcela">Adicionar forma</v-btn>
          <v-alert :type="restante === 0 ? 'success' : 'warning'" variant="tonal" density="compact"
            >Restante: {{ formatarMoeda(restante) }}</v-alert
          >
          <v-text-field
            v-if="temDinheiroDividido"
            v-model.number="recebidoDividido"
            type="number"
            label="Recebido em dinheiro"
            prefix="R$"
          />
          <v-select
            v-if="temFiadoDividido"
            v-model="clienteId"
            label="Cliente do fiado"
            :items="store.clientes.map((c) => ({ title: c.nome, value: c.id }))"
          />
        </template>
        <v-alert v-if="erro" type="error" variant="tonal" density="compact">{{ erro }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="outlined" rounded="xl" @click="emit('fechar')">Voltar</v-btn>
        <v-btn color="primary" variant="flat" rounded="xl" prepend-icon="mdi-check" @click="confirmar"
          >Confirmar venda</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
