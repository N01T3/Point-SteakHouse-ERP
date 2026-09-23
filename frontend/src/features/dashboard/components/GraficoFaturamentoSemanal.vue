<script setup lang="ts">
import { computed } from 'vue'
import GraficoBarras from '../../../shared/components/GraficoBarras.vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import type { FaturamentoDoDia } from '../services/dashboard.api'

const props = defineProps<{ dados: FaturamentoDoDia[] }>()
const { formatarMoeda } = useFormatador()

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const barras = computed(() =>
  props.dados.map((dia) => {
    const data = new Date(dia.data)
    return {
      label: DIAS_DA_SEMANA[data.getDay()],
      valor: dia.valor,
      valorLabel: (dia.valor / 1000).toFixed(1) + 'k',
      destaque: data.getDay() === 6,
    }
  }),
)

const total = computed(() => props.dados.reduce((soma, dia) => soma + dia.valor, 0))
</script>

<template>
  <div class="cartao">
    <div class="cabecalho">
      <div class="titulo">Faturamento — últimos 7 dias</div>
      <div class="total">total {{ formatarMoeda(total) }}</div>
    </div>
    <GraficoBarras :dados="barras" />
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

.cabecalho {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.titulo {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.total {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}
</style>
