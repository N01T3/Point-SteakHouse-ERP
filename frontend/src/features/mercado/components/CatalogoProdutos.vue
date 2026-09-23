<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { interpretarCodigo } from '../logica/codigoBarras'
import { estoqueTotal } from '../logica/mercado'
import { consultarEan } from '../servicos/consultaEan'
import { useMercadoStore } from '../store/mercado.store'
import type { ProdutoMercado } from '../tipos'

const store = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const busca = ref('')
const categoriaFiltro = ref('todas')
const vista = ref<'catalogo' | 'deposito'>('catalogo')
const detalhe = ref<ProdutoMercado | null>(null)
const mostrandoCadastro = ref(false)
const buscandoEan = ref(false)
const erro = ref('')
const sucesso = ref('')

const podeGerenciar = computed(
  () => auth.temPermissao('mercado.alterar_preco') || auth.temPermissao('estoque.ajustar'),
)
const podeVerCusto = computed(() => auth.temPermissao('financeiro.ver_margem'))

const categorias = computed(() => ['todas', ...new Set(store.produtos.map((p) => p.categoria))])

const lista = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  return store.produtos.filter((p) => {
    if (categoriaFiltro.value !== 'todas' && p.categoria !== categoriaFiltro.value) return false
    if (!termo) return true
    return (
      p.nome.toLowerCase().includes(termo) ||
      p.codigoBarras?.includes(termo) ||
      p.plu === termo ||
      p.fornecedor?.toLowerCase().includes(termo)
    )
  })
})

/** Visão do depósito: tudo que o mercado tem em estoque, agregado. */
const deposito = computed(() => {
  let kg = 0
  let un = 0
  let valorCusto = 0
  let valorVenda = 0
  let abaixoMinimo = 0
  for (const p of store.produtos) {
    const total = estoqueTotal(p)
    if (p.unidade === 'KG') kg += total
    else un += total
    valorCusto += total * p.custoMedio
    valorVenda += total * p.preco
    if (total <= p.estoqueMinimo) abaixoMinimo++
  }
  return {
    skus: store.produtos.length,
    kg: Math.round(kg * 1000) / 1000,
    un: Math.round(un * 100) / 100,
    valorCusto: Math.round(valorCusto * 100) / 100,
    valorVenda: Math.round(valorVenda * 100) / 100,
    abaixoMinimo,
    vencendo: store.alertasValidade.length,
  }
})

// --- cadastro ---
const fNome = ref('')
const fCategoria = ref('Carnes')
const fGrupo = ref('Carnes')
const fSubgrupo = ref('Cortes bovinos')
const fUnidade = ref<'KG' | 'UN'>('KG')
const fPreco = ref<number | null>(null)
const fCusto = ref<number | null>(null)
const fEan = ref('')
const fPlu = ref('')
const fMin = ref<number | null>(null)
const fAlvo = ref<number | null>(null)
const fFornecedor = ref('')

const diagnosticoEan = computed(() => (fEan.value.trim() ? interpretarCodigo(fEan.value) : null))

const CATEGORIAS_SUGERIDAS = ['Carnes', 'Frios', 'Mercearia', 'Bebidas', 'Churrasco', 'Limpeza', 'Geral']
const GRUPOS_SUGERIDOS = ['Carnes', 'Mercearia', 'Bebidas', 'Churrasco', 'Frios', 'Limpeza', 'Geral']
const SUBGRUPOS_SUGERIDOS = [
  'Cortes bovinos',
  'Cortes suínos',
  'Embutidos',
  'Maturados',
  'Aves',
  'Grãos',
  'Básicos',
  'Café e açúcar',
  'Refrigerantes',
  'Cervejas',
  'Carvão e acendimento',
  'Temperos e sal',
  'Queijos e frios',
  'Geral',
]

function abrirDetalhe(produto: ProdutoMercado): void {
  detalhe.value = produto
}

function codigoRotulo(produto: ProdutoMercado): string {
  if (produto.codigoBarras) return produto.codigoBarras
  if (produto.plu) return `PLU ${produto.plu}`
  return 'sem código'
}

