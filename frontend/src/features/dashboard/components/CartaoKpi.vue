<script setup lang="ts">
withDefaults(defineProps<{ titulo: string; valor: string; nota?: string; notaPositiva?: boolean }>(), {
  nota: undefined,
  notaPositiva: false,
})
</script>

<template>
  <div class="kpi">
    <div class="titulo">{{ titulo }}</div>
    <div class="valor">{{ valor }}</div>
    <div v-if="nota" class="nota" :class="{ positiva: notaPositiva }">{{ nota }}</div>
  </div>
</template>

<style scoped>
.kpi {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.titulo {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.valor {
  font-family: var(--fonte-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--cor-on-surface);
}

.nota {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.nota.positiva {
  color: var(--cor-success);
  font-weight: 600;
}
</style>
