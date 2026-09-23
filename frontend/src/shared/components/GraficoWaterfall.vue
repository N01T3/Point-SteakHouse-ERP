<script setup lang="ts">
import { computed } from 'vue'

export interface DegrauWaterfall {
  rotulo: string
  inicio: number
  fim: number
  total: boolean
  positivo: boolean
}

const props = defineProps<{ degraus: DegrauWaterfall[]; formatar: (v: number) => string }>()

const maximo = computed(() => Math.max(1, ...props.degraus.map((d) => Math.max(d.inicio, d.fim))))
const minimo = computed(() => Math.min(0, ...props.degraus.map((d) => Math.min(d.inicio, d.fim))))
const faixa = computed(() => maximo.value - minimo.value || 1)

function topo(d: DegrauWaterfall): number {
  return ((maximo.value - Math.max(d.inicio, d.fim)) / faixa.value) * 100
}

function altura(d: DegrauWaterfall): number {
  return Math.max(2, (Math.abs(d.fim - d.inicio) / faixa.value) * 100)
}
</script>

<template>
  <div class="wf" role="img" aria-label="Gráfico de cascata do resultado">
    <div v-for="d in degraus" :key="d.rotulo" class="coluna">
      <div class="valor">{{ formatar(d.fim - (d.total ? 0 : d.inicio)) }}</div>
      <div class="trilho">
        <div
          class="barra"
          :class="{ total: d.total, pos: !d.total && d.positivo, neg: !d.total && !d.positivo }"
          :style="{ top: topo(d) + '%', height: altura(d) + '%' }"
          :title="`${d.rotulo}: ${formatar(d.fim)}`"
        />
      </div>
      <div class="rotulo">{{ d.rotulo }}</div>
    </div>
  </div>
</template>

<style scoped>
.wf {
  display: flex;
  gap: 10px;
  align-items: stretch;
}
.coluna {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.valor {
  font-size: 10.5px;
  color: var(--cor-on-surface-variant);
  white-space: nowrap;
}
.trilho {
  position: relative;
  width: 100%;
  max-width: 44px;
  height: 150px;
}
.barra {
  position: absolute;
  left: 0;
  right: 0;
  border-radius: 6px 6px 3px 3px;
}
.barra.pos {
  background: var(--cor-primary);
}
.barra.neg {
  background: var(--cor-error);
}
.barra.total {
  background: var(--cor-secondary);
}
.rotulo {
  font-size: 10.5px;
  color: var(--cor-on-surface-variant);
  text-align: center;
}
@media (max-width: 640px) {
  .wf {
    overflow-x: auto;
  }
  .coluna {
    min-width: 64px;
  }
}
</style>
