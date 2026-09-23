<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { useClientesStore } from '../../clientes/store/clientes.store'
import { bloqueioDeVenda, loteParaVenda } from '../logica/mercado'
import { resolverBipe } from '../logica/resolucaoBipe'
import { emitirBipe } from '../logica/sinalSonoro'
import { useMercadoStore } from '../store/mercado.store'
import type { PagamentoVenda, ProdutoMercado, Venda } from '../tipos'
import CupomVenda from './CupomVenda.vue'
import ModalPagamento from './ModalPagamento.vue'

const store = useMercadoStore()
const clientesStore = useClientesStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const busca = ref('')
const selecionado = ref<ProdutoMercado | null>(null)
const quantidade = ref<number | null>(null)
const erro = ref('')
const flash = ref<{ texto: string; tom: 'ok' | 'info' | 'erro' } | null>(null)
const mostrarPagamento = ref(false)
const ultimaVenda = ref<Venda | null>(null)
const mostrarCupom = ref(false)
const rotuloSuspensao = ref('')
const descontoAberto = ref<number | null>(null)
const descontoPercentual = ref<number | null>(null)
const descontoMotivo = ref('')

const campoBusca = ref<{ $el?: HTMLElement } | HTMLInputElement | null>(null)
const campoQtd = ref<{ $el?: HTMLElement } | HTMLInputElement | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | undefined

const podeDarDesconto = computed(() => auth.temPermissao('mercado.aplicar_desconto'))
const podeGerenciarProdutos = computed(
  () => auth.temPermissao('mercado.alterar_preco') || auth.temPermissao('estoque.ajustar'),
)
const resultados = computed(() => store.buscarProdutos(busca.value).slice(0, 8))
/** Último EAN válido bipado que não existe no catálogo. */
const eanDesconhecido = ref<string | null>(null)

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function mostrarFlash(texto: string, tom: 'ok' | 'info' | 'erro'): void {
  flash.value = { texto, tom }
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flash.value = null
  }, 3500)
}

function focarElemento(alvo: { $el?: HTMLElement } | HTMLInputElement | null): void {
  if (!alvo) return
  if (alvo instanceof HTMLInputElement) {
    alvo.focus()
    return
  }
  alvo.$el?.querySelector('input')?.focus()
}

function focarBusca(): void {
  void nextTick(() => focarElemento(campoBusca.value))
}

function focarQtd(): void {
  void nextTick(() => {
    const alvo = campoQtd.value
    if (alvo instanceof HTMLInputElement) {
      alvo.focus()
      alvo.select()
      return
    }
    const input = alvo?.$el?.querySelector('input')
    input?.focus()
    ;(input as HTMLInputElement | undefined)?.select?.()
  })
}

/** Enter no campo de bipagem: scanner envia o código + Enter. */
function aoEnterBusca(): void {
  erro.value = ''
  const texto = busca.value
  if (!texto.trim()) return
  const resolucao = resolverBipe(texto, store.produtos)

  if (resolucao.tipo === 'busca') return // segue na busca manual

  if (resolucao.tipo === 'erro') {
    erro.value = resolucao.mensagem
    // EAN válido de produto inexistente → oferece cadastro assistido ao gestor
    eanDesconhecido.value =
      podeGerenciarProdutos.value && resolucao.mensagem.includes('não cadastrado') ? texto.trim() : null
    emitirBipe(false)
    mostrarFlash(resolucao.mensagem, 'erro')
    focarBusca()
    return
  }
  eanDesconhecido.value = null

  const produto = store.produtos.find((p) => p.id === resolucao.produtoId)
  if (!produto) {
    erro.value = 'Produto não encontrado.'
    focarBusca()
    return
  }

  if (resolucao.tipo === 'adicionar') {
    try {
      store.adicionarProduto(produto.id, resolucao.quantidade)
      busca.value = ''
      emitirBipe(true)
      mostrarFlash(`${resolucao.origem} — no carrinho`, 'ok')
    } catch (e) {
      erro.value = e instanceof Error ? e.message : 'Não foi possível adicionar.'
      emitirBipe(false)
    }
    focarBusca()
    return
  }

  // pesar: seleciona e leva o foco para o peso
  selecionar(produto)
  busca.value = ''
  mostrarFlash(resolucao.origem, 'info')
  emitirBipe(true)
  focarQtd()
}

