<script setup lang="ts">
withDefaults(defineProps<{ preenchimento?: string }>(), { preenchimento: '20px' })
</script>

<template>
  <div class="cartao" :style="{ padding: preenchimento }">
    <slot />
  </div>
</template>

<style scoped>
.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
