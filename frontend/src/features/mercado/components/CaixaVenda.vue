<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { bloqueioDeVenda, loteParaVenda } from '../logica/mercado'
import { resolverBipe } from '../logica/resolucaoBipe'
import { emitirBipe } from '../logica/sinalSonoro'
import { useMercadoStore } from '../store/mercado.store'
import { useClientesStore } from '../../clientes/store/clientes.store'
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

const campoBusca = ref<HTMLInputElement | null>(null)
const campoQtd = ref<HTMLInputElement | null>(null)
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

function focarBusca(): void {
  void nextTick(() => campoBusca.value?.focus())
}

function focarQtd(): void {
  void nextTick(() => {
    campoQtd.value?.focus()
    campoQtd.value?.select()
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
        const id = ultimaVenda.value.pagamento.clienteId ?? ultimaVenda.value.pagamento.parcelas?.find((p) => p.forma === 'FIADO')?.clienteId
        if (id) clientesStore.registrarVendaFiado(id, ultimaVenda.value.valorFiado, ultimaVenda.value.numero, ultimaVenda.value.operador)
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
  <div class="caixa">
    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
    <div v-if="flash" class="flash" :class="flash.tom" role="status">{{ flash.texto }}</div>
    <button
      v-if="eanDesconhecido && podeGerenciarProdutos"
      type="button"
      class="botao-cadastro"
      @click="irParaCadastro"
    >
      Cadastrar EAN {{ eanDesconhecido }} →
    </button>

    <div class="coluna">
      <label class="campo">
        <span>Bipar ou buscar produto</span>
        <input
          ref="campoBusca"
          v-model="busca"
          type="text"
          placeholder="Bipe o código e tecle Enter…"
          autocomplete="off"
          autofocus
          @keydown.enter.prevent="aoEnterBusca"
          @keydown.esc.prevent="limparBusca"
        />
      </label>
      <div class="ajuda-teclas">Enter confirma o bip · F2 foca o leitor · Esc limpa</div>

      <div v-if="busca.trim()" class="resultados">
        <button
          v-for="produto in resultados"
          :key="produto.id"
          type="button"
          class="resultado"
          :disabled="!!avisoDoProduto(produto)"
          @click="selecionar(produto)"
        >
          <span class="resultado-nome">{{ produto.nome }}</span>
          <span class="resultado-preco">{{ formatarMoeda(produto.preco) }}{{ produto.unidade === 'KG' ? '/kg' : '' }}</span>
          <span v-if="avisoDoProduto(produto)" class="resultado-aviso">{{ avisoDoProduto(produto) }}</span>
          <span v-else class="resultado-lote">lote {{ loteVisivel(produto) }}</span>
        </button>
        <div v-if="resultados.length === 0" class="sem-resultado">Nenhum produto encontrado.</div>
      </div>

      <div v-if="selecionado" class="selecao">
        <div class="selecao-titulo">{{ selecionado.nome }} · lote {{ loteVisivel(selecionado) }}</div>
        <div class="linha-qtd">
          <input
            ref="campoQtd"
            v-model.number="quantidade"
            type="number"
            min="0"
            :step="selecionado.unidade === 'KG' ? '0.001' : '1'"
            :placeholder="selecionado.unidade === 'KG' ? 'Peso (kg)' : 'Qtd'"
            inputmode="decimal"
            @keydown.enter.prevent="adicionar"
          />
          <button v-if="selecionado.unidade === 'KG'" type="button" class="botao-secundario" @click="lerBalanca">
            Ler balança
          </button>
          <button type="button" class="botao-primario" :disabled="quantidade === null" @click="adicionar">
            Adicionar
          </button>
        </div>
      </div>

      <div v-if="store.suspensas.length > 0" class="suspensas">
        <div class="secao-titulo">Vendas suspensas</div>
        <button
          v-for="suspensa in store.suspensas"
          :key="suspensa.id"
          type="button"
          class="suspensa"
          @click="retomar(suspensa.id)"
        >
          {{ suspensa.rotulo }} · {{ suspensa.itens.length }} itens — retomar
        </button>
      </div>
    </div>

    <div class="coluna">
      <div class="carrinho">
        <div class="secao-titulo">Carrinho</div>
        <div v-if="store.carrinho.length === 0" class="carrinho-vazio">Carrinho vazio — bipe o primeiro item.</div>
        <div v-for="(item, indice) in store.carrinho" :key="`${item.produtoId}-${item.lote}-${indice}`" class="linha">
          <div class="linha-info">
            <div class="linha-nome">{{ item.nome }}</div>
            <div class="linha-detalhe">
              {{ formatarQtd(item.quantidade, item.unidade) }} × {{ formatarMoeda(item.precoUnitario) }} · lote {{ item.lote }}
            </div>
            <div v-if="item.descricaoPromo" class="linha-promo">{{ item.descricaoPromo }} (−{{ formatarMoeda(item.descontoPromo) }})</div>
            <div v-if="item.motivoDesconto" class="linha-promo">Desconto: {{ item.motivoDesconto }} (−{{ formatarMoeda(item.descontoManual) }})</div>
            <div v-if="descontoAberto === indice" class="desconto-form">
              <input v-model.number="descontoPercentual" type="number" min="0" max="100" placeholder="% off" />
              <input v-model="descontoMotivo" type="text" placeholder="Motivo (obrigatório)" />
              <button type="button" class="botao-secundario" @click="confirmarDesconto(indice)">Aplicar</button>
            </div>
          </div>
          <div class="linha-acoes">
            <strong>{{ formatarMoeda(item.quantidade * item.precoUnitario - item.descontoPromo - item.descontoManual) }}</strong>
            <button
              v-if="podeDarDesconto"
              type="button"
              class="link"
              @click="descontoAberto = descontoAberto === indice ? null : indice"
            >
              desconto
            </button>
            <button type="button" class="link" @click="store.removerItem(indice)">remover</button>
          </div>
        </div>
        <div v-if="!podeDarDesconto && store.carrinho.length > 0" class="nota-permissao">
          Desconto manual requer autorização.
        </div>
      </div>

      <div class="total-barra">
        <div class="total-valores">
          <span>Descontos: {{ formatarMoeda(store.descontoCarrinho) }}</span>
          <strong>Total: {{ formatarMoeda(store.totalCarrinho) }}</strong>
        </div>
        <div class="total-acoes">
          <input v-model="rotuloSuspensao" type="text" placeholder="Rótulo (opcional)" class="input-rotulo" />
          <button type="button" class="botao-secundario" :disabled="store.carrinho.length === 0" @click="suspender">
            Suspender
          </button>
          <button type="button" class="botao-primario" :disabled="store.carrinho.length === 0" @click="mostrarPagamento = true">
            Pagamento
          </button>
        </div>
      </div>
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

<style scoped>
.caixa {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 18px;
  align-items: start;
}

@media (max-width: 840px) {
  .caixa {
    grid-template-columns: 1fr;
  }
}

.coluna {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.erro {
  grid-column: 1 / -1;
  font-size: 13px;
  color: var(--cor-error);
  background: var(--cor-error-container);
  border-radius: 10px;
  padding: 10px 14px;
}

.flash {
  grid-column: 1 / -1;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  padding: 10px 14px;
}

.flash.ok {
  color: var(--cor-success);
  background: var(--cor-surface-variant);
}

.flash.info {
  color: var(--cor-on-primary-container);
  background: var(--cor-primary-container);
}

.flash.erro {
  color: var(--cor-error);
  background: var(--cor-error-container);
}

.ajuda-teclas {
  font-size: 11.5px;
  color: var(--cor-on-surface-variant);
}

.botao-cadastro {
  grid-column: 1 / -1;
  justify-self: start;
  padding: 10px 18px;
  border: none;
  border-radius: 100px;
  background: var(--cor-secondary-container, var(--cor-primary-container));
  color: var(--cor-on-secondary-container, var(--cor-on-primary-container));
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.campo input,
.input-rotulo,
.desconto-form input {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
}

.resultados {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resultado {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 10px;
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  font-family: inherit;
  cursor: pointer;
}

.resultado:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.resultado-nome {
  font-weight: 700;
  font-size: 14px;
}

.resultado-preco {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.resultado-aviso {
  grid-column: 1 / -1;
  font-size: 12px;
  font-weight: 600;
  color: var(--cor-error);
}

.resultado-lote {
  grid-column: 1 / -1;
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.sem-resultado {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.selecao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selecao-titulo {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.linha-qtd {
  display: flex;
  gap: 8px;
}

.linha-qtd input {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 15px;
  min-width: 0;
}

.botao-primario {
  padding: 12px 18px;
  border: none;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.botao-primario:disabled,
.botao-secundario:disabled {
  opacity: 0.5;
  cursor: default;
}

.botao-secundario {
  padding: 12px 16px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.suspensas,
.carrinho {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.secao-titulo {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.suspensa {
  text-align: left;
  border: 1px dashed var(--cor-outline);
  background: var(--cor-bg);
  border-radius: 10px;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 13px;
  color: var(--cor-on-surface);
  cursor: pointer;
}

.carrinho-vazio {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.linha {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--cor-outline);
}

.linha:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.linha-nome {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.linha-detalhe {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
  margin-top: 2px;
}

.linha-promo {
  font-size: 12px;
  font-weight: 600;
  color: var(--cor-success);
  margin-top: 2px;
}

.linha-acoes {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
  font-size: 14px;
  color: var(--cor-on-surface);
}

.link {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--cor-primary);
  cursor: pointer;
}

.desconto-form {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.desconto-form input {
  padding: 8px;
  font-size: 12.5px;
  min-width: 0;
}

.nota-permissao {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.total-barra {
  position: sticky;
  bottom: 12px;
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.total-valores {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.total-valores strong {
  font-family: 'Bodoni Moda', serif;
  font-size: 24px;
  color: var(--cor-on-surface);
}

.total-acoes {
  display: flex;
  gap: 8px;
}

.input-rotulo {
  flex: 1;
  min-width: 0;
}
</style>
