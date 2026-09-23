<script setup lang="ts">
import BarraDeProgresso from '../../../shared/components/BarraDeProgresso.vue'
import type { PecaEmMaturacao } from '../services/dashboard.api'

defineProps<{ pecas: PecaEmMaturacao[] }>()
</script>

<template>
  <div class="cartao">
    <div class="cabecalho">
      <div class="titulo">Câmara de maturação</div>
      <RouterLink :to="{ name: 'maturacao' }" class="ver-tudo">ver tudo →</RouterLink>
    </div>
    <div class="lista">
      <div v-for="peca in pecas" :key="peca.nome" class="item">
        <div class="linha">
          <span class="nome">{{ peca.nome }}</span>
          <span class="dias">{{ peca.diasAtual }}/{{ peca.diasTotal }} dias</span>
        </div>
        <BarraDeProgresso
          :percentual="peca.progressoPercentual"
          :cor="peca.tipo === 'wet_aged' ? 'var(--cor-secondary)' : 'var(--cor-primary)'"
          altura="6px"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cabecalho {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.titulo {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.ver-tudo {
  font-size: 12px;
  font-weight: 600;
  color: var(--cor-primary);
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.linha {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--cor-on-surface);
}

.nome {
  font-weight: 600;
}

.dias {
  color: var(--cor-on-surface-variant);
}
</style>
