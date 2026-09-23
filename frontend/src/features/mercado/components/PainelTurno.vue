<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { LIMITE_DIVERGENCIA_CAIXA, useMercadoStore } from '../store/mercado.store'
import type { TipoMovimentoCaixa } from '../tipos'

const store = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const valorMov = ref<number | null>(null)
const motivoMov = ref('')
const tipoMov = ref<TipoMovimentoCaixa>('SANGRIA')
const valorContado = ref<number | null>(null)
const erro = ref('')
const sucesso = ref('')

const podeAprovar = computed(() => auth.papel === 'PROPRIETARIO' || auth.papel === 'ADMINISTRADOR')

function registrar(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (valorMov.value === null) return
    store.registrarMovimento(tipoMov.value, valorMov.value, motivoMov.value)
    sucesso.value = `${tipoMov.value === 'SANGRIA' ? 'Sangria' : 'Suprimento'} de ${formatarMoeda(valorMov.value)} registrada.`
    valorMov.value = null
    motivoMov.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível registrar.'
  }
}

function fechar(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (valorContado.value === null) return
    const turno = store.fecharTurno(valorContado.value, podeAprovar.value ? auth.usuario?.nome : undefined)
    sucesso.value = `Turno fechado com diferença de ${formatarMoeda(turno.diferenca ?? 0)}.`
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível fechar.'
  }
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-alert v-if="erro" type="error" variant="tonal" density="compact">{{ erro }}</v-alert>
    <v-alert v-if="sucesso" type="success" variant="tonal" density="compact">{{ sucesso }}</v-alert>
    <v-card rounded="xl">
      <v-card-title>Turno atual</v-card-title>
      <v-card-text class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <div class="text-caption">Operador</div>
          <strong>{{ store.turno?.operador }}</strong>
        </div>
        <div>
          <div class="text-caption">Abertura</div>
          <strong
            >{{ store.turno ? hora(store.turno.abertoEm) : '-' }} -
            {{ formatarMoeda(store.turno?.valorInicial ?? 0) }}</strong
          >
        </div>
        <div>
          <div class="text-caption">Esperado em dinheiro</div>
          <strong>{{ formatarMoeda(store.esperadoDinheiro) }}</strong>
        </div>
        <div>
          <div class="text-caption">Vendas</div>
          <strong>{{ store.vendas.length }} - {{ formatarMoeda(store.faturamentoTurno) }}</strong>
        </div>
      </v-card-text>
    </v-card>
    <v-card v-if="store.turno?.estado === 'ABERTO'" rounded="xl">
      <v-card-title>Sangria / suprimento</v-card-title>
      <v-card-text class="d-flex flex-wrap ga-2 align-center">
        <v-btn-toggle v-model="tipoMov" color="primary" density="comfortable" rounded="xl" border mandatory>
          <v-btn value="SANGRIA">Sangria</v-btn>
          <v-btn value="SUPRIMENTO">Suprimento</v-btn>
        </v-btn-toggle>
        <v-text-field
          v-model.number="valorMov"
          type="number"
          label="Valor"
          prefix="R$"
          density="comfortable"
          hide-details
          style="max-width: 160px"
        />
        <v-text-field
          v-model="motivoMov"
          label="Motivo (obrigatorio)"
          density="comfortable"
          hide-details
          style="min-width: 200px; flex: 1"
        />
        <v-btn variant="tonal" rounded="xl" @click="registrar">Registrar</v-btn>
      </v-card-text>
    </v-card>
    <v-card v-if="store.turno?.estado === 'ABERTO'" rounded="xl">
      <v-card-title>Fechar turno</v-card-title>
      <v-card-text class="d-flex flex-wrap ga-2 align-center">
        <v-text-field
          v-model.number="valorContado"
          type="number"
          label="Valor contado"
          prefix="R$"
          density="comfortable"
          hide-details
          style="max-width: 220px"
        />
        <v-btn color="primary" variant="flat" rounded="xl" @click="fechar">Fechar caixa</v-btn>
      </v-card-text>
      <v-card-text class="text-caption"
        >Divergencias acima de {{ formatarMoeda(LIMITE_DIVERGENCIA_CAIXA) }} exigem Proprietario ou
        Administrador.</v-card-text
      >
    </v-card>
    <v-card v-if="store.turno?.estado === 'FECHADO'" rounded="xl">
      <v-card-title>Turno fechado</v-card-title>
      <v-card-text>Diferenca: {{ formatarMoeda(store.turno.diferenca ?? 0) }}</v-card-text>
      <v-card-actions
        ><v-btn variant="outlined" rounded="xl" @click="store.novoTurno()"
          >Abrir novo turno</v-btn
        ></v-card-actions
      >
    </v-card>
  </div>
</template>
