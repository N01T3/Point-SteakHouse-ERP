<script setup lang="ts">
import { computed } from 'vue'
import BarraDeProgresso from '../../../shared/components/BarraDeProgresso.vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import type { CorteMaisVendido } from '../services/dashboard.api'

const props = defineProps<{ cortes: CorteMaisVendido[] }>()
const { formatarMoeda } = useFormatador()

const kgMaximo = computed(() => Math.max(1, ...props.cortes.map((corte) => corte.kg)))
</script>

<template>
  <div class="cartao">
    <div class="titulo">Cortes mais vendidos — semana</div>
    <div class="lista">
      <div v-for="corte in cortes" :key="corte.corteNome" class="item">
        <div class="linha">
          <span class="nome">{{ corte.corteNome }}</span>
          <span class="detalhe">{{ corte.kg.toFixed(0) }} kg · {{ formatarMoeda(corte.receita) }}</span>
        </div>
        <BarraDeProgresso :percentual="(corte.kg / kgMaximo) * 100" />
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

.titulo {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
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
  font-size: 13px;
  color: var(--cor-on-surface);
}

.nome {
  font-weight: 600;
}

.detalhe {
  color: var(--cor-on-surface-variant);
}
</style>
