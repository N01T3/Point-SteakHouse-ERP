<script setup lang="ts">
export interface BarraDoGrafico {
  label: string
  valor: number
  valorLabel: string
  destaque?: boolean
}

const props = defineProps<{ dados: BarraDoGrafico[]; altura?: string }>()

const maximo = Math.max(1, ...props.dados.map((d) => d.valor))
</script>

<template>
  <div class="grafico" :style="{ height: altura ?? '150px' }">
    <div v-for="dia in dados" :key="dia.label" class="coluna">
      <div class="valor">{{ dia.valorLabel }}</div>
      <div
        class="barra"
        :class="{ destaque: dia.destaque }"
        :style="{ height: Math.round((dia.valor / maximo) * 100) + '%' }"
      />
      <div class="label">{{ dia.label }}</div>
    </div>
  </div>
</template>

<style scoped>
.grafico {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  padding: 0 4px;
}

.coluna {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
  justify-content: flex-end;
}

.valor,
.label {
  font-size: 11px;
  color: var(--cor-on-surface-variant);
}

.barra {
  width: 100%;
  max-width: 34px;
  background: var(--cor-primary);
  border-radius: 6px 6px 3px 3px;
  transition: height 0.2s ease;
}

.barra.destaque {
  background: var(--cor-secondary);
}
</style>
