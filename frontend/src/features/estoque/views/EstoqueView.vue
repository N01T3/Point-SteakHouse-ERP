<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { estoqueTotal } from '../../mercado/logica/mercado'
import { useMercadoStore } from '../../mercado/store/mercado.store'
import { LOCAIS_ESTOQUE, localDoLote, type PedidoCompra, type StatusPedido } from '../../mercado/tipos'

type SubAba = 'visao' | 'transferir' | 'inventario' | 'fornecedores' | 'recall'

const store = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const subAba = ref<SubAba>('visao')
const erro = ref('')
const sucesso = ref('')

const podeAjustar = computed(() => auth.temPermissao('estoque.ajustar'))
const operador = computed(() => auth.usuario?.nome ?? 'admin')

// --- transferência ---
const trProdutoId = ref('')
const trLote = ref('')
const trOrigem = ref('Câmara fria 1')
const trDestino = ref('Balcão')
const trQtd = ref<number | null>(null)
const trMotivo = ref('')

const lotesDoProduto = computed(() => {
  const produto = store.produtos.find((p) => p.id === trProdutoId.value)
  return produto?.lotes ?? []
})

// --- inventário ---
const invProdutoId = ref('')
const invLote = ref('')
const invLocal = ref('Loja')
const invContado = ref<number | null>(null)
const invMotivo = ref('')

// --- fornecedor / pedido ---
const forNome = ref('')
const forContato = ref('')
const pedFornecedorId = ref('')
const pedProdutoId = ref('')
const pedQtd = ref<number | null>(null)
const pedCusto = ref<number | null>(null)
const itensPedido = ref<
  Array<{ produtoId: string; produto: string; quantidade: number; custoUnitario: number }>
>([])

// --- recall ---
const recallLote = ref('')
const recallResultado = ref<ReturnType<typeof store.rastroDoLote> | null>(null)

const ROTULO_STATUS: Record<StatusPedido, string> = {
  aberto: 'aberto',
  'recebido-parcial': 'recebido parcial',
  recebido: 'recebido',
  cancelado: 'cancelado',
}

// --- Visão: resumo + busca/filtro ---
const buscaVisao = ref('')
const filtroVisao = ref<'todos' | 'criticos' | 'zerados' | 'vencendo'>('todos')

const resumoVisao = computed(() => {
  let kg = 0
  let un = 0
  let criticos = 0
  for (const p of store.produtos) {
    const total = estoqueTotal(p)
    if (p.unidade === 'KG') kg += total
    else un += total
    if (total <= p.estoqueMinimo) criticos++
  }
  return {
    skus: store.produtos.length,
    kg: Math.round(kg * 1000) / 1000,
    un: Math.round(un * 100) / 100,
    criticos,
    vencendo: store.alertasValidade.length,
  }
})

const lotesVencendo = computed(() => new Set(store.alertasValidade.map((a) => a.produtoId)))

type StatusProduto = 'ok' | 'critico' | 'zerado'

function statusDoProduto(produtoId: string, total: number, minimo: number): StatusProduto {
  if (total <= 0) return 'zerado'
  const p = store.produtos.find((x) => x.id === produtoId)
  if (p && lotesVencendo.value.has(produtoId)) return 'critico'
  return total <= minimo ? 'critico' : 'ok'
}

const ROTULO_STATUS_PRODUTO: Record<StatusProduto, string> = {
  ok: 'ok',
  critico: 'crítico',
  zerado: 'zerado',
}

const produtosVisao = computed(() => {
  const termo = buscaVisao.value.trim().toLowerCase()
  return store.produtos
    .map((p) => ({ produto: p, total: estoqueTotal(p) }))
    .filter(({ produto, total }) => {
      if (termo && !produto.nome.toLowerCase().includes(termo)) return false
      const status = statusDoProduto(produto.id, total, produto.estoqueMinimo)
      if (filtroVisao.value === 'criticos' && status !== 'critico') return false
      if (filtroVisao.value === 'zerados' && status !== 'zerado') return false
      if (filtroVisao.value === 'vencendo' && !lotesVencendo.value.has(produto.id)) return false
      return true
    })
    .sort((a, b) => {
      const peso: Record<StatusProduto, number> = { zerado: 0, critico: 1, ok: 2 }
      const sa = statusDoProduto(a.produto.id, a.total, a.produto.estoqueMinimo)
      const sb = statusDoProduto(b.produto.id, b.total, b.produto.estoqueMinimo)
      return peso[sa] - peso[sb]
    })
})

