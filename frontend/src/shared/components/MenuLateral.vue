<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../features/auth/store/auth.store'
import { ROTULO_DO_PAPEL, filtrarMenuPorPapel } from '../../shared/tipos/papel'

defineProps<{ aberto?: boolean }>()
const emit = defineEmits<{ navegar: [] }>()

const store = useAuthStore()
const router = useRouter()

const itens = computed(() => (store.papel ? filtrarMenuPorPapel(store.papel) : []))
const rotuloPapel = computed(() => (store.papel ? ROTULO_DO_PAPEL[store.papel] : ''))

async function sair(): Promise<void> {
  store.sair()
  await router.push('/')
}
</script>

<template>
  <nav class="menu" :class="{ aberto }" aria-label="Menu principal">
    <div class="cabecalho">
      <div class="marca">Point Steak House</div>
    </div>

    <div class="itens">
      <RouterLink
        v-for="item in itens"
        :key="item.rota"
        :to="{ name: item.rota }"
        class="item"
        active-class="ativo"
        @click="emit('navegar')"
      >
        {{ item.titulo }}
      </RouterLink>
    </div>

    <div class="rodape">
      <div class="usuario">
        <strong>{{ store.usuario?.nome }}</strong>
        <span>{{ rotuloPapel }}</span>
      </div>
      <button type="button" class="botao-sair" @click="sair">Sair</button>
    </div>
  </nav>
</template>

<style scoped>
.menu {
  width: 264px;
  flex-shrink: 0;
  background: var(--cor-surface);
  border-right: 1px solid var(--cor-outline);
  display: flex;
  flex-direction: column;
  padding: 28px 18px;
}

.cabecalho {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 10px 28px;
}

.marca {
  font-family: 'Bodoni Moda', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--cor-on-surface);
}

.itens {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 10px;
  color: var(--cor-on-surface-variant);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.item.ativo {
  background: var(--cor-primary-container);
  color: var(--cor-on-primary-container);
  font-weight: 600;
}

.rodape {
  margin-top: auto;
  padding: 14px 12px;
  border-radius: 10px;
  background: var(--cor-surface-variant);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.usuario {
  display: flex;
  flex-direction: column;
  font-size: 12.5px;
  color: var(--cor-on-surface);
  line-height: 1.4;
}

.usuario span {
  font-size: 11px;
  color: var(--cor-on-surface-variant);
}

.botao-sair {
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  border-radius: 100px;
  padding: 6px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 900px) {
  .menu {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 50;
    width: min(300px, 84vw);
    transform: translateX(-105%);
    transition: transform 0.2s ease;
    box-shadow: none;
  }

  .menu.aberto {
    transform: translateX(0);
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.2);
  }

  .item {
    min-height: 44px;
  }
}
</style>
