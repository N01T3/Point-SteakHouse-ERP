<script setup lang="ts">
withDefaults(defineProps<{ tom?: 'sucesso' | 'aviso' | 'erro' | 'neutro' }>(), { tom: 'sucesso' })
</script>

<template>
  <div class="badge">
    <span class="ponto" :class="tom" />
    <slot />
  </div>
</template>

<style scoped>
.badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--cor-on-surface-variant);
}

.ponto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.ponto.sucesso {
  background: var(--cor-success);
}

.ponto.aviso {
  background: var(--cor-secondary);
}

.ponto.erro {
  background: var(--cor-error);
}

.ponto.neutro {
  background: var(--cor-on-surface-variant);
}
</style>