function formatarValidade(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return ano && mes && dia ? `${dia}/${mes}` : iso
}

function diasRestantes(validade: string): number {
  const msPorDia = 24 * 60 * 60 * 1000
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(`${validade}T00:00:00`).getTime()
  if (Number.isNaN(fim)) return 999
  return Math.round((fim - hoje.getTime()) / msPorDia)
}

function rotuloValidade(validade: string): string {
  const dias = diasRestantes(validade)
  if (dias < 0) return `vencido há ${Math.abs(dias)}d`
  if (dias === 0) return 'vence hoje'
  if (dias <= 3) return `vence em ${dias}d`
  return `val. ${formatarValidade(validade)}`
}

function classeValidade(validade: string): string {
  const dias = diasRestantes(validade)
  if (dias < 0) return 'vencido'
  if (dias <= 3) return 'critica'
  if (dias <= 7) return 'atencao'
  return 'ok'
}

function progressoEstoque(total: number, alvo: number): number {
  if (alvo <= 0) return total > 0 ? 100 : 0
  return Math.min(100, Math.round((total / alvo) * 100))
}

function classeEstado(estado: string): string {
  if (estado === 'LIBERADO') return 'liberado'
  if (estado === 'QUARENTENA') return 'quarentena'
  if (estado === 'BLOQUEADO') return 'bloqueado'
  return 'outro'
}

function ok(mensagem: string): void {
  erro.value = ''
  sucesso.value = mensagem
}

function falha(e: unknown): void {
  sucesso.value = ''
  erro.value = e instanceof Error ? e.message : 'Não foi possível concluir.'
}

function confirmarTransferencia(): void {
  try {
    if (!trProdutoId.value || !trLote.value || trQtd.value === null) {
      erro.value = 'Informe produto, lote, origem, destino e quantidade.'
      return
    }
    const tr = store.transferirEstoque(
      trProdutoId.value,
      trLote.value,
      trOrigem.value,
      trDestino.value,
      trQtd.value,
      trMotivo.value,
      operador.value,
    )
    trQtd.value = null
    trMotivo.value = ''
    ok(`${tr.quantidade} de ${tr.produto} movidos para ${tr.destino}.`)
  } catch (e) {
    falha(e)
  }
}

function confirmarContagem(): void {
  try {
    if (!invProdutoId.value || !invLote.value || invContado.value === null) {
      erro.value = 'Informe produto, lote, local e contado.'
      return
    }
    const cg = store.registrarContagem(
      invProdutoId.value,
      invLote.value,
      invLocal.value,
      invContado.value,
      invMotivo.value,
      operador.value,
    )
    invContado.value = null
    ok(
      cg.diferenca === 0
        ? 'Contagem confere com o sistema.'
        : `Divergência de ${cg.diferenca} registrada — aguarda aprovação.`,
    )
  } catch (e) {
    falha(e)
  }
}

function aprovar(id: string): void {
  try {
    store.aprovarContagem(id, operador.value)
    ok('Divergência aprovada e saldo ajustado.')
  } catch (e) {
    falha(e)
  }
}

function cadastrarFornecedor(): void {
  try {
    if (!forNome.value.trim()) {
      erro.value = 'Informe o nome do fornecedor.'
      return
    }
    store.cadastrarFornecedor({ nome: forNome.value, contato: forContato.value })
    forNome.value = ''
    forContato.value = ''
    ok('Fornecedor cadastrado.')
  } catch (e) {
    falha(e)
  }
}

