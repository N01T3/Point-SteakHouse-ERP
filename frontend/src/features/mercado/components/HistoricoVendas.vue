<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { useMercadoStore } from '../store/mercado.store'
import { useClientesStore } from '../../clientes/store/clientes.store'
import type { Venda } from '../tipos'
import CupomVenda from './CupomVenda.vue'
import ModalDevolucao from './ModalDevolucao.vue'

const store = useMercadoStore()
const clientesStore = useClientesStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const devolvendo = ref<Venda | null>(null)
const vendoCupom = ref<Venda | null>(null)
const cancelando = ref<Venda | null>(null)
const motivoCancelamento = ref('')
const erro = ref('')

const podeEstornar = computed(() => auth.temPermissao('caixa.estornar'))

const ROTULO_FORMA: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão',
  PIX: 'PIX',
  FIADO: 'Fiado',
  DIVIDIDO: 'Dividido',
}

const ROTULO_ESTADO: Record<string, string> = {
  CONCLUIDA: 'concluída',
  DEVOLVIDA_PARCIAL: 'devolução parcial',
  DEVOLVIDA_TOTAL: 'devolvida',
  CANCELADA: 'cancelada',
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function confirmarCancelamento(): void {
  erro.value = ''
  try {
    if (!cancelando.value) return
    const venda = cancelando.value
    const operador = auth.usuario?.nome ?? 'operador'
    store.cancelarVenda(venda.id, motivoCancelamento.value, operador)
    if (venda.valorFiado > 0) {
      const id = venda.pagamento.clienteId ?? venda.pagamento.parcelas?.find((p) => p.forma === 'FIADO')?.clienteId
      if (id) clientesStore.estornarVendaFiado(id, venda.valorFiado, venda.numero, operador, motivoCancelamento.value)
    }
    cancelando.value = null
    motivoCancelamento.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível cancelar.'
  }
}
</script>

<template>
  <div class="historico">
    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
    <div v-if="store.vendas.length === 0" class="vazio">Nenhuma venda neste turno ainda.</div>

    <div v-for="venda in store.vendas" :key="venda.id" class="cartao" :class="{ cancelada: venda.estado === 'CANCELADA' }">
      <div class="linha-topo">
        <strong>#{{ venda.numero }} · {{ hora(venda.criadaEm) }}</strong>
        <span class="estado">{{ ROTULO_ESTADO[venda.estado] }}</span>
      </div>
      <div class="detalhe">
        {{ venda.itens.map((i) => `${i.nome} × ${i.quantidade}`).join(' · ') }}
      </div>
      <div v-if="venda.estado === 'CANCELADA' && venda.motivoCancelamento" class="detalhe">
        Motivo: {{ venda.motivoCancelamento }}{{ venda.canceladaPor ? ` · por ${venda.canceladaPor}` : '' }}
      </div>
      <div class="linha-base">
        <span>{{ ROTULO_FORMA[venda.pagamento.forma] }}{{ venda.pagamento.clienteNome ? ` · ${venda.pagamento.clienteNome}` : '' }}</span>
        <strong>{{ formatarMoeda(venda.total) }}</strong>
      </div>
      <div class="linha-base">
        <span v-if="!venda.sincronizada" class="pendente">pendente de sincronização</span>
        <span v-else></span>
        <span class="acoes">
          <button type="button" class="link" @click="vendoCupom = venda">
            cupom{{ (venda.reimpressoes ?? 0) > 0 ? ` (${venda.reimpressoes})` : '' }}
          </button>
          <button
            v-if="venda.estado === 'CONCLUIDA'"
            type="button"
            class="link"
            @click="devolvendo = venda"
          >
            devolver
          </button>
          <button
            v-if="venda.estado === 'CONCLUIDA' && podeEstornar"
            type="button"
            class="link perigo"
            @click="cancelando = venda; motivoCancelamento = ''"
          >
            cancelar
          </button>
        </span>
      </div>
    </div>

    <ModalDevolucao
      v-if="devolvendo"
      :venda="devolvendo"
      @fechar="devolvendo = null"
      @concluida="devolvendo = null"
    />

    <div v-if="cancelando" class="fundo" @click.self="cancelando = null">
      <div class="modal" role="dialog" aria-label="Cancelar venda">
        <div class="titulo">Cancelar venda #{{ cancelando.numero }}</div>
        <p class="texto">O estoque volta ao lote e o fiado é estornado. O histórico é preservado.</p>
        <label class="campo">
          <span>Motivo (obrigatório)</span>
          <input v-model="motivoCancelamento" type="text" placeholder="ex.: erro de bipagem, desistência…" />
        </label>
        <div class="acoes-modal">
          <button type="button" class="botao-secundario" @click="cancelando = null">Voltar</button>
          <button type="button" class="botao-primario" @click="confirmarCancelamento">Confirmar cancelamento</button>
        </div>
      </div>
    </div>

    <CupomVenda
      v-if="vendoCupom"
      :venda="vendoCupom"
      @fechar="vendoCupom = null"
    />
  </div>
</template>

<style scoped>
.historico {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vazio {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cartao.cancelada {
  opacity: 0.75;
}

.erro {
  font-size: 13px;
  color: var(--cor-error);
  background: var(--cor-error-container);
  border-radius: 10px;
  padding: 10px 14px;
}

.linha-topo {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--cor-on-surface);
}

.estado {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.detalhe {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.linha-base {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--cor-on-surface);
}

.pendente {
  font-size: 12px;
  font-weight: 600;
  color: var(--cor-error);
}

.link {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--cor-primary);
  cursor: pointer;
}

.link.perigo {
  color: var(--cor-error);
}

.acoes {
  display: flex;
  gap: 12px;
}

.fundo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 60;
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

.texto {
  margin: 0;
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.campo input {
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
}

.acoes-modal {
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