function margemEstimada(produto: ProdutoMercado): string {
  if (produto.preco <= 0) return '—'
  const margem = (produto.preco - produto.custoMedio) / produto.preco
  return `${(margem * 100).toFixed(1).replace('.', ',')}%`
}

/** Recebe EAN bipado no caixa: abre o cadastro pré-preenchido e busca dados. */
function atenderPedidoDeCadastro(): void {
  if (!podeGerenciar.value) {
    store.consumirEanParaCadastrar()
    return
  }
  const codigo = store.consumirEanParaCadastrar()
  if (!codigo) return
  vista.value = 'catalogo'
  mostrandoCadastro.value = true
  fEan.value = codigo
  void buscarDadosEan()
}

onMounted(atenderPedidoDeCadastro)
watch(
  () => store.eanParaCadastrar,
  () => atenderPedidoDeCadastro(),
)

/** Preenche o cadastro com a base aberta (Open Food Facts) a partir do EAN. */
async function buscarDadosEan(): Promise<void> {
  erro.value = ''
  sucesso.value = ''
  if (!fEan.value.trim()) {
    erro.value = 'Digite o EAN-13 primeiro.'
    return
  }
  buscandoEan.value = true
  try {
    const dados = await consultarEan(fEan.value)
    if (!fNome.value.trim()) fNome.value = dados.nome
    fCategoria.value = dados.categoriaSugerida
    if (!fFornecedor.value.trim()) fFornecedor.value = dados.marca
    sucesso.value = `Encontrado: ${dados.nome}${dados.quantidadeRotulo ? ` (${dados.quantidadeRotulo})` : ''} — confira e complete o cadastro.`
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível buscar.'
  } finally {
    buscandoEan.value = false
  }
}

const campoArquivo = ref<HTMLInputElement | null>(null)

