<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from './features/auth/store/auth.store'
import LoginView from './features/auth/views/LoginView.vue'
import MenuLateral from './shared/components/MenuLateral.vue'
import { modoAmostraOnline } from './features/auth/services/auth.mock'
import { siteExpirado } from './shared/amostra/prazo-do-site'
import { useModoDetalhado } from './shared/composables/useModoDetalhado'
import { useTema } from './shared/composables/useTema'

const store = useAuthStore()
const route = useRoute()
const { lgAndUp } = useDisplay()
const { modo, podeDetalhar, definir } = useModoDetalhado()
const { modoEscuro, alternar } = useTema()

const menuAberto = ref(true)
const conteudo = ref<HTMLElement | null>(null)
// Sessão aberta quando o prazo estoura: derruba tudo na próxima checagem.
const amostraEncerrada = ref(false)
let vigiaPrazo: number | undefined

onMounted(() => {
  if (!modoAmostraOnline()) return
  vigiaPrazo = window.setInterval(() => {
    if (siteExpirado()) {
      amostraEncerrada.value = true
      store.sair()
      window.clearInterval(vigiaPrazo)
    }
  }, 30000)
})

onUnmounted(() => {
  if (vigiaPrazo !== undefined) window.clearInterval(vigiaPrazo)
})

function fecharMenu(): void {
  menuAberto.value = false
}

function alternarMenu(): void {
  menuAberto.value = !menuAberto.value
}

// Desktop abre com o menu visível; mobile abre com ele recolhido
watch(
  lgAndUp,
  (desktop) => {
    menuAberto.value = desktop
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    if (!lgAndUp.value) menuAberto.value = false
    void nextTick(() => conteudo.value?.focus({ preventScroll: true }))
  },
)

const tituloRota = computed(() => (route.meta.titulo as string | undefined) ?? 'Point Steak House')
</script>

<template>
  <div v-if="amostraEncerrada" class="encerrada">
    <div class="encerrada-cartao">
      <div class="encerrada-titulo">Point Steak House — demonstração encerrada</div>
      <p class="encerrada-texto">O período de avaliação terminou. Fale com o responsável para agendar uma nova amostra.</p>
    </div>
  </div>
  <LoginView v-else-if="!store.autenticado" />
  <v-app v-else>
    <MenuLateral v-model="menuAberto" @navegar="fecharMenu" />

    <v-app-bar flat density="comfortable" border>
      <v-app-bar-nav-icon aria-label="Abrir ou recolher menu" @click="alternarMenu" />
      <v-app-bar-title class="font-weight-bold">{{ tituloRota }}</v-app-bar-title>
      <template #append>
        <div v-if="podeDetalhar()" class="d-none d-md-flex align-center mr-2">
          <v-btn-toggle
            :model-value="modo"
            density="compact"
            rounded="xl"
            border
            @update:model-value="(v) => v && definir(v as 'simples' | 'detalhado')"
          >
            <v-btn value="simples" size="small">Simples</v-btn>
            <v-btn value="detalhado" size="small">Detalhes</v-btn>
          </v-btn-toggle>
        </div>
        <v-btn
          :icon="modoEscuro ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          variant="text"
          :aria-label="modoEscuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
          @click="alternar"
        />
      </template>
    </v-app-bar>

    <v-main>
      <main ref="conteudo" tabindex="-1" aria-label="Conteúdo principal" class="outline-none">
        <RouterView v-slot="{ Component }">
          <transition name="m3-page" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </v-main>

    <v-bottom-navigation v-if="store.autenticado" class="d-lg-none" grow density="comfortable">
      <v-btn value="mercado" prepend-icon="mdi-storefront" to="/mercado">Mercado</v-btn>
      <v-btn value="acougue" prepend-icon="mdi-food-steak" to="/acougueiro">Açougue</v-btn>
      <v-btn value="estoque" prepend-icon="mdi-package-variant" to="/estoque">Estoque</v-btn>
      <v-btn value="mais" prepend-icon="mdi-menu" @click="menuAberto = true">Mais</v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<style scoped>
.outline-none {
  outline: none;
}

.encerrada {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--cor-bg);
}

.encerrada-cartao {
  max-width: 420px;
  text-align: center;
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 32px;
}

.encerrada-titulo {
  font-family: var(--fonte-display);
  font-size: 22px;
  font-weight: 600;
  color: var(--cor-on-surface);
  margin-bottom: 12px;
}

.encerrada-texto {
  font-size: 14px;
  color: var(--cor-on-surface-variant);
  margin: 0;
}
</style>
