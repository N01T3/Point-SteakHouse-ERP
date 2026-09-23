<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../../features/auth/store/auth.store'
import { filtrarMenuPorPapel, ROTULO_DO_PAPEL } from '../../shared/tipos/papel'

const props = defineProps<{ modelValue?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'navegar'): void }>()

const store = useAuthStore()
const router = useRouter()
const { lgAndUp } = useDisplay()

const itens = computed(() => (store.papel ? filtrarMenuPorPapel(store.papel) : []))
const rotuloPapel = computed(() => (store.papel ? ROTULO_DO_PAPEL[store.papel] : ''))

const ICONE_POR_ROTA: Record<string, string> = {
  dashboard: 'mdi-view-dashboard',
  mercado: 'mdi-storefront',
  acougueiro: 'mdi-food-steak',
  maturacao: 'mdi-snowflake',
  'seguranca-biologica': 'mdi-shield-check',
  'desossa-subprodutos': 'mdi-knife',
  clientes: 'mdi-account-group',
  estoque: 'mdi-package-variant',
  financeiro: 'mdi-cash-register',
  administrador: 'mdi-cog',
  acesso: 'mdi-key-chain',
  configuracoes: 'mdi-tune',
}

async function sair(): Promise<void> {
  store.sair()
  await router.push('/')
}

function fechar(): void {
  emit('update:modelValue', false)
  emit('navegar')
}
</script>

<template>
  <v-navigation-drawer
    :model-value="props.modelValue ?? true"
    :temporary="!lgAndUp"
    width="280"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <v-list-item class="py-4">
      <v-list-item-title class="text-h6 font-weight-bold fonte-marca">Point Steak House</v-list-item-title>
    </v-list-item>

    <v-divider />

    <v-list density="comfortable" nav>
      <v-list-item
        v-for="item in itens"
        :key="item.rota"
        :to="{ name: item.rota }"
        :prepend-icon="ICONE_POR_ROTA[item.rota] ?? 'mdi-circle-small'"
        :title="item.titulo"
        rounded="lg"
        @click="fechar"
      />
    </v-list>

    <template #append>
      <v-divider />
      <v-card variant="tonal" class="ma-3" rounded="xl">
        <v-card-text class="d-flex align-center justify-space-between">
          <div>
            <div class="font-weight-bold text-body-2">{{ store.usuario?.nome }}</div>
            <div class="text-caption text-medium-emphasis">{{ rotuloPapel }}</div>
          </div>
          <v-btn size="small" variant="outlined" rounded="xl" prepend-icon="mdi-logout" @click="sair"
            >Sair</v-btn
          >
        </v-card-text>
      </v-card>
    </template>
  </v-navigation-drawer>
</template>
