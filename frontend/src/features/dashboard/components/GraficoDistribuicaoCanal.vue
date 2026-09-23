<script setup lang="ts">
import { computed } from 'vue'
import GraficoDonut from '../../../shared/components/GraficoDonut.vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import type { DistribuicaoDoMercado, FaturamentoDoDia } from '../services/dashboard.api'

const props = defineProps<{ distribuicao: DistribuicaoDoMercado; faturamentoSemanal: FaturamentoDoDia[] }>()
const { formatarMoeda } = useFormatador()

const totalSemanal = computed(() => props.faturamentoSemanal.reduce((soma, dia) => soma + dia.valor, 0))

const fatias = computed(() => [
  { label: 'Carnes', percentual: props.distribuicao.carnes, cor: 'var(--cor-primary)' },
  { label: 'Complementos', percentual: props.distribuicao.complementos, cor: 'var(--cor-secondary)' },
])
</script>

<template>
  <div class="cartao">
    <div class="titulo">Carnes × Complementos</div>
    <GraficoDonut :fatias="fatias" :valor-central="formatarMoeda(totalSemanal)" legenda-central="7 dias" />
  </div>
</template>

<style scoped>
.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.titulo {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
}
</style>
