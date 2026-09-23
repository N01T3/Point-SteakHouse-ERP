<script setup lang="ts">
withDefaults(defineProps<{ variante?: 'contorno' | 'preenchido' }>(), { variante: 'contorno' })
defineEmits<{ clique: [] }>()
</script>

<template>
  <button class="botao" :class="variante" @click="$emit('clique')">
    <slot />
  </button>
</template>

<style scoped>
.botao {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.botao.contorno {
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
}

.botao.preenchido {
  border: none;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
}
</style>
