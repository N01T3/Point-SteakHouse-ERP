<script setup lang="ts">
import { computed, ref } from 'vue'
import { gerarHtmlCupom, gerarTextoCupom } from '../logica/cupom'
import { useMercadoStore } from '../store/mercado.store'
import type { Venda } from '../tipos'

const props = defineProps<{ venda: Venda; novidade?: boolean }>()
const emit = defineEmits<{ fechar: [] }>()

const store = useMercadoStore()
const erro = ref('')

const texto = computed(() => gerarTextoCupom(props.venda))

function imprimir(): void {
  erro.value = ''
  try {
    if (!props.novidade) store.registrarReimpressao(props.venda.id)
    const janela = window.open('', '_blank', 'width=320,height=600')
    if (!janela) throw new Error('Bloqueador de pop-up impediu a impressão.')
    janela.document.write(gerarHtmlCupom(props.venda))
    janela.document.close()
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível imprimir.'
  }
}
</script>

<template>
  <v-dialog :model-value="true" max-width="440" @update:model-value="(v) => !v && emit('fechar')">
    <v-card rounded="xl">
      <v-card-title>Cupom - venda #{{ venda.numero }}</v-card-title>
      <v-card-text>
        <div v-if="!novidade && (venda.reimpressoes ?? 0) > 0" class="text-caption text-medium-emphasis mb-2">
          Reimpressoes registradas: {{ venda.reimpressoes }}
        </div>
        <v-sheet
          rounded="lg"
          border
          class="pa-4 text-body-2"
          style="font-family: monospace; white-space: pre-wrap"
          >{{ texto }}</v-sheet
        >
        <v-alert v-if="erro" type="error" variant="tonal" density="compact" class="mt-3">{{ erro }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="outlined" rounded="xl" @click="emit('fechar')">{{
          novidade ? 'Nova venda' : 'Fechar'
        }}</v-btn>
        <v-btn color="primary" variant="flat" rounded="xl" prepend-icon="mdi-printer" @click="imprimir"
          >Imprimir</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
