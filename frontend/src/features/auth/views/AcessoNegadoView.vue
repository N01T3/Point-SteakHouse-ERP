<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../auth/store/auth.store'

const store = useAuthStore()
</script>

<template>
  <div class="pagina">
    <div class="titulo">Acesso negado</div>
    <p class="texto">Seu cargo não tem permissão para abrir esta área.</p>
    <RouterLink :to="store.usuario?.rotaInicial ?? '/'" class="botao">Voltar para minha área</RouterLink>
  </div>
</template>

<style scoped>
.pagina {
  padding: 60px 44px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 560px;
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
  margin: 0;
}

.botao {
  align-self: flex-start;
  padding: 11px 18px;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-size: 14px;
  font-weight: 600;
}
</style>