function adicionarItemPedido(): void {
  erro.value = ''
  const produto = store.produtos.find((p) => p.id === pedProdutoId.value)
  if (!produto || pedQtd.value === null) {
    erro.value = 'Selecione produto e quantidade.'
    return
  }
  itensPedido.value.push({
    produtoId: produto.id,
    produto: produto.nome,
    quantidade: pedQtd.value,
    custoUnitario: pedCusto.value ?? produto.custoMedio,
  })
  pedProdutoId.value = ''
  pedQtd.value = null
  pedCusto.value = null
}

function fecharPedido(): void {
  try {
    if (!pedFornecedorId.value) {
      erro.value = 'Selecione o fornecedor.'
      return
    }
    const pedido = store.criarPedido(pedFornecedorId.value, itensPedido.value, operador.value)
    itensPedido.value = []
    ok(`Pedido #${pedido.numero} aberto: ${formatarMoeda(pedido.valorTotal)}.`)
  } catch (e) {
    falha(e)
  }
}

function pedidoDaReposicao(): void {
  try {
    if (!pedFornecedorId.value) {
      erro.value = 'Selecione o fornecedor para gerar da reposição.'
      return
    }
    const pedido = store.criarPedidoDeReposicao(pedFornecedorId.value, operador.value)
    ok(`Pedido #${pedido.numero} gerado da reposição: ${pedido.itens.length} itens.`)
  } catch (e) {
    falha(e)
  }
}

function buscarRecall(): void {
  try {
    recallResultado.value = store.cadeiaCompletaDoLote(recallLote.value)
    erro.value = ''
  } catch (e) {
    recallResultado.value = null
    falha(e)
  }
}

function liberarLote(produtoId: string, lote: string): void {
  try {
    store.liberarQuarentena(produtoId, lote, operador.value)
    ok(`Lote ${lote} liberado da quarentena.`)
  } catch (e) {
    falha(e)
  }
}

function pedidoTotal(pedido: PedidoCompra): number {
  return pedido.valorTotal
}

