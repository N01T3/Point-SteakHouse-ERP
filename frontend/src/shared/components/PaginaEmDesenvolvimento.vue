<script setup lang="ts">
defineProps<{ titulo: string }>()
</script>

<template>
  <div class="pagina">
    <div class="titulo">{{ titulo }}</div>
    <div class="texto">Este módulo ainda está em desenvolvimento.</div>
  </div>
</template>

<style scoped>
.pagina {
  padding: 60px 44px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.titulo {
  font-family: 'Bodoni Moda', serif;
  font-size: 26px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.texto {
  font-size: 14px;
  color: var(--cor-on-surface-variant);
}
</style>