function avisoDoProduto(produto: ProdutoMercado): string | null {
  return bloqueioDeVenda(produto, hojeISO())
}

function loteVisivel(produto: ProdutoMercado): string {
  return loteParaVenda(produto, hojeISO())?.lote ?? '—'
}

function selecionar(produto: ProdutoMercado): void {
  erro.value = ''
  selecionado.value = produto
  quantidade.value = produto.unidade === 'UN' ? 1 : null
}

function lerBalanca(): void {
  quantidade.value = Number((0.4 + Math.random() * 1.6).toFixed(3))
}

function adicionar(): void {
  erro.value = ''
  try {
    if (!selecionado.value || quantidade.value === null) return
    store.adicionarProduto(selecionado.value.id, quantidade.value)
    mostrarFlash(`${selecionado.value.nome} — no carrinho`, 'ok')
    emitirBipe(true)
    selecionado.value = null
    quantidade.value = null
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível adicionar.'
    emitirBipe(false)
  }
  focarBusca()
}

function limparBusca(): void {
  busca.value = ''
  selecionado.value = null
  quantidade.value = null
  erro.value = ''
  eanDesconhecido.value = null
  focarBusca()
}

/** Envia o EAN desconhecido ao catálogo e abre o cadastro assistido. */
function irParaCadastro(): void {
  if (!eanDesconhecido.value) return
  store.solicitarCadastroEan(eanDesconhecido.value)
  eanDesconhecido.value = null
  erro.value = ''
}

function atalhoGlobal(evento: KeyboardEvent): void {
  if (evento.key === 'F2') {
    evento.preventDefault()
    if (!mostrarPagamento.value) focarBusca()
  }
}

onMounted(() => {
  focarBusca()
  window.addEventListener('keydown', atalhoGlobal)
})

onUnmounted(() => {
  window.removeEventListener('keydown', atalhoGlobal)
  if (flashTimer) clearTimeout(flashTimer)
})

watch(mostrarPagamento, (aberto) => {
  if (!aberto) focarBusca()
})

function confirmarDesconto(indice: number): void {
  erro.value = ''
  try {
    if (descontoPercentual.value === null) return
    store.aplicarDescontoManual(indice, descontoPercentual.value, descontoMotivo.value)
    descontoAberto.value = null
    descontoPercentual.value = null
    descontoMotivo.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível aplicar o desconto.'
  }
}

function suspender(): void {
  erro.value = ''
  try {
    store.suspenderVenda(rotuloSuspensao.value)
    rotuloSuspensao.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível suspender.'
  }
}

function retomar(id: string): void {
  erro.value = ''
  try {
    store.retomarSuspensa(id)
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível retomar.'
  }
}

function confirmarPagamento(pagamento: PagamentoVenda): void {
  erro.value = ''
  try {
    ultimaVenda.value = store.finalizarVenda(pagamento)
    // Fiado usa a mesma conta corrente dos Clientes (fonte única).
    try {
      if (ultimaVenda.value.valorFiado > 0) {
        const id =
          ultimaVenda.value.pagamento.clienteId ??
          ultimaVenda.value.pagamento.parcelas?.find((p) => p.forma === 'FIADO')?.clienteId
        if (id)
          clientesStore.registrarVendaFiado(
            id,
            ultimaVenda.value.valorFiado,
            ultimaVenda.value.numero,
            ultimaVenda.value.operador,
          )
      }
    } catch (e) {
      // Venda do turno já foi concluída; divergência de cadastro aparece como aviso.
      mostrarFlash(e instanceof Error ? e.message : 'Fiado não sincronizado com Clientes.', 'erro')
    }
    mostrarPagamento.value = false
    mostrarCupom.value = true
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível finalizar.'
  }
}