function trocarStatus(pedidoId: string, status: string): void {
  try {
    store.atualizarStatusPedido(pedidoId, status as StatusPedido)
    ok('Status do pedido atualizado.')
  } catch (e) {
    falha(e)
  }
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <div class="pagina">
    <div class="cabecalho">
      <div>
        <div class="titulo">Estoque</div>
        <div class="subtitulo">Peças, cortes e insumos · livro de movimentos</div>
      </div>
    </div>

    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
    <div v-if="sucesso" class="sucesso" role="status">{{ sucesso }}</div>

    <div class="subabas">
      <button type="button" :class="{ ativa: subAba === 'visao' }" @click="subAba = 'visao'">Visão</button>
      <button type="button" :class="{ ativa: subAba === 'transferir' }" @click="subAba = 'transferir'">
        Transferir
      </button>
      <button type="button" :class="{ ativa: subAba === 'inventario' }" @click="subAba = 'inventario'">
        Inventário{{
          store.contagens.filter((c) => c.status === 'pendente').length
            ? ` (${store.contagens.filter((c) => c.status === 'pendente').length})`
            : ''
        }}
      </button>
      <button type="button" :class="{ ativa: subAba === 'fornecedores' }" @click="subAba = 'fornecedores'">
        Fornecedores
      </button>
      <button type="button" :class="{ ativa: subAba === 'recall' }" @click="subAba = 'recall'">Recall</button>
    </div>

    <!-- VISÃO -->
    <div v-if="subAba === 'visao'" class="visao">
      <div class="resumo-grade">
        <div class="resumo-card">
          <span>SKUs</span><strong>{{ resumoVisao.skus }}</strong>
        </div>
        <div class="resumo-card">
          <span>Carnes (kg)</span><strong>{{ resumoVisao.kg.toFixed(1) }} kg</strong>
        </div>
        <div class="resumo-card">
          <span>Unidades</span><strong>{{ resumoVisao.un }}</strong>
        </div>
        <div class="resumo-card" :class="{ alerta: resumoVisao.criticos > 0 }">
          <span>Críticos / zerados</span><strong>{{ resumoVisao.criticos }}</strong>
        </div>
        <div class="resumo-card" :class="{ alerta: resumoVisao.vencendo > 0 }">
          <span>Lotes vencendo</span><strong>{{ resumoVisao.vencendo }}</strong>
        </div>
      </div>

      <div class="filtros-visao">
        <input
          v-model="buscaVisao"
          type="text"
          placeholder="Buscar produto…"
          class="input-busca"
          aria-label="Buscar produto no estoque"
        />
        <div class="segmentado" role="group" aria-label="Filtrar por situação">
          <button type="button" :class="{ ativo: filtroVisao === 'todos' }" @click="filtroVisao = 'todos'">
            Todos
          </button>
          <button
            type="button"
            :class="{ ativo: filtroVisao === 'criticos' }"
            @click="filtroVisao = 'criticos'"
          >
            Críticos
          </button>
          <button
            type="button"
            :class="{ ativo: filtroVisao === 'zerados' }"
            @click="filtroVisao = 'zerados'"
          >
            Zerados
          </button>
          <button
            type="button"
            :class="{ ativo: filtroVisao === 'vencendo' }"
            @click="filtroVisao = 'vencendo'"
          >
            Vencendo
          </button>
        </div>
      </div>

      <div v-if="produtosVisao.length === 0" class="cartao vazio">
        Nenhum produto neste filtro — ajuste a busca.
      </div>

      <div class="grade-produtos">
        <article
          v-for="{ produto: p, total } in produtosVisao"
          :key="p.id"
          class="card-produto"
          :class="statusDoProduto(p.id, total, p.estoqueMinimo)"
        >
          <div class="card-topo">
            <div class="card-titulos">
              <strong class="card-nome">{{ p.nome }}</strong>
              <span class="card-meta"
                >{{ p.grupo ?? p.categoria }}{{ p.subgrupo ? ` · ${p.subgrupo}` : '' }}</span
              >
              <span class="card-meta secundario"
                >{{ p.fornecedor ?? 'Sem fornecedor' }} ·
                {{ p.unidade === 'KG' ? 'venda por peso' : 'venda por unidade' }}</span
              >
            </div>
            <span class="badge-status" :class="statusDoProduto(p.id, total, p.estoqueMinimo)">{{
              ROTULO_STATUS_PRODUTO[statusDoProduto(p.id, total, p.estoqueMinimo)]
            }}</span>
          </div>

          <div class="card-total">
            <strong>{{ total }} {{ p.unidade === 'KG' ? 'kg' : 'un' }}</strong>
            <span>mín {{ p.estoqueMinimo }} · alvo {{ p.estoqueAlvo }}</span>
          </div>
          <div
            class="barra-estoque"
            role="img"
            :aria-label="`Estoque ${progressoEstoque(total, p.estoqueAlvo)}% do alvo`"
          >
            <span
              class="barra-preenchimento"
              :style="{ width: progressoEstoque(total, p.estoqueAlvo) + '%' }"
            />
          </div>

          <div v-if="p.lotes.length === 0" class="nota">
            Sem lotes — receba no Mercado → Administração → Recebimento.
          </div>
          <ul v-else class="lotes">
            <li v-for="l in p.lotes" :key="`${l.lote}-${localDoLote(l)}`" class="lote-linha">
              <span class="lote-ponto" :class="classeEstado(l.estado)" aria-hidden="true" />
              <div class="lote-info">
                <span class="lote-nome"
                  ><code>{{ l.lote }}</code> · {{ localDoLote(l) }}</span
                >
                <span class="lote-meta">
                  <span class="badge-lote" :class="classeEstado(l.estado)">{{ l.estado.toLowerCase() }}</span>
                  <span class="validade" :class="classeValidade(l.validade)">{{
                    rotuloValidade(l.validade)
                  }}</span>
                </span>
              </div>
              <strong class="lote-qtd"
                >{{ l.quantidade }}<small>{{ p.unidade === 'KG' ? ' kg' : ' un' }}</small></strong
              >
            </li>
          </ul>
        </article>
      </div>
    </div>

    <!-- TRANSFERIR -->
    <div v-if="subAba === 'transferir'" class="cartao">
      <div class="secao-titulo">Transferir entre locais</div>
      <div class="grade">
        <label class="campo"
          >Produto
          <select v-model="trProdutoId">
            <option value="" disabled>Selecionar…</option>
            <option v-for="p in store.produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </label>
        <label class="campo"
          >Lote
          <select v-model="trLote">
            <option value="" disabled>Selecionar…</option>
            <option v-for="l in lotesDoProduto" :key="`${l.lote}-${localDoLote(l)}`" :value="l.lote">
              {{ l.lote }} · {{ localDoLote(l) }} · {{ l.quantidade }}
            </option>
          </select>
        </label>
        <label class="campo"
          >Origem
          <select v-model="trOrigem">
            <option v-for="loc in LOCAIS_ESTOQUE" :key="loc" :value="loc">{{ loc }}</option>
          </select>
        </label>
        <label class="campo"
          >Destino
          <select v-model="trDestino">
            <option v-for="loc in LOCAIS_ESTOQUE" :key="loc" :value="loc">{{ loc }}</option>
          </select>
        </label>
        <label class="campo">Qtd<input v-model.number="trQtd" type="number" min="0" step="0.001" /></label>
        <label class="campo"
          >Motivo<input v-model="trMotivo" type="text" placeholder="ex.: abastecer balcão"
        /></label>
      </div>
      <button type="button" class="botao-primario" @click="confirmarTransferencia">Transferir</button>
      <div v-for="tr in store.transferencias" :key="tr.id" class="linha-simples">
        <span
          >{{ tr.produto }} · lote {{ tr.lote }} · {{ tr.origem }} → {{ tr.destino }} · {{ tr.motivo }}</span
        >
        <strong>{{ tr.quantidade }}</strong>
      </div>
    </div>

    <!-- INVENTÁRIO -->
    <div v-if="subAba === 'inventario'" class="cartao">
      <div class="secao-titulo">Contagem cíclica — divergência exige aprovação</div>
      <div class="grade">
        <label class="campo"
          >Produto
          <select v-model="invProdutoId">
            <option value="" disabled>Selecionar…</option>
            <option v-for="p in store.produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </label>
        <label class="campo">Lote<input v-model="invLote" type="text" placeholder="L…" /></label>
        <label class="campo"
          >Local
          <select v-model="invLocal">
            <option v-for="loc in LOCAIS_ESTOQUE" :key="loc" :value="loc">{{ loc }}</option>
          </select>
        </label>
        <label class="campo"
          >Contado<input v-model.number="invContado" type="number" min="0" step="0.001"
        /></label>
        <label class="campo"
          >Motivo<input v-model="invMotivo" type="text" placeholder="contagem cíclica"
        /></label>
      </div>
      <button type="button" class="botao-primario" @click="confirmarContagem">Registrar contagem</button>
      <div v-for="cg in store.contagens" :key="cg.id" class="linha-simples">
        <span
          >{{ cg.produto }} · lote {{ cg.lote }} · {{ cg.local }} · sistema {{ cg.sistema }} × contado
          {{ cg.contado }} · {{ cg.status }}</span
        >
        <span class="acoes-linha">
          <strong>{{ cg.diferenca > 0 ? '+' : '' }}{{ cg.diferenca }}</strong>
          <button
            v-if="cg.status === 'pendente'"
            type="button"
            class="link"
            :disabled="!podeAjustar"
            @click="aprovar(cg.id)"
          >
            aprovar
          </button>
        </span>
      </div>
      <div v-if="!podeAjustar" class="nota">Aprovação exige estoque.ajustar (dono/administrador).</div>
    </div>

    <!-- FORNECEDORES -->
    <div v-if="subAba === 'fornecedores'" class="cartao">
      <div class="secao-titulo">Fornecedores</div>
      <div class="grade">
        <label class="campo">Nome<input v-model="forNome" type="text" /></label>
        <label class="campo">Contato<input v-model="forContato" type="text" /></label>
      </div>
      <button type="button" class="botao-primario" @click="cadastrarFornecedor">Cadastrar fornecedor</button>
      <div v-for="f in store.fornecedores" :key="f.id" class="linha-simples">
        <span
          >{{ f.nome }}{{ f.contato ? ` · ${f.contato}` : ''
          }}{{ f.leadTimeDias ? ` · entrega em ${f.leadTimeDias}d` : '' }}</span
        >
      </div>

      <div class="secao-titulo espacar">Pedido de compra</div>
      <div class="grade">
        <label class="campo"
          >Fornecedor
          <select v-model="pedFornecedorId">
            <option value="" disabled>Selecionar…</option>
            <option v-for="f in store.fornecedores" :key="f.id" :value="f.id">{{ f.nome }}</option>
          </select>
        </label>
        <label class="campo"
          >Produto
          <select v-model="pedProdutoId">
            <option value="" disabled>Selecionar…</option>
            <option v-for="p in store.produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </label>
        <label class="campo">Qtd<input v-model.number="pedQtd" type="number" min="0" step="0.001" /></label>
        <label class="campo"
          >Custo unit. (R$)<input v-model.number="pedCusto" type="number" min="0" step="0.01"
        /></label>
      </div>
      <div class="botoes-linha">
        <button type="button" class="botao-secundario" @click="adicionarItemPedido">+ item</button>
        <button type="button" class="botao-secundario" @click="pedidoDaReposicao">Gerar da reposição</button>
        <button
          type="button"
          class="botao-primario"
          :disabled="itensPedido.length === 0"
          @click="fecharPedido"
        >
          Abrir pedido
        </button>
      </div>
      <div v-for="item in itensPedido" :key="item.produtoId" class="linha-simples">
        <span>{{ item.produto }} · {{ item.quantidade }}</span>
        <strong>{{ formatarMoeda(item.quantidade * item.custoUnitario) }}</strong>
      </div>

      <div class="secao-titulo espacar">Pedidos</div>
      <div v-for="ped in store.pedidos" :key="ped.id" class="linha-simples">
        <span
          >#{{ ped.numero }} · {{ ped.fornecedor }} · {{ ped.itens.length }} itens ·
          {{ ROTULO_STATUS[ped.status] }}</span
        >
        <span class="acoes-linha">
          <strong>{{ formatarMoeda(pedidoTotal(ped)) }}</strong>
          <select
            :value="ped.status"
            aria-label="Status do pedido"
            @change="trocarStatus(ped.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="aberto">aberto</option>
            <option value="recebido-parcial">recebido parcial</option>
            <option value="recebido">recebido</option>
            <option value="cancelado">cancelado</option>
          </select>
        </span>
      </div>
    </div>

    <!-- RECALL -->
    <div v-if="subAba === 'recall'" class="cartao">
      <div class="secao-titulo">Recall por lote — onde está e quem comprou</div>
      <div class="grade">
        <label class="campo">Lote<input v-model="recallLote" type="text" placeholder="ex.: L2408" /></label>
      </div>
      <button type="button" class="botao-primario" @click="buscarRecall">Rastrear lote</button>
      <template v-if="recallResultado">
        <div class="linha-simples">
          <span>Produto</span><strong>{{ recallResultado.produto ?? '—' }}</strong>
        </div>
        <div v-if="recallResultado.estoquePorLocal.length === 0" class="nota">
          Sem estoque atual deste lote.
        </div>
        <div v-for="(e, i) in recallResultado.estoquePorLocal" :key="i" class="linha-simples">
          <span>{{ e.local }} · {{ e.estado }}</span
          ><strong>{{ e.quantidade }}</strong>
        </div>
        <div class="secao-titulo espacar">Vendas afetadas ({{ recallResultado.vendas.length }})</div>
        <div v-if="recallResultado.vendas.length === 0" class="nota">Nenhuma venda com este lote.</div>
        <div v-for="v in recallResultado.vendas" :key="v.numero" class="linha-simples">
          <span
            >venda #{{ v.numero }} · {{ dataCurta(v.criadaEm) }} · {{ v.operador
            }}{{ v.clienteNome ? ` · ${v.clienteNome}` : '' }}</span
          >
          <strong>{{ v.quantidade }}</strong>
        </div>
        <div
          v-if="
            'movimentos' in recallResultado &&
            (
              recallResultado as {
                movimentos?: Array<{ id: string; tipo: string; motivo: string; quantidade: number }>
              }
            ).movimentos?.length
          "
          class="secao-titulo espacar"
        >
          Cadeia do lote (livro)
        </div>
        <div
          v-for="m in (
            recallResultado as {
              movimentos?: Array<{ id: string; tipo: string; motivo: string; quantidade: number }>
            }
          ).movimentos ?? []"
          :key="m.id"
          class="linha-simples"
        >
          <span>{{ m.tipo }} · {{ m.motivo }}</span
          ><strong>{{ m.quantidade }}</strong>
        </div>
      </template>
    </div>
    <!-- QUARENTENA -->
    <div v-if="subAba === 'visao'" class="cartao">
      <div class="secao-titulo">Quarentena — lotes aguardando liberação</div>
      <div class="nota">Lotes recebidos com divergência ficam bloqueados até conferência.</div>
      <template v-for="p in store.produtos" :key="p.id">
        <div
          v-for="l in p.lotes.filter((x) => x.estado === 'QUARENTENA')"
          :key="`${p.id}-${l.lote}`"
          class="linha-simples"
        >
          <span>{{ p.nome }} · lote {{ l.lote }} · {{ l.motivoBloqueio ?? 'em conferência' }}</span>
          <button type="button" class="link" :disabled="!podeAjustar" @click="liberarLote(p.id, l.lote)">
            liberar
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pagina {
  padding: 36px 44px 60px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
@media (max-width: 640px) {
  .pagina {
    padding: 24px 16px 90px;
  }
}
.cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.titulo {
  font-family: var(--fonte-display);
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}
.subtitulo {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}
.erro,
.sucesso {
  font-size: 13px;
  border-radius: 10px;
  padding: 10px 14px;
}
.erro {
  color: var(--cor-error);
  background: var(--cor-error-container);
}
.sucesso {
  color: var(--cor-success);
  background: var(--cor-surface-variant);
}
.subabas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.subabas button {
  padding: 9px 16px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface-variant);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.subabas button.ativa {
  background: var(--cor-primary-container);
  color: var(--cor-on-primary-container);
  border-color: transparent;
}
.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.secao-titulo {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-on-surface);
}
.secao-titulo.espacar {
  margin-top: 8px;
}
.bloco {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  border-top: 1px solid var(--cor-outline);
}
.linha-topo {
  display: flex;
  justify-content: space-between;
  font-size: 13.5px;
  color: var(--cor-on-surface);
}
.linha-simples {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--cor-on-surface);
  padding: 8px 0;
  border-top: 1px solid var(--cor-outline);
}
.acoes-linha {
  display: flex;
  gap: 10px;
  align-items: center;
}
.acoes-linha select {
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 12px;
}
.grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}
.campo input,
.campo select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13px;
}
.nota {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
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
.link:disabled {
  opacity: 0.5;
  cursor: default;
}
.botoes-linha {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.botao-primario {
  align-self: flex-start;
  padding: 11px 20px;
  border: none;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.botao-primario:disabled {
  opacity: 0.5;
  cursor: default;
}
.botao-secundario {
  padding: 11px 20px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* --- Visão: resumo + cards por produto --- */
.visao {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.resumo-grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}
.resumo-card {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.resumo-card span {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}
.resumo-card strong {
  font-family: var(--fonte-display);
  font-size: 20px;
  color: var(--cor-on-surface);
}
.resumo-card.alerta {
  border-color: var(--cor-error);
}
.resumo-card.alerta strong {
  color: var(--cor-error);
}
.filtros-visao {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.input-busca {
  flex: 1;
  min-width: 200px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
}
.segmentado {
  display: inline-flex;
  border: 1px solid var(--cor-outline);
  border-radius: 100px;
  overflow: hidden;
  background: var(--cor-surface);
}
.segmentado button {
  border: none;
  background: transparent;
  padding: 10px 14px;
  min-height: 44px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--cor-on-surface-variant);
  cursor: pointer;
  white-space: nowrap;
}
.segmentado button.ativo {
  background: var(--cor-primary-container);
  color: var(--cor-on-primary-container);
}
.grade-produtos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.card-produto {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-left: 4px solid var(--cor-outline);
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card-produto.ok {
  border-left-color: var(--cor-success);
}
.card-produto.critico {
  border-left-color: var(--cor-error);
}
.card-produto.zerado {
  border-left-color: var(--cor-error);
  background: color-mix(in srgb, var(--cor-error-container) 35%, var(--cor-surface));
}
.card-topo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.card-titulos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.card-nome {
  font-size: 15px;
  font-weight: 700;
  color: var(--cor-on-surface);
}
.card-meta {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}
.card-meta.secundario {
  font-size: 11.5px;
  opacity: 0.9;
}
.badge-status {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 100px;
  flex-shrink: 0;
}
.badge-status.ok {
  color: var(--cor-success);
  background: var(--cor-surface-variant);
}
.badge-status.critico {
  color: var(--cor-error);
  background: var(--cor-error-container);
}
.badge-status.zerado {
  color: #fff;
  background: var(--cor-error);
}
.card-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.card-total strong {
  font-family: var(--fonte-display);
  font-size: 24px;
  color: var(--cor-on-surface);
}
.card-total span {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}
.barra-estoque {
  height: 6px;
  border-radius: 100px;
  background: var(--cor-surface-variant);
  overflow: hidden;
}
.barra-preenchimento {
  display: block;
  height: 100%;
  background: var(--cor-primary);
  border-radius: 100px;
}
.card-produto.critico .barra-preenchimento,
.card-produto.zerado .barra-preenchimento {
  background: var(--cor-error);
}
.lotes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.lote-linha {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--cor-outline);
}
.lote-ponto {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--cor-outline);
}
.lote-ponto.liberado {
  background: var(--cor-success);
}
.lote-ponto.quarentena {
  background: var(--cor-secondary);
}
.lote-ponto.bloqueado {
  background: var(--cor-error);
}
.lote-ponto.outro {
  background: var(--cor-on-surface-variant);
}
.lote-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.lote-nome {
  font-size: 13px;
  color: var(--cor-on-surface);
}
.lote-nome code {
  font-family: ui-monospace, monospace;
  font-size: 12.5px;
  background: var(--cor-surface-variant);
  padding: 1px 6px;
  border-radius: 6px;
}
.lote-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 11.5px;
  color: var(--cor-on-surface-variant);
}
.badge-lote {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 100px;
  background: var(--cor-surface-variant);
  color: var(--cor-on-surface-variant);
}
.badge-lote.liberado {
  color: var(--cor-success);
}
.badge-lote.quarentena {
  color: var(--cor-secondary);
}
.badge-lote.bloqueado {
  color: var(--cor-error);
  background: var(--cor-error-container);
}
.validade.ok {
  color: var(--cor-on-surface-variant);
}
.validade.atencao {
  color: var(--cor-secondary);
  font-weight: 600;
}
.validade.critica {
  color: var(--cor-error);
  font-weight: 700;
}
.validade.vencido {
  color: #fff;
  background: var(--cor-error);
  padding: 1px 8px;
  border-radius: 100px;
  font-weight: 700;
}
.lote-qtd {
  font-size: 14px;
  color: var(--cor-on-surface);
  white-space: nowrap;
}
.lote-qtd small {
  font-size: 11px;
  color: var(--cor-on-surface-variant);
  font-weight: 400;
}
.cartao.vazio {
  align-items: center;
  text-align: center;
}
@media (max-width: 640px) {
  .grade-produtos {
    grid-template-columns: 1fr;
  }
}
</style>
