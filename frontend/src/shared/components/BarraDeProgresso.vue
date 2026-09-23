<script setup lang="ts">
const props = withDefaults(defineProps<{ percentual: number; cor?: string; altura?: string }>(), {
  cor: 'var(--cor-primary)',
  altura: '8px',
})

const percentualSeguro = Math.min(100, Math.max(0, props.percentual))
</script>

<template>
  <div class="trilha" :style="{ height: altura }">
    <div class="preenchimento" :style="{ width: percentualSeguro + '%', background: cor }" />
  </div>
</template>

<style scoped>
.trilha {
  border-radius: 6px;
  background: var(--cor-surface-variant);
  overflow: hidden;
}

.preenchimento {
  height: 100%;
  border-radius: 6px;
  transition: width 0.2s ease;
}
</style>
