<script setup lang="ts">
defineProps<{ titulo: string }>()
defineEmits<{ fechar: [] }>()
</script>

<template>
  <div class="fundo" @click.self="$emit('fechar')">
    <div class="modal">
      <div class="cabecalho">
        <div class="titulo">{{ titulo }}</div>
        <button class="botao-fechar" type="button" @click="$emit('fechar')">✕</button>
      </div>
      <div class="conteudo">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fundo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 420px;
  max-height: 85vh;
  overflow-y: auto;
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
  align-items: center;
  justify-content: space-between;
}

.titulo {
  font-family: var(--fonte-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--cor-on-surface);
}

.botao-fechar {
  border: none;
  background: none;
  color: var(--cor-on-surface-variant);
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
}

.conteudo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
