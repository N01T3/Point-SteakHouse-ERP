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
const SUBGRUPOS_SUGERIDOS = ['Cortes bovinos', 'Cortes suínos', 'Embutidos', 'Maturados', 'Aves', 'Grãos', 'Básicos', 'Café e açúcar', 'Refrigerantes', 'Cervejas', 'Carvão e acendimento', 'Temperos e sal', 'Queijos e frios', 'Geral']

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
async function buscarDadosEan(): Promise<void> {  erro.value = ''
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
  <div class="catalogo">
    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
    <div v-if="sucesso" class="sucesso" role="status">{{ sucesso }}</div>

    <div class="barra">
      <div class="segmentado">
        <button type="button" :class="{ ativo: vista === 'catalogo' }" @click="vista = 'catalogo'">Catálogo</button>
        <button type="button" :class="{ ativo: vista === 'deposito' }" @click="vista = 'deposito'">Depósito</button>
      </div>
      <input v-model="busca" type="text" placeholder="Buscar por nome, EAN, PLU ou fornecedor…" class="input-busca" />
      <select v-model="categoriaFiltro" aria-label="Categoria">
        <option v-for="c in categorias" :key="c" :value="c">{{ c === 'todas' ? 'Todas categorias' : c }}</option>
      </select>
      <button v-if="podeGerenciar" type="button" class="botao-primario" @click="mostrandoCadastro = !mostrandoCadastro">
        {{ mostrandoCadastro ? 'Fechar' : '+ Novo produto' }}
      </button>
    </div>
    <div v-if="!podeGerenciar" class="nota">Caixa: consulta e bipagem. Cadastro e preço são do dono/administrador.</div>
    <div class="linha-catalogo">
      <span class="nota">
        Catálogo {{ store.origemCatalogo === 'local' ? 'neste dispositivo' : 'de demonstração' }} ·
        {{ store.produtos.length }} itens{{ store.catalogoPronto ? '' : ' (carregando…)' }}
      </span>
      <span v-if="podeGerenciar" class="acoes-catalogo">
        <button type="button" class="link" @click="exportar">exportar</button>
        <label class="link importar">importar<input ref="campoArquivo" type="file" accept="application/json" hidden @change="importar" /></label>
        <button type="button" class="link" @click="restaurar">restaurar demo</button>
      </span>
    </div>

    <!-- DEPÓSITO -->
    <div v-if="vista === 'deposito'" class="cartoes">
      <div class="cartao-mini"><span>SKUs cadastrados</span><strong>{{ deposito.skus }}</strong></div>
      <div class="cartao-mini"><span>Carnes e frios (kg)</span><strong>{{ deposito.kg.toFixed(1) }} kg</strong></div>
      <div class="cartao-mini"><span>Unidades</span><strong>{{ deposito.un }}</strong></div>
      <div class="cartao-mini"><span>Valor em custo</span><strong>{{ formatarMoeda(deposito.valorCusto) }}</strong></div>
      <div class="cartao-mini"><span>Valor em venda</span><strong>{{ formatarMoeda(deposito.valorVenda) }}</strong></div>
      <div class="cartao-mini"><span>Abaixo do mínimo</span><strong>{{ deposito.abaixoMinimo }}</strong></div>
      <div class="cartao-mini"><span>Lotes vencendo</span><strong>{{ deposito.vencendo }}</strong></div>
    </div>

    <div v-if="vista === 'deposito'" class="cartao">
      <div class="secao-titulo">Estoque por produto — clique para ver lotes</div>
      <button v-for="p in lista" :key="p.id" type="button" class="linha-estoque" @click="abrirDetalhe(p)">
        <span class="linha-estoque-nome">{{ p.nome }}<small>{{ p.grupo ?? p.categoria }}{{ p.subgrupo ? ` · ${p.subgrupo}` : '' }}</small></span>
        <strong>{{ estoqueTotal(p) }} {{ p.unidade === 'KG' ? 'kg' : 'un' }}</strong>
      </button>
      <div v-if="lista.length === 0" class="nota">Nenhum produto encontrado.</div>
      <div class="nota">Base oficial GS1 (CNP) exige associação — o app valida o padrão GS1 localmente e busca dados abertos pelo EAN no cadastro.</div>
    </div>

    <template v-if="vista === 'catalogo'">

    <!-- CADASTRO -->
    <div v-if="mostrandoCadastro && podeGerenciar" class="cartao">
      <div class="secao-titulo">Cadastrar produto — padrão GS1 Brasil</div>
      <div class="grade">
        <label class="campo">Nome*<input v-model="fNome" type="text" placeholder="ex.: Coxão mole" /></label>
        <label class="campo">Categoria
          <select v-model="fCategoria">
            <option v-for="c in CATEGORIAS_SUGERIDAS" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label class="campo">Grupo
          <select v-model="fGrupo">
            <option v-for="g in GRUPOS_SUGERIDOS" :key="g" :value="g">{{ g }}</option>
          </select>
        </label>
        <label class="campo">Subgrupo
          <select v-model="fSubgrupo">
            <option v-for="s in SUBGRUPOS_SUGERIDOS" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
        <label class="campo">Unidade de venda
          <select v-model="fUnidade"><option value="KG">KG (peso)</option><option value="UN">UN (unidade)</option></select>
        </label>
        <label class="campo">Preço venda (R$)*<input v-model.number="fPreco" type="number" min="0" step="0.01" /></label>
        <label class="campo">Custo médio (R$)*<input v-model.number="fCusto" type="number" min="0" step="0.01" /></label>
        <label class="campo">EAN-13 / GTIN
          <span class="campo-ean">
            <input v-model="fEan" type="text" inputmode="numeric" placeholder="789…" maxlength="13" />
            <button type="button" class="botao-secundario" :disabled="buscandoEan" @click="buscarDadosEan">
              {{ buscandoEan ? 'Buscando…' : 'Buscar dados' }}
            </button>
          </span>
        </label>
        <label class="campo">PLU (1–6 dígitos)<input v-model="fPlu" type="text" inputmode="numeric" placeholder="ex.: 111" maxlength="6" /></label>
        <label class="campo">Estoque mínimo<input v-model.number="fMin" type="number" min="0" step="0.001" /></label>
        <label class="campo">Estoque alvo<input v-model.number="fAlvo" type="number" min="0" step="0.001" /></label>
        <label class="campo">Fornecedor<input v-model="fFornecedor" type="text" placeholder="Frigorífico…" /></label>
      </div>
      <div v-if="diagnosticoEan" class="diagnostico" :class="{ ok: diagnosticoEan.valido, ruim: !diagnosticoEan.valido }">
        {{ diagnosticoEan.valido ? '✓' : '✗' }} {{ diagnosticoEan.rotulo }}
      </div>
      <div class="nota">Exige ao menos EAN-13 ou PLU. GTIN 789/790 = registro GS1 Brasil. Etiqueta de balança (prefixo 2) não serve para cadastro — use o PLU.</div>
      <button type="button" class="botao-primario" @click="cadastrar">Cadastrar produto</button>
    </div>

    <!-- LISTA -->
    <div class="lista">
      <button v-for="p in lista" :key="p.id" type="button" class="item" @click="abrirDetalhe(p)">
        <div class="item-nome">{{ p.nome }}</div>
        <div class="item-meta">{{ p.categoria }} · {{ p.grupo ?? 'Geral' }} / {{ p.subgrupo ?? 'Geral' }} · {{ codigoRotulo(p) }}</div>
        <div class="item-base">
          <strong>{{ formatarMoeda(p.preco) }}{{ p.unidade === 'KG' ? '/kg' : '' }}</strong>
          <span>{{ estoqueTotal(p) }} {{ p.unidade === 'KG' ? 'kg' : 'un' }}</span>
        </div>
      </button>
      <div v-if="lista.length === 0" class="nota">Nenhum produto encontrado.</div>
    </div>
    </template>

    <!-- DETALHE -->
    <div v-if="detalhe" class="fundo" @click.self="detalhe = null">
      <div class="modal" role="dialog" aria-label="Detalhe do produto">
        <div class="modal-titulo">{{ detalhe.nome }}</div>
        <div class="modal-sub">{{ detalhe.categoria }} · {{ detalhe.grupo ?? 'Geral' }} / {{ detalhe.subgrupo ?? 'Geral' }} · {{ detalhe.unidade === 'KG' ? 'venda por peso' : 'venda por unidade' }}</div>

        <div class="bloco">
          <div class="linha"><span>Preço de venda</span><strong>{{ formatarMoeda(detalhe.preco) }}{{ detalhe.unidade === 'KG' ? '/kg' : '' }}</strong></div>
          <div v-if="podeVerCusto" class="linha"><span>Custo médio</span><strong>{{ formatarMoeda(detalhe.custoMedio) }}</strong></div>
          <div v-if="podeVerCusto" class="linha"><span>Margem estimada</span><strong>{{ margemEstimada(detalhe) }}</strong></div>
          <div class="linha"><span>EAN-13 / GTIN</span><strong>{{ detalhe.codigoBarras ?? '—' }}</strong></div>
          <div v-if="detalhe.codigoBarras" class="linha"><span>Padrão</span><strong>{{ interpretarCodigo(detalhe.codigoBarras).rotulo }}</strong></div>
          <div class="linha"><span>PLU</span><strong>{{ detalhe.plu ?? '—' }}</strong></div>
          <div class="linha"><span>Fornecedor</span><strong>{{ detalhe.fornecedor ?? '—' }}</strong></div>
          <div class="linha"><span>Estoque total</span><strong>{{ estoqueTotal(detalhe) }} {{ detalhe.unidade === 'KG' ? 'kg' : 'un' }}</strong></div>
          <div class="linha"><span>Mínimo / alvo</span><strong>{{ detalhe.estoqueMinimo }} / {{ detalhe.estoqueAlvo }}</strong></div>
        </div>

        <div class="secao-titulo">Lotes e validade</div>
        <div v-if="detalhe.lotes.length === 0" class="nota">Sem lotes — receba na aba Administração → Recebimento.</div>
        <div v-for="l in detalhe.lotes" :key="`${l.lote}-${l.local ?? ''}`" class="linha lote-detalhe">
          <span class="lote-codigo">{{ l.lote }}</span>
          <span class="lote-detalhe-texto">val. {{ l.validade }} · {{ l.local ?? 'Loja' }}</span>
          <strong class="badge-mini" :class="l.estado.toLowerCase()">{{ l.estado.toLowerCase() }}</strong>
          <strong>{{ l.quantidade }}</strong>
        </div>

        <button type="button" class="botao-secundario" @click="detalhe = null">Fechar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catalogo { display: flex; flex-direction: column; gap: 14px; }
.erro, .sucesso { font-size: 13px; border-radius: 10px; padding: 10px 14px; }
.erro { color: var(--cor-error); background: var(--cor-error-container); }
.sucesso { color: var(--cor-success); background: var(--cor-surface-variant); }
.barra { display: flex; gap: 8px; flex-wrap: wrap; }
.input-busca { flex: 1; min-width: 200px; padding: 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface); font-family: inherit; font-size: 14px; }
.barra select { padding: 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface); font-family: inherit; font-size: 13px; font-weight: 600; }
.nota { font-size: 12.5px; color: var(--cor-on-surface-variant); }
.cartao { background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.secao-titulo { font-size: 14px; font-weight: 700; color: var(--cor-on-surface); }
.grade { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.campo { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--cor-on-surface-variant); }
.campo input, .campo select { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 13px; }
.diagnostico { font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: 10px; }
.diagnostico.ok { color: var(--cor-success); background: var(--cor-surface-variant); }
.diagnostico.ruim { color: var(--cor-error); background: var(--cor-error-container); }
.linha-catalogo { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.acoes-catalogo { display: flex; gap: 12px; }
.importar { cursor: pointer; }
.botao-primario { align-self: flex-start; padding: 11px 20px; border: none; border-radius: 100px; background: var(--cor-primary); color: var(--cor-on-primary); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.botao-secundario { padding: 11px 20px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.link { background: none; border: none; padding: 0; font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--cor-primary); cursor: pointer; }
.lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.cartoes { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.cartao-mini { background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.cartao-mini span { font-size: 12px; color: var(--cor-on-surface-variant); }
.cartao-mini strong { font-family: 'Bodoni Moda', serif; font-size: 20px; color: var(--cor-on-surface); }
.linha-estoque { display: flex; justify-content: space-between; gap: 12px; width: 100%; text-align: left; font-size: 13px; color: var(--cor-on-surface); background: none; border: none; border-top: 1px solid var(--cor-outline); padding: 10px 0; font-family: inherit; cursor: pointer; align-items: center; }
.linha-estoque-nome { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.linha-estoque-nome small { font-size: 11.5px; color: var(--cor-on-surface-variant); font-weight: 400; }
.linha.lote-detalhe { align-items: center; }
.lote-codigo { font-family: ui-monospace, monospace; font-size: 12px; background: var(--cor-surface-variant); padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }
.lote-detalhe-texto { flex: 1; min-width: 0; font-size: 12.5px; color: var(--cor-on-surface-variant); }
.badge-mini { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 8px; border-radius: 100px; background: var(--cor-surface-variant); }
.badge-mini.liberado { color: var(--cor-success); }
.badge-mini.quarentena { color: var(--cor-secondary); }
.badge-mini.bloqueado { color: var(--cor-error); background: var(--cor-error-container); }
.campo-ean { display: flex; gap: 6px; }
.campo-ean input { flex: 1; min-width: 0; }
.segmentado { display: inline-flex; border: 1px solid var(--cor-outline); border-radius: 100px; overflow: hidden; background: var(--cor-surface); align-self: flex-start; }
.segmentado button { border: none; background: transparent; padding: 10px 16px; font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--cor-on-surface-variant); cursor: pointer; }
.segmentado button.ativo { background: var(--cor-primary-container); color: var(--cor-on-primary-container); }
.item { text-align: left; background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; cursor: pointer; font-family: inherit; color: var(--cor-on-surface); }
.item-nome { font-size: 14px; font-weight: 700; }
.item-meta { font-size: 12px; color: var(--cor-on-surface-variant); }
.item-base { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; margin-top: 4px; }
.fundo { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
@media (min-width: 640px) { .fundo { align-items: center; padding: 24px; } }
.modal { width: min(480px, 100%); max-height: 92vh; overflow-y: auto; background: var(--cor-surface); border-radius: 20px 20px 0 0; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
@media (min-width: 640px) { .modal { border-radius: 20px; } }
.modal-titulo { font-family: 'Bodoni Moda', serif; font-size: 22px; font-weight: 600; color: var(--cor-on-surface); }
.modal-sub { font-size: 13px; color: var(--cor-on-surface-variant); }
.bloco { display: flex; flex-direction: column; }
.linha { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--cor-on-surface); padding: 8px 0; border-top: 1px solid var(--cor-outline); }
</style>
