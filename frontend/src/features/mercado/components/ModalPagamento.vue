<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { calcularTroco, fiadoDisponivel } from '../logica/mercado'
import { useMercadoStore } from '../store/mercado.store'
import type { FormaPagamento, PagamentoVenda, ParcelaPagamento } from '../tipos'

const props = defineProps<{ total: number }>()
const emit = defineEmits<{
  fechar: []
  confirmar: [pagamento: PagamentoVenda]
}>()

const store = useMercadoStore()
const { formatarMoeda } = useFormatador()

const modo = ref<'avista' | 'dividido'>('avista')
const forma = ref<FormaPagamento>('DINHEIRO')
const recebido = ref<number | null>(null)
const clienteId = ref('')
const erro = ref('')

const parcelas = ref<Array<{ forma: FormaPagamento; valor: number | null }>>([
  { forma: 'CARTAO', valor: null },
  { forma: 'DINHEIRO', valor: null },
])
const recebidoDividido = ref<number | null>(null)

const ROTULO_FORMA: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão',
  PIX: 'PIX',
  FIADO: 'Fiado',
}

const troco = computed(() =>
  forma.value === 'DINHEIRO' && recebido.value !== null ? calcularTroco(props.total, recebido.value) : null,
)
const cliente = computed(() => store.clientes.find((c) => c.id === clienteId.value) ?? null)

const somaParcelas = computed(() =>
  Math.round(parcelas.value.reduce((soma, p) => soma + (p.valor ?? 0), 0) * 100) / 100,
)
const restante = computed(() => Math.round((props.total - somaParcelas.value) * 100) / 100)
const temDinheiroDividido = computed(() => parcelas.value.some((p) => p.forma === 'DINHEIRO'))
const valorDinheiroDividido = computed(() =>
  Math.round(parcelas.value.filter((p) => p.forma === 'DINHEIRO').reduce((soma, p) => soma + (p.valor ?? 0), 0) * 100) / 100,
)
const trocoDividido = computed(() =>
  recebidoDividido.value !== null ? calcularTroco(valorDinheiroDividido.value, recebidoDividido.value) : null,
)
const temFiadoDividido = computed(() => parcelas.value.some((p) => p.forma === 'FIADO'))

function adicionarParcela(): void {
  parcelas.value.push({ forma: 'PIX', valor: null })
}

function removerParcela(indice: number): void {
  if (parcelas.value.length > 2) parcelas.value.splice(indice, 1)
}

function confirmar(): void {
  erro.value = ''
  if (modo.value === 'dividido') {
    if (temFiadoDividido.value && !cliente.value) {
      erro.value = 'Parcela em fiado exige cliente selecionado.'
      return
    }
    const lista: ParcelaPagamento[] = []
    for (const p of parcelas.value) {
      if (p.valor === null || !(p.valor > 0)) {
        erro.value = 'Informe valor maior que zero em todas as parcelas.'
        return
      }
      lista.push({
        forma: p.forma,
        valor: Math.round(p.valor * 100) / 100,
        ...(p.forma === 'FIADO' && cliente.value ? { clienteId: cliente.value.id } : {}),
      })
    }
    if (Math.abs(somaParcelas.value - props.total) > 0.005) {
      erro.value = `Parcelas somam ${formatarMoeda(somaParcelas.value)} — falta ${formatarMoeda(restante.value)}.`
      return
    }
    if (temDinheiroDividido.value) {
      if (recebidoDividido.value === null || trocoDividido.value === null) {
        erro.value = 'Informe o valor recebido em dinheiro.'
        return
      }
    }
    emit('confirmar', {
      forma: 'DIVIDIDO',
      parcelas: lista,
      ...(temDinheiroDividido.value
        ? { valorRecebido: recebidoDividido.value as number, troco: trocoDividido.value as number }
        : {}),
      ...(temFiadoDividido.value && cliente.value ? { clienteId: cliente.value.id } : {}),
    })
    return
  }
  if (forma.value === 'DINHEIRO') {
    if (recebido.value === null || troco.value === null) {
      erro.value = 'Informe um valor recebido maior ou igual ao total.'
      return
    }
    emit('confirmar', { forma: 'DINHEIRO', valorRecebido: recebido.value, troco: troco.value })
  } else if (forma.value === 'FIADO') {
    if (!cliente.value) {
      erro.value = 'Selecione o cliente do fiado.'
      return
    }
    emit('confirmar', { forma: 'FIADO', clienteId: cliente.value.id })
  } else {
    emit('confirmar', { forma: forma.value })
  }
}
</script>

