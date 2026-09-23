<script setup lang="ts">
import { ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useMercadoStore } from '../store/mercado.store'
import type { DestinoDevolucao, Venda } from '../tipos'

const props = defineProps<{ venda: Venda }>()
const emit = defineEmits<{ fechar: []; concluida: [] }>()

const store = useMercadoStore()
const { formatarMoeda } = useFormatador()

const quantidades = ref<Record<string, number>>({})
const motivo = ref('')
const destino = ref<DestinoDevolucao>('VENDAVEL')
const erro = ref('')

function confirmar(): void {
  erro.value = ''
  try {
    store.devolver(
      props.venda.id,
      props.venda.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: quantidades.value[item.produtoId] ?? 0,
      })),
      motivo.value,
      destino.value,
      store.turno?.operador ?? 'operador',
    )
    emit('concluida')
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível devolver.'
  }
}
</script>

<template>
  <v-dialog :model-value="true" max-width="480" @update:model-value="(v) => !v && emit('fechar')">
    <v-card rounded="xl">
      <v-card-title>Devolver venda #{{ venda.numero }}</v-card-title>
      <v-card-text class="d-flex flex-column ga-3">
        <v-list>
          <v-list-item v-for="item in venda.itens" :key="item.produtoId">
            <v-list-item-title>{{ item.nome }}</v-list-item-title>
            <v-list-item-subtitle
              >vendido: {{ item.quantidade }} - {{ formatarMoeda(item.precoUnitario) }}</v-list-item-subtitle
            >
            <template #append>
              <v-text-field
                v-model.number="quantidades[item.produtoId]"
                type="number"
                min="0"
                :max="item.quantidade"
                label="Qtd"
                density="compact"
                style="max-width: 100px"
              />
            </template>
          </v-list-item>
        </v-list>
        <v-text-field
          v-model="motivo"
          label="Motivo (obrigatorio)"
          placeholder="ex.: cliente desistiu, avaria"
        />
        <v-select
          v-model="destino"
          label="Destino dos produtos"
          :items="[
            { title: 'Vendavel - volta ao estoque', value: 'VENDAVEL' },
            { title: 'Quarentena - aguardar conferencia', value: 'QUARENTENA' },
            { title: 'Descarte - perda registrada', value: 'DESCARTE' },
          ]"
        />
        <v-alert v-if="erro" type="error" variant="tonal" density="compact">{{ erro }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="outlined" rounded="xl" @click="emit('fechar')">Voltar</v-btn>
        <v-btn color="primary" variant="flat" rounded="xl" @click="confirmar">Confirmar devolucao</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
