<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './features/auth/store/auth.store'
import LoginView from './features/auth/views/LoginView.vue'
import MenuLateral from './shared/components/MenuLateral.vue'
import { useModoDetalhado } from './shared/composables/useModoDetalhado'

const store = useAuthStore()
const route = useRoute()
const { modo, podeDetalhar, definir } = useModoDetalhado()

const menuAberto = ref(false)
const conteudo = ref<HTMLElement | null>(null)

function fecharMenu(): void {
  menuAberto.value = false
}

// Fecha o drawer e leva o foco ao conteúdo a cada troca de tela
watch(
  () => route.fullPath,
  () => {
    menuAberto.value = false
    void nextTick(() => conteudo.value?.focus({ preventScroll: true }))
  },
)
</script>

<template>
  <LoginView v-if="!store.autenticado" />
  <div v-else class="app">
    <div
      v-if="menuAberto"
      class="fundo-menu"
      aria-hidden="true"
      @click="fecharMenu"
    />
    <MenuLateral :aberto="menuAberto" @navegar="fecharMenu" />
    <div class="coluna">
      <div class="barra-topo" :class="{ 'sem-modo': !podeDetalhar() }">
        <button type="button" class="botao-menu" aria-label="Abrir menu" @click="menuAberto = true">☰</button>
        <span class="marca-movel">Point Steak House</span>
        <div v-if="podeDetalhar()" class="segmentado-modo" role="group" aria-label="Modo de visualização">
          <button type="button" :class="{ ativo: modo === 'simples' }" @click="definir('simples')">Simples</button>
          <button type="button" :class="{ ativo: modo === 'detalhado' }" @click="definir('detalhado')">Detalhes</button>
        </div>
      </div>
      <main ref="conteudo" class="conteudo" tabindex="-1" aria-label="Conteúdo principal">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  background: var(--cor-bg);
  color: var(--cor-on-bg);
}

.coluna {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.conteudo {
  flex-grow: 1;
  width: 100%;
  max-width: 1360px;
  outline: none;
}

.barra-topo {
  display: none;
}

.fundo-menu {
  display: none;
}

@media (max-width: 900px) {
  .app {
    flex-direction: column;
  }

  .coluna {
    width: 100%;
  }

  .barra-topo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--cor-surface);
    border-bottom: 1px solid var(--cor-outline);
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .botao-menu {
    border: 1px solid var(--cor-outline);
    background: var(--cor-bg);
    color: var(--cor-on-surface);
    border-radius: 10px;
    min-width: 44px;
    min-height: 44px;
    font-size: 20px;
    cursor: pointer;
  }

  .marca-movel {
    font-family: 'Bodoni Moda', serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--cor-on-surface);
    flex: 1;
  }

  .segmentado-modo {
    display: flex;
    border: 1px solid var(--cor-outline);
    border-radius: 100px;
    overflow: hidden;
  }

  .segmentado-modo button {
    border: none;
    background: transparent;
    padding: 10px 14px;
    min-height: 44px;
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--cor-on-surface-variant);
    cursor: pointer;
  }

  .segmentado-modo button.ativo {
    background: var(--cor-primary-container);
    color: var(--cor-on-primary-container);
  }

  .fundo-menu {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 48;
  }
}

/* Desktop: só a alternância de modo do Proprietário, discreta no topo */
@media (min-width: 901px) {
  .barra-topo {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 10px 44px 0;
    background: transparent;
  }

  .barra-topo.sem-modo {
    display: none;
  }

  .botao-menu,
  .marca-movel {
    display: none;
  }

  .segmentado-modo {
    display: flex;
    border: 1px solid var(--cor-outline);
    border-radius: 100px;
    overflow: hidden;
    background: var(--cor-surface);
  }

  .segmentado-modo button {
    border: none;
    background: transparent;
    padding: 8px 14px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: var(--cor-on-surface-variant);
    cursor: pointer;
  }

  .segmentado-modo button.ativo {
    background: var(--cor-primary-container);
    color: var(--cor-on-primary-container);
  }
}
</style>
