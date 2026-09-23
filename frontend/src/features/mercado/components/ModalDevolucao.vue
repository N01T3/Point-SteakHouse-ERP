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
      props.venda.itens.map((item) => ({ produtoId: item.produtoId, quantidade: quantidades.value[item.produtoId] ?? 0 })),
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
  <div class="fundo" @click.self="emit('fechar')">
    <div class="modal" role="dialog" aria-label="Devolução">
      <div class="titulo">Devolver venda #{{ venda.numero }}</div>

      <div v-for="item in venda.itens" :key="item.produtoId" class="linha">
        <div>
          <div class="nome">{{ item.nome }}</div>
          <div class="detalhe">vendido: {{ item.quantidade }} · {{ formatarMoeda(item.precoUnitario) }}</div>
        </div>
        <input
          v-model.number="quantidades[item.produtoId]"
          type="number"
          min="0"
          :max="item.quantidade"
          :step="item.unidade === 'KG' ? '0.001' : '1'"
          placeholder="0"
        />
      </div>

      <label class="campo">
        <span>Motivo (obrigatório)</span>
        <input v-model="motivo" type="text" placeholder="ex.: cliente desistiu, avaria…" />
      </label>

      <label class="campo">
        <span>Destino dos produtos</span>
        <select v-model="destino">
          <option value="VENDAVEL">Vendável — volta ao estoque</option>
          <option value="QUARENTENA">Quarentena — aguardar conferência</option>
          <option value="DESCARTE">Descarte — perda registrada</option>
        </select>
      </label>

      <div v-if="erro" class="erro" role="alert">{{ erro }}</div>

      <div class="acoes">
        <button type="button" class="botao-secundario" @click="emit('fechar')">Voltar</button>
        <button type="button" class="botao-primario" @click="confirmar">Confirmar devolução</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fundo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}

@media (min-width: 640px) {
  .fundo {
    align-items: center;
    padding: 24px;
  }
}

.modal {
  width: min(440px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  background: var(--cor-surface);
  border-radius: 20px 20px 0 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (min-width: 640px) {
  .modal {
    border-radius: 20px;
  }
}

.titulo {
  font-family: 'Bodoni Moda', serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--cor-on-surface);
}

.linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.nome {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.detalhe {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.linha input {
  width: 90px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.campo input,
.campo select {
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
}

.erro {
  font-size: 13px;
  color: var(--cor-error);
}

.acoes {
  display: flex;
  gap: 8px;
}

.botao-primario {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.botao-secundario {
  padding: 12px 18px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