function formatarQtd(valor: number, unidade: string): string {
  return unidade === 'KG' ? `${valor.toFixed(3)} kg` : `${valor} un`
}
</script>

<template>
  <div class="m3-grid-pos">
    <div class="flex flex-col gap-4 min-w-0">
      <v-alert v-if="erro" type="error" variant="tonal" density="compact" role="alert">{{ erro }}</v-alert>
      <v-alert
        v-if="flash"
        :type="flash.tom === 'erro' ? 'error' : flash.tom === 'ok' ? 'success' : 'info'"
        variant="tonal"
        density="compact"
        role="status"
        >{{ flash.texto }}</v-alert
      >
      <v-btn
        v-if="eanDesconhecido && podeGerenciarProdutos"
        color="secondary"
        variant="tonal"
        rounded="xl"
        prepend-icon="mdi-barcode"
        @click="irParaCadastro"
      >
        Cadastrar EAN {{ eanDesconhecido }}
      </v-btn>
      <v-card rounded="xl">
        <v-card-text>
          <v-text-field
            ref="campoBusca"
            v-model="busca"
            variant="solo-filled"
            label="Bipar ou buscar produto"
            placeholder="Bipe o codigo e tecle Enter"
            prepend-inner-icon="mdi-barcode-scan"
            clearable
            hide-details="auto"
            @keydown.enter.prevent="aoEnterBusca"
            @keydown.esc.prevent="limparBusca"
          />
          <div class="text-caption text-medium-emphasis mt-2">
            Enter confirma o bip - F2 foca o leitor - Esc limpa
          </div>
        </v-card-text>
      </v-card>
      <v-card v-if="busca.trim()" rounded="xl">
        <v-list lines="two">
          <v-list-item
            v-for="produto in resultados"
            :key="produto.id"
            :disabled="!!avisoDoProduto(produto)"
            rounded="lg"
            @click="selecionar(produto)"
          >
            <template #prepend><v-icon icon="mdi-package-variant" /></template>
            <v-list-item-title>{{ produto.nome }}</v-list-item-title>
            <v-list-item-subtitle
              >{{ formatarMoeda(produto.preco) }} - lote {{ loteVisivel(produto) }}</v-list-item-subtitle
            >
          </v-list-item>
          <v-list-item v-if="resultados.length === 0"
            ><v-list-item-title class="text-medium-emphasis"
              >Nenhum produto encontrado.</v-list-item-title
            ></v-list-item
          >
        </v-list>
      </v-card>
      <v-card v-if="selecionado" rounded="xl">
        <v-card-title class="text-body-1"
          >{{ selecionado.nome }} - lote {{ loteVisivel(selecionado) }}</v-card-title
        >
        <v-card-text class="d-flex flex-wrap ga-2">
          <v-text-field
            ref="campoQtd"
            v-model.number="quantidade"
            type="number"
            min="0"
            label="Qtd / Peso"
            density="comfortable"
            style="max-width: 180px"
            @keydown.enter.prevent="adicionar"
          />
          <v-btn
            v-if="selecionado.unidade === 'KG'"
            variant="outlined"
            rounded="xl"
            prepend-icon="mdi-scale"
            @click="lerBalanca"
            >Ler balanca</v-btn
          >
          <v-btn
            color="primary"
            variant="flat"
            rounded="xl"
            :disabled="quantidade === null"
            prepend-icon="mdi-cart-plus"
            @click="adicionar"
            >Adicionar</v-btn
          >
        </v-card-text>
      </v-card>
      <v-card v-if="store.suspensas.length > 0" rounded="xl">
        <v-card-title class="text-subtitle-1">Vendas suspensas</v-card-title>
        <v-card-text class="d-flex flex-column ga-2">
          <v-chip
            v-for="suspensa in store.suspensas"
            :key="suspensa.id"
            variant="outlined"
            prepend-icon="mdi-pause"
            @click="retomar(suspensa.id)"
          >
            {{ suspensa.rotulo }} - {{ suspensa.itens.length }} itens
          </v-chip>
        </v-card-text>
      </v-card>
    </div>
    <div class="m3-cart-sticky d-flex flex-column ga-4">
      <v-card rounded="xl" elevation="2">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Carrinho</span>
          <v-chip size="small" variant="tonal">{{ store.carrinho.length }} itens</v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="store.carrinho.length === 0" class="text-body-2 text-medium-emphasis">
            Carrinho vazio - bipe o primeiro item.
          </div>
          <v-list v-else lines="three">
            <v-list-item v-for="(item, indice) in store.carrinho" :key="item.produtoId + '-' + indice">
              <v-list-item-title>{{ item.nome }}</v-list-item-title>
              <v-list-item-subtitle
                >{{ formatarQtd(item.quantidade, item.unidade) }} x {{ formatarMoeda(item.precoUnitario) }} -
                lote {{ item.lote }}</v-list-item-subtitle
              >
              <template #append>
                <div class="d-flex flex-column align-end ga-1">
                  <strong>{{
                    formatarMoeda(
                      item.quantidade * item.precoUnitario - item.descontoPromo - item.descontoManual,
                    )
                  }}</strong>
                  <div class="d-flex ga-1">
                    <v-btn
                      v-if="podeDarDesconto"
                      size="x-small"
                      variant="text"
                      @click="descontoAberto = descontoAberto === indice ? null : indice"
                      >desconto</v-btn
                    >
                    <v-btn size="x-small" variant="text" color="error" @click="store.removerItem(indice)"
                      >remover</v-btn
                    >
                  </div>
                </div>
              </template>
              <div v-if="descontoAberto === indice" class="d-flex flex-wrap ga-2 mt-2 w-100">
                <v-text-field
                  v-model.number="descontoPercentual"
                  type="number"
                  label="% off"
                  density="compact"
                  hide-details
                  style="max-width: 110px"
                />
                <v-text-field
                  v-model="descontoMotivo"
                  label="Motivo"
                  density="compact"
                  hide-details
                  style="min-width: 160px; flex: 1"
                />
                <v-btn size="small" variant="tonal" rounded="lg" @click="confirmarDesconto(indice)"
                  >Aplicar</v-btn
                >
              </div>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider />
        <v-card-text class="d-flex align-center justify-space-between">
          <span class="text-body-2">Descontos: {{ formatarMoeda(store.descontoCarrinho) }}</span>
          <span class="text-h6 font-weight-bold">Total: {{ formatarMoeda(store.totalCarrinho) }}</span>
        </v-card-text>
        <v-card-actions class="flex-wrap ga-2">
          <v-text-field
            v-model="rotuloSuspensao"
            label="Rotulo (opcional)"
            density="compact"
            hide-details
            style="min-width: 140px"
          />
          <v-btn
            variant="outlined"
            rounded="xl"
            :disabled="store.carrinho.length === 0"
            prepend-icon="mdi-pause"
            @click="suspender"
            >Suspender</v-btn
          >
          <v-btn
            color="primary"
            variant="flat"
            rounded="xl"
            size="large"
            :disabled="store.carrinho.length === 0"
            prepend-icon="mdi-cash"
            @click="mostrarPagamento = true"
            >Pagamento</v-btn
          >
        </v-card-actions>
      </v-card>
    </div>
    <ModalPagamento
      v-if="mostrarPagamento"
      :total="store.totalCarrinho"
      @fechar="mostrarPagamento = false"
      @confirmar="confirmarPagamento"
    />
    <CupomVenda
      v-if="mostrarCupom && ultimaVenda"
      :venda="ultimaVenda"
      :novidade="true"
      @fechar="mostrarCupom = false"
    />
  </div>
</template>
