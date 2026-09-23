<script setup lang="ts">
import type { AlertaDeEstoque } from '../services/dashboard.api'

defineProps<{ alertas: AlertaDeEstoque[] }>()
</script>

<template>
  <div v-for="alerta in alertas" :key="alerta.nome" class="banner">
    <span class="icone">⚠</span>
    <div class="texto">
      <strong>Estoque baixo:</strong> {{ alerta.nome }} — restam {{ alerta.quantidadeAtual
      }}{{ alerta.unidade }}. Reposição sugerida ainda hoje.
    </div>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 14px;
  background: var(--cor-error-container);
  border: 1px solid var(--cor-error);
}

.icone {
  color: var(--cor-error);
  font-size: 18px;
}

.texto {
  font-size: 13px;
  color: var(--cor-on-error-container);
}
</style>