/** Backup do catálogo em JSON (download). */
function exportar(): void {
  erro.value = ''
  try {
    const blob = new Blob([store.exportarCatalogo()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'catalogo-mercado.json'
    a.click()
    URL.revokeObjectURL(url)
    sucesso.value = 'Catálogo exportado.'
  } catch {
    erro.value = 'Não foi possível exportar.'
  }
}

/** Restaura catálogo de um JSON exportado. */
async function importar(evento: Event): Promise<void> {
  erro.value = ''
  sucesso.value = ''
  try {
    const input = evento.target as HTMLInputElement
    const arquivo = input.files?.[0]
    if (!arquivo) return
    const texto = await arquivo.text()
    const total = store.importarCatalogo(texto, auth.usuario?.nome ?? 'admin')
    sucesso.value = `${total} produtos importados para este dispositivo.`
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível importar.'
  } finally {
    if (campoArquivo.value) campoArquivo.value.value = ''
  }
}

function restaurar(): void {
  erro.value = ''
  store.restaurarDemo()
  sucesso.value = 'Base de demonstração restaurada.'
}

function cadastrar(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (fPreco.value === null || fCusto.value === null) {
      erro.value = 'Informe preço de venda e custo médio.'
      return
    }
    const produto = store.cadastrarProduto(
      {
        nome: fNome.value,
        categoria: fCategoria.value,
        grupo: fGrupo.value,
        subgrupo: fSubgrupo.value,
        unidade: fUnidade.value,
        preco: fPreco.value,
        custoMedio: fCusto.value,
        codigoBarras: fEan.value,
        plu: fPlu.value,
        estoqueMinimo: fMin.value ?? 0,
        estoqueAlvo: fAlvo.value ?? 0,
        fornecedor: fFornecedor.value,
      },
      auth.usuario?.nome ?? 'admin',
    )
    sucesso.value = `${produto.nome} cadastrado. Receba o primeiro lote na aba Administração → Recebimento.`
    fNome.value = ''
    fEan.value = ''
    fPlu.value = ''
    fPreco.value = null
    fCusto.value = null
    mostrandoCadastro.value = false
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível cadastrar.'
  }
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-alert v-if="erro" type="error" variant="tonal" density="compact">{{ erro }}</v-alert>
    <v-alert v-if="sucesso" type="success" variant="tonal" density="compact">{{ sucesso }}</v-alert>
    <v-card rounded="xl">
      <v-card-text class="d-flex flex-wrap ga-2 align-center">
        <v-btn-toggle v-model="vista" color="primary" density="comfortable" rounded="xl" border mandatory>
          <v-btn value="catalogo">Catalogo</v-btn>
          <v-btn value="deposito">Deposito</v-btn>
        </v-btn-toggle>
        <v-text-field
          v-model="busca"
          label="Buscar"
          placeholder="Nome, EAN, PLU ou fornecedor"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          hide-details
          style="min-width: 220px; flex: 1"
        />
        <v-select
          v-model="categoriaFiltro"
          label="Categoria"
          :items="categorias.map((c) => ({ title: c === 'todas' ? 'Todas categorias' : c, value: c }))"
          density="comfortable"
          hide-details
          style="max-width: 200px"
        />
        <v-btn
          v-if="podeGerenciar"
          color="primary"
          variant="flat"
          rounded="xl"
          prepend-icon="mdi-plus"
          @click="mostrandoCadastro = !mostrandoCadastro"
          >{{ mostrandoCadastro ? 'Fechar' : 'Novo produto' }}</v-btn
        >
      </v-card-text>
      <v-card-text v-if="!podeGerenciar" class="text-caption text-medium-emphasis pt-0"
        >Caixa: consulta e bipagem. Cadastro e preco sao do dono/administrador.</v-card-text
      >
    </v-card>
    <div v-if="vista === 'deposito'" class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <v-card rounded="xl" variant="tonal"
        ><v-card-text
          ><div class="text-caption">SKUs</div>
          <div class="text-h6">{{ deposito.skus }}</div></v-card-text
        ></v-card
      >
      <v-card rounded="xl" variant="tonal"
        ><v-card-text
          ><div class="text-caption">Kg</div>
          <div class="text-h6">{{ deposito.kg.toFixed(1) }} kg</div></v-card-text
        ></v-card
      >
      <v-card rounded="xl" variant="tonal"
        ><v-card-text
          ><div class="text-caption">Valor custo</div>
          <div class="text-h6">{{ formatarMoeda(deposito.valorCusto) }}</div></v-card-text
        ></v-card
      >
      <v-card rounded="xl" variant="tonal"
        ><v-card-text
          ><div class="text-caption">Abaixo minimo</div>
          <div class="text-h6">{{ deposito.abaixoMinimo }}</div></v-card-text
        ></v-card
      >
    </div>
    <v-card v-if="mostrandoCadastro && podeGerenciar" rounded="xl">
      <v-card-title>Cadastrar produto - padrao GS1 Brasil</v-card-title>
      <v-card-text class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <v-text-field v-model="fNome" label="Nome *" />
        <v-select v-model="fCategoria" label="Categoria" :items="CATEGORIAS_SUGERIDAS" />
        <v-select v-model="fGrupo" label="Grupo" :items="GRUPOS_SUGERIDOS" />
        <v-select v-model="fSubgrupo" label="Subgrupo" :items="SUBGRUPOS_SUGERIDOS" />
        <v-select
          v-model="fUnidade"
          label="Unidade"
          :items="[
            { title: 'KG (peso)', value: 'KG' },
            { title: 'UN (unidade)', value: 'UN' },
          ]"
        />
        <v-text-field v-model.number="fPreco" type="number" label="Preco venda (R$) *" prefix="R$" />
        <v-text-field v-model.number="fCusto" type="number" label="Custo medio (R$) *" prefix="R$" />
        <v-text-field v-model="fEan" label="EAN-13 / GTIN" placeholder="789..." />
        <v-text-field v-model="fPlu" label="PLU" placeholder="ex.: 111" />
        <v-text-field v-model="fFornecedor" label="Fornecedor" />
      </v-card-text>
      <v-card-text v-if="diagnosticoEan" class="pt-0">
        <v-alert :type="diagnosticoEan.valido ? 'success' : 'error'" variant="tonal" density="compact"
          >{{ diagnosticoEan.valido ? 'OK' : 'Invalido' }} - {{ diagnosticoEan.rotulo }}</v-alert
        >
      </v-card-text>
      <v-card-actions>
        <v-btn variant="outlined" rounded="xl" :loading="buscandoEan" @click="buscarDadosEan"
          >Buscar dados</v-btn
        >
        <v-btn variant="text" @click="exportar">Exportar</v-btn>
        <v-btn variant="text" @click="campoArquivo?.click()">Importar</v-btn>
        <input ref="campoArquivo" type="file" accept="application/json" hidden @change="importar" />
        <v-btn variant="text" @click="restaurar">Restaurar demo</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" rounded="xl" @click="cadastrar">Cadastrar produto</v-btn>
      </v-card-actions>
    </v-card>
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      <v-card v-for="p in lista" :key="p.id" rounded="xl" hover @click="abrirDetalhe(p)">
        <v-card-text>
          <div class="d-flex align-center ga-2 mb-1">
            <v-avatar color="primary-container" size="40"><v-icon icon="mdi-food-steak" /></v-avatar>
            <div class="font-weight-bold">{{ p.nome }}</div>
          </div>
          <div class="text-caption text-medium-emphasis">{{ p.categoria }} - {{ codigoRotulo(p) }}</div>
          <div class="d-flex justify-space-between align-center mt-2">
            <strong>{{ formatarMoeda(p.preco) }}{{ p.unidade === 'KG' ? '/kg' : '' }}</strong>
            <v-chip size="small" variant="tonal"
              >{{ estoqueTotal(p) }} {{ p.unidade === 'KG' ? 'kg' : 'un' }}</v-chip
            >
          </div>
        </v-card-text>
      </v-card>
    </div>
    <v-dialog
      :model-value="detalhe !== null"
      max-width="480"
      @update:model-value="(v) => !v && (detalhe = null)"
    >
      <v-card v-if="detalhe" rounded="xl">
        <v-card-title>{{ detalhe.nome }}</v-card-title>
        <v-card-subtitle
          >{{ detalhe.categoria }} -
          {{ detalhe.unidade === 'KG' ? 'venda por peso' : 'venda por unidade' }}</v-card-subtitle
        >
        <v-card-text>
          <v-list density="compact">
            <v-list-item
              ><v-list-item-title>Preco: {{ formatarMoeda(detalhe.preco) }}</v-list-item-title></v-list-item
            >
            <v-list-item v-if="podeVerCusto"
              ><v-list-item-title
                >Custo: {{ formatarMoeda(detalhe.custoMedio) }} - Margem
                {{ margemEstimada(detalhe) }}</v-list-item-title
              ></v-list-item
            >
            <v-list-item
              ><v-list-item-title
                >EAN: {{ detalhe.codigoBarras ?? '-' }} - PLU: {{ detalhe.plu ?? '-' }}</v-list-item-title
              ></v-list-item
            >
            <v-list-item
              ><v-list-item-title
                >Estoque: {{ estoqueTotal(detalhe) }} {{ detalhe.unidade }}</v-list-item-title
              ></v-list-item
            >
          </v-list>
          <div class="text-subtitle-2 mt-2">Lotes e validade</div>
          <v-chip
            v-for="l in detalhe.lotes"
            :key="l.lote"
            class="ma-1"
            :color="l.estado === 'LIBERADO' ? 'success' : l.estado === 'QUARENTENA' ? 'warning' : 'error'"
            variant="tonal"
            >{{ l.lote }} - val. {{ l.validade }} - {{ l.quantidade }}</v-chip
          >
          <div v-if="detalhe.lotes.length === 0" class="text-caption">Sem lotes.</div>
        </v-card-text>
        <v-card-actions
          ><v-spacer /><v-btn variant="outlined" rounded="xl" @click="detalhe = null"
            >Fechar</v-btn
          ></v-card-actions
        >
      </v-card>
    </v-dialog>
  </div>
</template>