<template>
  <div class="fundo" @click.self="emit('fechar')">
    <div class="modal" role="dialog" aria-label="Pagamento">
      <div class="titulo">Pagamento · {{ formatarMoeda(total) }}</div>

      <div class="segmentado">
        <button type="button" :class="{ ativo: modo === 'avista' }" @click="modo = 'avista'">À vista</button>
        <button type="button" :class="{ ativo: modo === 'dividido' }" @click="modo = 'dividido'">Dividido</button>
      </div>

      <template v-if="modo === 'avista'">
      <div class="formas">
        <button
          v-for="opcao in (['DINHEIRO', 'CARTAO', 'PIX', 'FIADO'] as FormaPagamento[])"
          :key="opcao"
          type="button"
          class="forma"
          :class="{ ativa: forma === opcao }"
          @click="forma = opcao"
        >
          {{ ROTULO_FORMA[opcao] }}
        </button>
      </div>

      <label v-if="forma === 'DINHEIRO'" class="campo">
        <span>Valor recebido</span>
        <input v-model.number="recebido" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00" />
      </label>
      <div v-if="forma === 'DINHEIRO' && troco !== null" class="troco">Troco: {{ formatarMoeda(troco) }}</div>

      <label v-if="forma === 'FIADO'" class="campo">
        <span>Cliente</span>
        <select v-model="clienteId">
          <option value="" disabled>Selecionar cliente…</option>
          <option v-for="c in store.clientes" :key="c.id" :value="c.id">
            {{ c.nome }} — disponível {{ formatarMoeda(fiadoDisponivel(c)) }}
          </option>
        </select>
      </label>
      </template>

      <template v-else>
        <div v-for="(parcela, indice) in parcelas" :key="indice" class="parcela">
          <select v-model="parcela.forma" aria-label="Forma da parcela">
            <option v-for="(rotulo, valor) in ROTULO_FORMA" :key="valor" :value="valor">{{ rotulo }}</option>
          </select>
          <input v-model.number="parcela.valor" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00" />
          <button
            v-if="parcelas.length > 2"
            type="button"
            class="link"
            @click="removerParcela(indice)"
          >
            ×
          </button>
        </div>
        <button type="button" class="link" @click="adicionarParcela">+ adicionar forma</button>
        <div class="restante" :class="{ ok: restante === 0 }">Restante: {{ formatarMoeda(restante) }}</div>

        <label v-if="temDinheiroDividido" class="campo">
          <span>Recebido em dinheiro</span>
          <input v-model.number="recebidoDividido" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00" />
        </label>
        <div v-if="temDinheiroDividido && trocoDividido !== null" class="troco">Troco: {{ formatarMoeda(trocoDividido) }}</div>

        <label v-if="temFiadoDividido" class="campo">
          <span>Cliente do fiado</span>
          <select v-model="clienteId">
            <option value="" disabled>Selecionar cliente…</option>
            <option v-for="c in store.clientes" :key="c.id" :value="c.id">
              {{ c.nome }} — disponível {{ formatarMoeda(fiadoDisponivel(c)) }}
            </option>
          </select>
        </label>
      </template>

      <div v-if="erro" class="erro" role="alert">{{ erro }}</div>

      <div class="acoes">
        <button type="button" class="botao-secundario" @click="emit('fechar')">Voltar</button>
        <button type="button" class="botao-primario" @click="confirmar">Confirmar venda</button>
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
  gap: 16px;
}

@media (min-width: 640px) {
  .modal {
    border-radius: 20px;
  }
}

.titulo {
  font-family: 'Bodoni Moda', serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--cor-on-surface);
}

.formas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.forma {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.forma.ativa {
  border-color: var(--cor-primary);
  background: var(--cor-primary-container);
  color: var(--cor-on-primary-container);
}

.segmentado {
  display: flex;
  border: 1px solid var(--cor-outline);
  border-radius: 100px;
  overflow: hidden;
}

.segmentado button {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--cor-on-surface-variant);
  cursor: pointer;
}

.segmentado button.ativo {
  background: var(--cor-primary-container);
  color: var(--cor-on-primary-container);
}

.parcela {
  display: flex;
  gap: 8px;
  align-items: center;
}

.parcela select,
.parcela input {
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
}

.parcela select {
  flex: 1;
  min-width: 0;
}

.parcela input {
  width: 110px;
}

.link {
  background: none;
  border: none;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--cor-primary);
  cursor: pointer;
  align-self: flex-start;
}

.restante {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-error);
}

.restante.ok {
  color: var(--cor-success);
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
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 15px;
}

.troco {
  font-size: 16px;
  font-weight: 700;
  color: var(--cor-success);
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
  padding: 13px;
  border: none;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.botao-secundario {
  padding: 13px 18px;
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
