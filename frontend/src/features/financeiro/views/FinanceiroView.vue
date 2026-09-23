<script setup lang="ts">
import { computed, ref } from 'vue'
import GraficoBarras, { type BarraDoGrafico } from '../../../shared/components/GraficoBarras.vue'
import GraficoDonut from '../../../shared/components/GraficoDonut.vue'
import GraficoLinha from '../../../shared/components/GraficoLinha.vue'
import GraficoWaterfall from '../../../shared/components/GraficoWaterfall.vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useModoDetalhado } from '../../../shared/composables/useModoDetalhado'
import { useAuthStore } from '../../auth/store/auth.store'
import { useDesossaStore } from '../../desossa-subprodutos/store/desossa.store'
import { useMercadoStore } from '../../mercado/store/mercado.store'
import { useFinanceiroStore } from '../store/financeiro.store'
import {
  agregar,
  curvaABC,
  fiadoVsLucro,
  filtrarDias,
  margemMediaItens,
  montarDre,
  pontoDeEquilibrio,
  resumirDesperdicios,
  serieResultadoDiario,
} from '../logica/financeiro'
import {
  compararComAnterior,
  despesasPorCategoria,
  estoqueValorizado,
  fluxoCaixa,
  prazoMedioRecebimento,
  projetarCaixa,
  resumirRendimento,
  saldoAcumulado,
  serieResultado,
  waterfallDre,
} from '../logica/detalhamento'
import {
  filtrarVendas,
  margemRealPorProduto,
  perdasPorGrupo,
  relatorioPorFornecedor,
  relatorioPorGrupo,
  relatorioPorHora,
  relatorioPorOperador,
  relatorioPorPagamento,
  resumirAuditoria,
} from '../logica/relatorios'
import { GRUPOS_COMERCIAIS } from '../../mercado/logica/grupos'
import {
  CUSTOS_MOCK,
  DIAS_MOCK,
  FIADO_AGING_MOCK,
  MARGEM_POR_ITEM_MOCK,
  ROTULO_MOTIVO_DESPERDICIO,
  type Desperdicio,
  type Granularidade,
  type Periodo,
  type StatusConta,
  type Visao,
} from '../mock/financeiro.mock'

type Aba = 'resumo' | 'dre' | 'desperdicios' | 'itens' | 'contas' | 'fiado' | 'detalhe' | 'relatorios'

const { formatarMoeda, formatarPercentual } = useFormatador()
const auth = useAuthStore()
const mercado = useMercadoStore()
const fin = useFinanceiroStore()
const desossa = useDesossaStore()
const { modo, definir } = useModoDetalhado()

const visaoSimples = computed(() => modo.value === 'simples' && auth.papel === 'PROPRIETARIO')

const aba = ref<Aba>('resumo')
const periodo = ref<Periodo>('14d')
const visao = ref<Visao>('competencia')
const granularidade = ref<Granularidade>('semana')

const podeVerMargem = computed(() => auth.temPermissao('financeiro.ver_margem'))
const podeLancar = computed(() => auth.temPermissao('financeiro.lancar'))
const podePagar = computed(() => auth.temPermissao('financeiro.pagar'))

// --- dados reativos (mock editável na sessão) ---
const desperdicios = computed(() => fin.desperdicios)
const contas = computed(() => fin.contas)

// --- novo custo fixo ---
const cfDesc = ref('')
const cfCategoria = ref('Pessoal')
const cfCentro = ref('Administração')
const cfValor = ref<number | null>(null)
const erroCf = ref('')

// --- novo desperdício ---
const novoDespProduto = ref('')
const novoDespQtd = ref<number | null>(null)
const novoDespCusto = ref<number | null>(null)
const novoDespMotivo = ref<Desperdicio['motivo']>('validade')
const erroDesp = ref('')

// --- nova conta ---
const novaContaDesc = ref('')
const novaContaValor = ref<number | null>(null)
const novaContaVenc = ref('')
const novaContaTipo = ref<'pagar' | 'receber'>('pagar')
const erroConta = ref('')

// --- parâmetros (adicionar informações) ---
const margemAlvo = ref(0.3)
const custosFixos = ref(34900)
const indiceMC = ref(0.4)

const dias = computed(() => filtrarDias(DIAS_MOCK, periodo.value))
const totalDesperdicio = computed(() => desperdicios.value.reduce((soma, d) => soma + d.valor, 0))
const resumo = computed(() => agregar(dias.value, totalDesperdicio.value))
const dre = computed(() => montarDre(resumo.value, visao.value))
const resumoDesp = computed(() => resumirDesperdicios(desperdicios.value, resumo.value.receita))
const comparador = computed(() => fiadoVsLucro(DIAS_MOCK, granularidade.value))
const mediaMargem = computed(() => margemMediaItens(MARGEM_POR_ITEM_MOCK))
const abc = computed(() => curvaABC(MARGEM_POR_ITEM_MOCK))
const pe = computed(() => pontoDeEquilibrio(custosFixos.value, indiceMC.value))

const ROTULO_PERIODO: Record<Periodo, string> = { hoje: 'Hoje', '14d': '14 dias', '90d': '90 dias' }

const receitaExibida = computed(() => (visao.value === 'caixa' ? resumo.value.receitaRecebida : resumo.value.receita))

const barrasFluxo = computed<BarraDoGrafico[]>(() =>
  serieResultadoDiario(dias.value.slice(-14)).map((ponto) => ({
    label: ponto.data.slice(5).split('-').reverse().join('/'),
    valor: ponto.valor,
    valorLabel: formatarMoedaCompacto(ponto.valor),
    destaque: ponto.valor < 0,
  })),
)

const barrasComparador = computed<BarraDoGrafico[]>(() =>
  comparador.value.map((ponto) => ({
    label: ponto.rotulo,
    valor: ponto.lucro,
    valorLabel: formatarMoedaCompacto(ponto.lucro),
  })),
)

const totalCustos = computed(() => CUSTOS_MOCK.reduce((soma, custo) => soma + custo.valor, 0))
const totalAging = computed(() => FIADO_AGING_MOCK.reduce((soma, f) => soma + f.valor, 0))
const contasPagar = computed(() => contas.value.filter((c) => c.tipo === 'pagar'))
const contasReceber = computed(() => contas.value.filter((c) => c.tipo === 'receber'))

/** Alerta financeiro principal do modo simples: vencidas → margem → desperdício. */
const alertaFinanceiro = computed(() => {
  const vencidas = contas.value.filter((c) => c.status === 'vencido').length
  if (vencidas > 0) return `${vencidas} conta${vencidas > 1 ? 's' : ''} vencida${vencidas > 1 ? 's' : ''} — ver Contas`
  if (resumo.value.margemLiquida !== null && resumo.value.margemLiquida < 0.1) {
    return `Margem líquida em ${formatarPercentual(resumo.value.margemLiquida)} — ver DRE`
  }
  if (resumo.value.receita > 0 && resumo.value.desperdicio / resumo.value.receita > 0.05) {
    return `Desperdício em ${formatarMoeda(resumo.value.desperdicio)} — ver Desperdícios`
  }
  return 'Finanças sob controle — nada urgente.'
})

const ROTULO_STATUS: Record<StatusConta, string> = {
  previsto: 'previsto',
  a_vencer: 'a vencer',
  vencido: 'vencido',
  pago: 'pago',
  cancelado: 'cancelado',
}

function formatarMoedaCompacto(valor: number): string {
  if (Math.abs(valor) >= 1000) return `${valor < 0 ? '−' : ''}R$ ${(Math.abs(valor) / 1000).toFixed(1)}k`
  return formatarMoeda(valor)
}

function adicionarDesperdicio(): void {
  erroDesp.value = ''
  if (!podeLancar.value) {
    erroDesp.value = 'Sem permissão para lançar (financeiro.lancar).'
    return
  }
  if (!novoDespProduto.value.trim() || novoDespQtd.value === null || novoDespCusto.value === null) {
    erroDesp.value = 'Informe produto, quantidade e custo unitário.'
    return
  }
  if (novoDespQtd.value <= 0 || novoDespCusto.value < 0) {
    erroDesp.value = 'Quantidade deve ser maior que zero.'
    return
  }
  try {
    fin.adicionarDesperdicio({
      produto: novoDespProduto.value.trim(),
      lote: '—',
      quantidade: novoDespQtd.value,
      unidade: 'kg',
      custoUnitario: novoDespCusto.value,
      valor: Math.round(novoDespQtd.value * novoDespCusto.value * 100) / 100,
      motivo: novoDespMotivo.value,
      area: 'Balcão',
      data: new Date().toISOString().slice(0, 10),
      responsavel: auth.usuario?.nome ?? 'operador',
    })
    novoDespProduto.value = ''
    novoDespQtd.value = null
    novoDespCusto.value = null
  } catch (e) {
    erroDesp.value = e instanceof Error ? e.message : 'Não foi possível registrar.'
  }
}

function adicionarConta(): void {
  erroConta.value = ''
  if (!podeLancar.value) {
    erroConta.value = 'Sem permissão para lançar (financeiro.lancar).'
    return
  }
  try {
    fin.adicionarConta({ descricao: novaContaDesc.value, valor: novaContaValor.value ?? 0, vencimento: novaContaVenc.value, tipo: novaContaTipo.value })
    novaContaDesc.value = ''
    novaContaValor.value = null
    novaContaVenc.value = ''
  } catch (e) {
    erroConta.value = e instanceof Error ? e.message : 'Não foi possível adicionar.'
  }
}

function pagarConta(id: string): void {
  if (!podePagar.value) return
  try {
    fin.pagarConta(id)
  } catch {
    // mantém silencioso — lista já mostra estado
  }
}

function adicionarCustoFixo(): void {
  erroCf.value = ''
  if (!podeLancar.value) {
    erroCf.value = 'Sem permissão para lançar (financeiro.lancar).'
    return
  }
  try {
    fin.adicionarCustoFixo(
      { descricao: cfDesc.value, categoria: cfCategoria.value, centroCusto: cfCentro.value, valorMensal: cfValor.value ?? 0 },
      auth.usuario?.nome ?? 'admin',
    )
    cfDesc.value = ''
    cfValor.value = null
  } catch (e) {
    erroCf.value = e instanceof Error ? e.message : 'Não foi possível adicionar.'
  }
}

const dreRealTurno = computed(() => fin.dreReal(mercado.resumoOperacional.receita, mercado.resumoOperacional.cmv, mercado.resumoOperacional.desperdicio))

// --- Detalhamento financeiro (gráficos e relatórios) ---
const CORES_DONUT = ['var(--cor-primary)', 'var(--cor-secondary)', '#7c6cf0', '#2e9e6b', '#c98a1b', '#b0526b', '#6b7a90']

const serie = computed(() => serieResultado(dias.value))
const linhasResultado = computed(() => [
  { nome: 'Receita', cor: 'var(--cor-primary)', valores: serie.value.receita },
  { nome: 'CMV', cor: 'var(--cor-error)', valores: serie.value.cmv },
  { nome: 'Lucro', cor: 'var(--cor-secondary)', valores: serie.value.lucro },
])
const degrausDre = computed(() => waterfallDre(resumo.value))
const fluxo = computed(() => fluxoCaixa(dias.value))
const fluxoAcumulado = computed(() => saldoAcumulado(fluxo.value))
const linhasFluxo = computed(() => [
  { nome: 'Entradas', cor: 'var(--cor-primary)', valores: fluxo.value.map((f) => f.entradas) },
  { nome: 'Saídas', cor: 'var(--cor-error)', valores: fluxo.value.map((f) => f.saidas) },
])
const rotulosFluxo = computed(() => fluxo.value.map((f) => f.data.slice(5).split('-').reverse().join('/')))
const projecaoCaixa = computed(() => projetarCaixa(fluxo.value, 30))
const fatiasDespesa = computed(() => despesasPorCategoria(CUSTOS_MOCK, fin.custosFixos))
const fatiasDonut = computed(() =>
  fatiasDespesa.value.map((f, i) => ({ label: f.categoria, percentual: f.percentual, cor: CORES_DONUT[i % CORES_DONUT.length] })),
)
const totalDespesasDonut = computed(() => fatiasDespesa.value.reduce((s, f) => s + f.valor, 0))
const estoqueVal = computed(() => estoqueValorizado(mercado.produtos))
const rendimento = computed(() => resumirRendimento(desossa.ordensConcluidas))
const comparativo = computed(() => compararComAnterior(DIAS_MOCK, dias.value))
const pmr = computed(() => {
  const receitaDiaria = dias.value.length > 0 ? resumo.value.receita / dias.value.length : 0
  return prazoMedioRecebimento(resumo.value.saldoFiadoFinal, receitaDiaria)
})
const barrasAging = computed<BarraDoGrafico[]>(() =>
  FIADO_AGING_MOCK.map((f) => ({ label: f.faixa, valor: f.valor, valorLabel: formatarMoedaCompacto(f.valor) })),
)
const margemTop = computed(() => curvaABC(MARGEM_POR_ITEM_MOCK).slice(0, 5))
const maxMargemTop = computed(() => Math.max(1, ...margemTop.value.map((i) => i.margem)))

// --- Relatórios gerenciais (vendas reais + filtros combináveis) ---
const filtroGrupo = ref('')
const filtroSubgrupo = ref('')
const filtroForma = ref('')
const filtroOperador = ref('')

const gruposDisponiveis = computed(() => GRUPOS_COMERCIAIS.map((g) => g.grupo))
const subgruposDisponiveis = computed(() => {
  if (!filtroGrupo.value) return [...new Set(mercado.produtos.map((p) => p.subgrupo ?? 'Geral'))]
  return GRUPOS_COMERCIAIS.find((g) => g.grupo === filtroGrupo.value)?.subgrupos ?? []
})
const formasDisponiveis = computed(() => [...new Set(mercado.vendas.map((v) => v.pagamento.forma))])
const operadoresDisponiveis = computed(() => [...new Set(mercado.vendas.map((v) => v.operador))])

const vendasFiltradas = computed(() =>
  filtrarVendas(mercado.vendas, mercado.produtos, {
    grupo: filtroGrupo.value || undefined,
    subgrupo: filtroSubgrupo.value || undefined,
    forma: filtroForma.value || undefined,
    operador: filtroOperador.value || undefined,
  }),
)
const relGrupo = computed(() => relatorioPorGrupo(vendasFiltradas.value, mercado.produtos))
const relHora = computed(() => relatorioPorHora(vendasFiltradas.value, mercado.produtos))
const relOperador = computed(() => relatorioPorOperador(vendasFiltradas.value))
const relPagamento = computed(() => relatorioPorPagamento(vendasFiltradas.value))
const relFornecedor = computed(() => relatorioPorFornecedor(vendasFiltradas.value, mercado.produtos))
const relMargemReal = computed(() => margemRealPorProduto(vendasFiltradas.value, mercado.produtos))
const relPerdasGrupo = computed(() => perdasPorGrupo(mercado.perdas, mercado.produtos))
const resumoAud = computed(() => resumirAuditoria(vendasFiltradas.value, mercado.devolucoes))
const maxHoraReceita = computed(() => Math.max(1, ...relHora.value.map((h) => h.receita)))
const horasComMovimento = computed(() => relHora.value.filter((h) => h.vendas > 0 || h.cancelamentos > 0))
const barrasHora = computed<BarraDoGrafico[]>(() =>
  relHora.value.filter((h) => h.vendas > 0).map((h) => ({
    label: `${String(h.hora).padStart(2, '0')}h`,
    valor: h.receita,
    valorLabel: formatarMoedaCompacto(h.receita),
  })),
)

function limparFiltrosRel(): void {
  filtroGrupo.value = ''
  filtroSubgrupo.value = ''
  filtroForma.value = ''
  filtroOperador.value = ''
}

function carregarDemoFin(): void {
  try {
    mercado.carregarVendasDemonstracao(auth.usuario?.nome ?? 'demo')
    fin.carregarExemplo(auth.usuario?.nome ?? 'demo')
  } catch (e) {
    erroConta.value = e instanceof Error ? e.message : 'Não foi possível carregar a demonstração.'
  }
}

function exportarCSV(): void {
  const linhas = ['aba;descricao;valor', ...dre.value.map((l) => `dre;${l.rotulo};${l.valor}`)]
  const blob = new Blob([linhas.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'financas-mercado.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportarDetalhado(): void {
  const linhas = [
    'secao;descricao;valor',
    ...dre.value.map((l) => `dre;${l.rotulo};${l.valor}`),
    ...fatiasDespesa.value.map((f) => `despesas;${f.categoria};${f.valor}`),
    ...resumoDesp.value.porMotivo.map((m) => `perdas;${m.motivo};${m.valor}`),
    ...FIADO_AGING_MOCK.map((f) => `fiado-aging;${f.faixa};${f.valor}`),
    ...estoqueVal.value.itens.map((i) => `estoque;${i.produto};${i.valor}`),
    `resumo;receita;${resumo.value.receita}`,
    `resumo;lucro_liquido;${resumo.value.lucroLiquido}`,
    `resumo;projecao_caixa_30d;${projecaoCaixa.value ?? 0}`,
  ]
  const blob = new Blob([linhas.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'detalhamento-financeiro.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportarRelatorios(): void {
  const linhas = [
    'secao;grupo;subgrupo;receita;cmv;lucro;margem;desconto;vendas;participacao;abc',
    ...relGrupo.value.map((l) =>
      `grupo;${l.grupo};${l.subgrupo};${l.receita};${l.cmv};${l.lucro};${l.margem ?? ''};${l.desconto};${l.vendas};${(l.participacao * 100).toFixed(1)}%;${l.classeABC}`,
    ),
    'hora;vendas;receita;ticket;cmv;lucro;desconto;cancelamentos',
    ...relHora.value.map((h) =>
      `hora-${String(h.hora).padStart(2, '0')};${h.vendas};${h.receita};${h.ticketMedio ?? ''};${h.cmv};${h.lucro};${h.desconto};${h.cancelamentos}`,
    ),
    'operador;vendas;receita;ticket;desconto;cancelamentos',
    ...relOperador.value.map((o) => `operador;${o.operador};${o.vendas};${o.receita};${o.ticketMedio ?? ''};${o.desconto};${o.cancelamentos}`),
    'pagamento;vendas;receita;participacao',
    ...relPagamento.value.map((p) => `pagamento;${p.forma};${p.vendas};${p.receita};${(p.participacao * 100).toFixed(1)}%`),
    'fornecedor;receita;cmv;lucro;margem',
    ...relFornecedor.value.map((f) => `fornecedor;${f.fornecedor};${f.receita};${f.cmv};${f.lucro};${f.margem ?? ''}`),
    'margem-real;produto;grupo;subgrupo;receita;cmv;lucro;abc',
    ...relMargemReal.value.map((m) => `margem;${m.produto};${m.grupo};${m.subgrupo};${m.receita};${m.cmv};${m.lucro};${m.classeABC}`),
  ]
  const blob = new Blob([linhas.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'relatorios-gerenciais.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="pagina">
    <div class="cabecalho">
      <div>
        <div class="titulo">Finanças — Mercado</div>
        <div class="subtitulo">Açougue · sem salão · visão gerencial</div>
      </div>
      <div class="filtros">
        <div class="segmentado">
          <button
            v-for="opcao in (['hoje', '14d', '90d'] as Periodo[])"
            :key="opcao"
            type="button"
            :class="{ ativo: periodo === opcao }"
            @click="periodo = opcao"
          >
            {{ ROTULO_PERIODO[opcao] }}
          </button>
        </div>
        <div class="segmentado">
          <button type="button" :class="{ ativo: visao === 'competencia' }" @click="visao = 'competencia'">
            Competência
          </button>
          <button type="button" :class="{ ativo: visao === 'caixa' }" @click="visao = 'caixa'">Caixa</button>
        </div>
        <button type="button" class="botao-exportar" @click="exportarCSV">Exportar CSV</button>
      </div>
    </div>

    <!-- MODO SIMPLES (dono): estado + alerta + ação -->
    <template v-if="visaoSimples">
      <div class="cartoes">
        <div class="cartao">
          <span>Receita (Mercado)</span>
          <strong>{{ formatarMoeda(receitaExibida) }}</strong>
        </div>
        <div class="cartao">
          <span>Lucro líquido</span>
          <strong>{{ formatarMoeda(dre[dre.length - 1].valor) }}</strong>
        </div>
        <div class="cartao">
          <span>Fiado em aberto</span>
          <strong>{{ formatarMoeda(resumo.saldoFiadoFinal) }}</strong>
        </div>
      </div>
      <div class="cartao-secao">
        <div class="secao-titulo">Alerta financeiro</div>
        <div class="legenda">{{ alertaFinanceiro }}</div>
        <div class="legenda">Resultado diário (últimos 14 dias)</div>
        <GraficoBarras :dados="barrasFluxo" />
        <div v-if="mercado.vendas.length === 0" class="legenda">
          Sem vendas no turno — o DRE real fica zerado.
          <button type="button" class="link" @click="carregarDemoFin">carregar demonstração</button>
        </div>
        <button type="button" class="botao-primario" @click="definir('detalhado')">
          Ver DRE, gráficos e detalhes →
        </button>
      </div>
    </template>

    <template v-else>
    <div class="abas">
      <button type="button" :class="{ ativa: aba === 'resumo' }" @click="aba = 'resumo'">Resumo</button>
      <button type="button" :class="{ ativa: aba === 'dre' }" @click="aba = 'dre'">DRE</button>
      <button type="button" :class="{ ativa: aba === 'desperdicios' }" @click="aba = 'desperdicios'">
        Desperdícios · {{ formatarMoeda(totalDesperdicio) }}
      </button>
      <button type="button" :class="{ ativa: aba === 'itens' }" @click="aba = 'itens'">Lucro por item</button>
      <button type="button" :class="{ ativa: aba === 'contas' }" @click="aba = 'contas'">Contas</button>
      <button type="button" :class="{ ativa: aba === 'fiado' }" @click="aba = 'fiado'">Fiado</button>
      <button type="button" :class="{ ativa: aba === 'detalhe' }" @click="aba = 'detalhe'">Detalhamento</button>
      <button type="button" :class="{ ativa: aba === 'relatorios' }" @click="aba = 'relatorios'">Relatórios</button>
    </div>

    <!-- RESUMO -->
    <template v-if="aba === 'resumo'">
      <div class="cartao-secao destaque-real">
        <div class="secao-titulo">Turno atual — operação real</div>
        <div class="legenda">Vendas, CMV, margem e perdas da sessão (fonte única do Mercado).</div>
        <div class="cartoes">
          <div class="cartao"><span>Receita real</span><strong>{{ formatarMoeda(mercado.resumoOperacional.receita) }}</strong></div>
          <div class="cartao"><span>CMV real</span><strong>{{ formatarMoeda(mercado.resumoOperacional.cmv) }}</strong></div>
          <div class="cartao"><span>Margem real</span><strong>{{ formatarMoeda(mercado.resumoOperacional.margem) }}</strong></div>
          <div class="cartao"><span>Perdas sessão</span><strong>{{ formatarMoeda(mercado.resumoOperacional.desperdicio) }}</strong></div>
        </div>
        <div class="legenda">DRE real do turno: lucro {{ formatarMoeda(dreRealTurno.lucroLiquido) }} · fixos {{ formatarMoeda(dreRealTurno.custosFixos) }} · contas pagas {{ formatarMoeda(dreRealTurno.contasPagas) }}</div>
        <div v-if="mercado.vendas.length === 0" class="legenda">
          Sem vendas no turno — <button type="button" class="link" @click="carregarDemoFin">carregar demonstração</button> para visualizar.
        </div>
      </div>
      <div class="cartao-secao">
        <div class="secao-titulo">Custos fixos mensais — {{ formatarMoeda(fin.totalCustosFixosAtivos) }}/mês</div>
        <div class="grade-params">
          <label class="campo">Descrição<input v-model="cfDesc" type="text" placeholder="ex.: Aluguel" /></label>
          <label class="campo">Categoria<input v-model="cfCategoria" type="text" /></label>
          <label class="campo">Valor/mês (R$)<input v-model.number="cfValor" type="number" min="0" step="0.01" /></label>
        </div>
        <div v-if="erroCf" class="erro">{{ erroCf }}</div>
        <button type="button" class="botao-primario" :disabled="!podeLancar" @click="adicionarCustoFixo">Adicionar custo fixo</button>
        <div v-if="fin.custosFixos.length === 0" class="legenda">Nenhum custo fixo cadastrado — cadastre aluguel, folha, energia ou
          <button type="button" class="link" @click="fin.carregarExemplo(auth.usuario?.nome ?? 'demo')">usar exemplo</button>.
        </div>
        <div v-for="c in fin.custosFixos" :key="c.id" class="linha-custo">
          <span>{{ c.descricao }} · {{ c.categoria }} · {{ c.ativo ? 'ativo' : 'pausado' }}</span>
          <span class="acoes-conta"><strong>{{ formatarMoeda(c.valorMensal) }}/mês</strong>
            <button type="button" class="link" @click="fin.alternarCustoFixo(c.id)">{{ c.ativo ? 'pausar' : 'ativar' }}</button>
            <button type="button" class="link" @click="fin.removerCustoFixo(c.id)">excluir</button>
          </span>
        </div>
      </div>
      <div class="cartoes">
        <div class="cartao">
          <span>{{ visao === 'caixa' ? 'Receita recebida' : 'Receita (Mercado)' }}</span>
          <strong>{{ formatarMoeda(receitaExibida) }}</strong>
        </div>
        <div class="cartao">
          <span>Lucro líquido</span>
          <strong>{{ formatarMoeda(dre[dre.length - 1].valor) }}</strong>
        </div>
        <div class="cartao">
          <span>Margem líquida</span>
          <strong>{{ resumo.margemLiquida === null ? 'sem base' : formatarPercentual(resumo.margemLiquida) }}</strong>
        </div>
        <div class="cartao">
          <span>Fiado em aberto</span>
          <strong>{{ formatarMoeda(resumo.saldoFiadoFinal) }}</strong>
        </div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Resultado diário — últimos 14 dias</div>
        <GraficoBarras :dados="barrasFluxo" />
        <div class="legenda">
          Entradas {{ formatarMoeda(resumo.receita) }} · Saídas {{ formatarMoeda(resumo.cmv + resumo.despesas) }} ·
          Desperdício {{ formatarMoeda(resumo.desperdicio) }} · Saldo {{ formatarMoeda(resumo.lucroLiquido) }}
        </div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Parâmetros — ponto de equilíbrio</div>
        <div class="grade-params">
          <label class="campo">Margem alvo (0–0,9)<input v-model.number="margemAlvo" type="number" min="0" max="0.9" step="0.01" /></label>
          <label class="campo">Custos fixos/mês (R$)<input v-model.number="custosFixos" type="number" min="0" step="100" /></label>
          <label class="campo">Índice margem contribuição<input v-model.number="indiceMC" type="number" min="0" max="1" step="0.01" /></label>
        </div>
        <div class="legenda">Ponto de equilíbrio: <strong>{{ pe === null ? 'sem base' : formatarMoeda(pe) }}</strong>/mês</div>
      </div>
    </template>

    <!-- DRE -->
    <template v-if="aba === 'dre'">
      <div class="cartao-secao">
        <div class="secao-titulo">DRE gerencial — Mercado</div>
        <table class="tabela">
          <tbody>
            <tr v-for="linha in dre" :key="linha.rotulo" :class="{ destaque: linha.destaque }">
              <td>{{ linha.rotulo }}</td>
              <td>{{ formatarMoeda(linha.valor) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="cartao-secao">
        <div class="secao-titulo">Custos do mês — {{ formatarMoeda(totalCustos) }}</div>
        <div v-for="custo in CUSTOS_MOCK" :key="custo.descricao" class="linha-custo">
          <span>{{ custo.categoria }} · {{ custo.descricao }}</span>
          <strong>{{ formatarMoeda(custo.valor) }}</strong>
        </div>
      </div>
    </template>

    <!-- DESPERDÍCIOS -->
    <template v-if="aba === 'desperdicios'">
      <div class="cartoes">
        <div class="cartao"><span>Perda total</span><strong>{{ formatarMoeda(resumoDesp.totalReais) }}</strong></div>
        <div class="cartao"><span>Peso perdido</span><strong>{{ resumoDesp.totalKg.toFixed(1) }} kg</strong></div>
        <div class="cartao">
          <span>% da receita</span>
          <strong>{{ resumoDesp.percentualReceita === null ? 'sem base' : formatarPercentual(resumoDesp.percentualReceita) }}</strong>
        </div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Adicionar perda</div>
        <div v-if="!podeLancar" class="legenda">Sem permissão de lançamento — visualização apenas.</div>
        <div class="grade-params">
          <label class="campo">Produto<input v-model="novoDespProduto" type="text" placeholder="ex.: Picanha" /></label>
          <label class="campo">Qtd (kg)<input v-model.number="novoDespQtd" type="number" min="0" step="0.001" /></label>
          <label class="campo">Custo/kg (R$)<input v-model.number="novoDespCusto" type="number" min="0" step="0.01" /></label>
          <label class="campo">Motivo
            <select v-model="novoDespMotivo">
              <option v-for="(rotulo, valor) in ROTULO_MOTIVO_DESPERDICIO" :key="valor" :value="valor">{{ rotulo }}</option>
            </select>
          </label>
        </div>
        <div v-if="erroDesp" class="erro">{{ erroDesp }}</div>
        <button type="button" class="botao-primario" :disabled="!podeLancar" @click="adicionarDesperdicio">Registrar perda</button>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Ranking por motivo</div>
        <div v-for="item in resumoDesp.porMotivo" :key="item.motivo" class="linha-custo">
          <span>{{ ROTULO_MOTIVO_DESPERDICIO[item.motivo as keyof typeof ROTULO_MOTIVO_DESPERDICIO] ?? item.motivo }} · {{ item.quantidade.toFixed(1) }} kg</span>
          <strong>{{ formatarMoeda(item.valor) }}</strong>
        </div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Perdas registradas</div>
        <table class="tabela">
          <thead><tr><th>Produto</th><th>Motivo</th><th>Qtd</th><th>Valor</th></tr></thead>
          <tbody>
            <tr v-for="d in desperdicios" :key="d.id">
              <td>{{ d.produto }} · {{ d.lote }}</td>
              <td>{{ ROTULO_MOTIVO_DESPERDICIO[d.motivo] }}</td>
              <td>{{ d.quantidade }} {{ d.unidade }}</td>
              <td>{{ formatarMoeda(d.valor) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- LUCRO POR ITEM -->
    <template v-if="aba === 'itens'">
      <div v-if="!podeVerMargem" class="cartao-secao">
        <div class="secao-titulo">Acesso restrito</div>
        <div class="legenda">Margem por item exige a permissão <strong>financeiro.ver_margem</strong> (Proprietário).</div>
      </div>
      <template v-else>
        <div class="cartoes">
          <div class="cartao"><span>Margem média</span><strong>{{ mediaMargem === null ? 'sem base' : formatarPercentual(mediaMargem) }}</strong></div>
          <div class="cartao"><span>Itens em risco</span><strong>{{ MARGEM_POR_ITEM_MOCK.filter((i) => i.emRisco).length }}</strong></div>
        </div>
        <div class="cartao-secao">
          <div class="secao-titulo">Margem por item + curva ABC</div>
          <table class="tabela">
            <thead><tr><th>Item</th><th>Receita</th><th>CMV</th><th>Margem</th><th>Preço mín.</th><th>ABC</th></tr></thead>
            <tbody>
              <tr v-for="item in abc" :key="item.produtoId" :class="{ risco: item.emRisco }">
                <td>{{ item.produto }}<br /><small>{{ item.quantidade }} {{ item.unidade }} · custo {{ formatarMoeda(item.custoMedio) }}</small></td>
                <td>{{ formatarMoeda(item.receita) }}</td>
                <td>{{ formatarMoeda(item.cmv) }}</td>
                <td>{{ formatarMoeda(item.margem) }}<br /><small>{{ item.margemPercentual === null ? '—' : formatarPercentual(item.margemPercentual) }}</small></td>
                <td>{{ formatarMoeda(item.precoMinimo) }}</td>
                <td>{{ item.classe }}</td>
              </tr>
            </tbody>
          </table>
          <div class="legenda">Custo congelado na venda (compra + desossa + maturação). Linha destacada = margem em risco.</div>
        </div>
      </template>
    </template>

    <!-- CONTAS -->
    <template v-if="aba === 'contas'">
      <div class="cartao-secao">
        <div class="secao-titulo">Adicionar conta</div>
        <div class="grade-params">
          <label class="campo">Descrição<input v-model="novaContaDesc" type="text" placeholder="ex.: Fornecedor carne" /></label>
          <label class="campo">Valor (R$)<input v-model.number="novaContaValor" type="number" min="0" step="0.01" /></label>
          <label class="campo">Vencimento<input v-model="novaContaVenc" type="date" /></label>
          <label class="campo">Tipo
            <select v-model="novaContaTipo"><option value="pagar">A pagar</option><option value="receber">A receber</option></select>
          </label>
        </div>
        <div v-if="erroConta" class="erro">{{ erroConta }}</div>
        <button type="button" class="botao-primario" :disabled="!podeLancar" @click="adicionarConta">Adicionar</button>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">A pagar ({{ contasPagar.length }})</div>
        <div v-for="c in contasPagar" :key="c.id" class="linha-custo">
          <span>{{ c.descricao }} · {{ c.centroCusto }} · {{ ROTULO_STATUS[c.status] }}</span>
          <span class="acoes-conta"><strong>{{ formatarMoeda(c.valor) }}</strong>
            <button v-if="c.status !== 'pago'" type="button" class="link" :disabled="!podePagar" @click="pagarConta(c.id)">pagar</button>
          </span>
        </div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">A receber ({{ contasReceber.length }})</div>
        <div v-for="c in contasReceber" :key="c.id" class="linha-custo">
          <span>{{ c.descricao }} · {{ ROTULO_STATUS[c.status] }}</span>
          <span class="acoes-conta"><strong>{{ formatarMoeda(c.valor) }}</strong>
            <button v-if="c.status !== 'pago'" type="button" class="link" :disabled="!podePagar" @click="pagarConta(c.id)">receber</button>
          </span>
        </div>
      </div>
    </template>

    <!-- FIADO -->
    <template v-if="aba === 'fiado'">
      <div class="cartao-secao">
        <div class="secao-cabecalho">
          <div class="secao-titulo">Fiado × Lucro</div>
          <div class="segmentado">
            <button
              v-for="opcao in (['dia', 'semana', 'mes'] as Granularidade[])"
              :key="opcao"
              type="button"
              :class="{ ativo: granularidade === opcao }"
              @click="granularidade = opcao"
            >
              {{ opcao === 'dia' ? 'Diário' : opcao === 'semana' ? 'Semanal' : 'Mensal' }}
            </button>
          </div>
        </div>
        <GraficoBarras :dados="barrasComparador" />
        <table class="tabela">
          <thead><tr><th>Período</th><th>Fiado novo</th><th>Recebido</th><th>Saldo fiado</th><th>Lucro</th></tr></thead>
          <tbody>
            <tr v-for="ponto in comparador" :key="ponto.rotulo">
              <td>{{ ponto.rotulo }}</td>
              <td>{{ formatarMoeda(ponto.fiadoNovo) }}</td>
              <td>{{ formatarMoeda(ponto.fiadoRecebido) }}</td>
              <td>{{ formatarMoeda(ponto.saldoFiado) }}</td>
              <td>{{ formatarMoeda(ponto.lucro) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Aging — {{ formatarMoeda(totalAging) }} em aberto</div>
        <div v-for="faixa in FIADO_AGING_MOCK" :key="faixa.faixa" class="linha-custo">
          <span>{{ faixa.faixa }} · {{ faixa.clientes }} clientes</span>
          <strong>{{ formatarMoeda(faixa.valor) }}</strong>
        </div>
        <div class="legenda">Fiado aumenta contas a receber, não o caixa — só vira caixa ao receber.</div>
      </div>
    </template>

    <!-- DETALHAMENTO -->
    <template v-if="aba === 'detalhe'">
      <div class="cartoes">
        <div class="cartao"><span>Receita</span><strong>{{ formatarMoeda(resumo.receita) }}</strong></div>
        <div class="cartao"><span>Lucro líquido</span><strong>{{ formatarMoeda(resumo.lucroLiquido) }}</strong></div>
        <div class="cartao"><span>Margem líquida</span><strong>{{ resumo.margemLiquida === null ? 'sem base' : formatarPercentual(resumo.margemLiquida) }}</strong></div>
        <div class="cartao"><span>CMV</span><strong>{{ formatarMoeda(resumo.cmv) }}</strong></div>
        <div class="cartao"><span>Perdas</span><strong>{{ formatarMoeda(resumo.desperdicio) }}</strong></div>
        <div class="cartao"><span>Ponto de equilíbrio/mês</span><strong>{{ pe === null ? 'sem base' : formatarMoeda(pe) }}</strong></div>
      </div>

      <div v-if="comparativo" class="cartao-secao">
        <div class="secao-titulo">Comparativo com período anterior</div>
        <div class="grade-dupla">
          <div class="linha-custo"><span>Receita atual × anterior</span><strong>{{ formatarMoeda(comparativo.receitaAtual) }} × {{ formatarMoeda(comparativo.receitaAnterior) }}{{ comparativo.variacaoReceita === null ? '' : ` (${(comparativo.variacaoReceita * 100).toFixed(1)}%)` }}</strong></div>
          <div class="linha-custo"><span>Lucro atual × anterior</span><strong>{{ formatarMoeda(comparativo.lucroAtual) }} × {{ formatarMoeda(comparativo.lucroAnterior) }}{{ comparativo.variacaoLucro === null ? '' : ` (${(comparativo.variacaoLucro * 100).toFixed(1)}%)` }}</strong></div>
        </div>
      </div>

      <div class="cartao-secao">
        <div class="secao-cabecalho">
          <div class="secao-titulo">Receita × CMV × Lucro</div>
          <button type="button" class="botao-exportar" @click="exportarDetalhado">Exportar detalhado</button>
        </div>
        <GraficoLinha :rotulos="serie.rotulos" :series="linhasResultado" />
        <div class="legenda">Lucro = receita − CMV − despesas. Acima de 31 dias os valores são somados por semana.</div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Cascata do resultado (DRE)</div>
        <GraficoWaterfall :degraus="degrausDre" :formatar="formatarMoeda" />
      </div>

      <div class="grade-dupla">
        <div class="cartao-secao">
          <div class="secao-titulo">Despesas por categoria — {{ formatarMoeda(totalDespesasDonut) }}</div>
          <GraficoDonut
            v-if="fatiasDonut.length > 0"
            :fatias="fatiasDonut"
            :valor-central="formatarMoeda(totalDespesasDonut)"
            legenda-central="despesas"
          />
          <div v-else class="legenda">Sem despesas registradas.</div>
          <div class="legenda">Inclui custos base + custos fixos ativos da sessão.</div>
        </div>
        <div class="cartao-secao">
          <div class="secao-titulo">Fluxo de caixa</div>
          <GraficoLinha :rotulos="rotulosFluxo" :series="linhasFluxo" />
          <div class="legenda">Saldo acumulado: <strong>{{ formatarMoeda(fluxoAcumulado[fluxoAcumulado.length - 1] ?? 0) }}</strong> · Projeção 30d: <strong>{{ projecaoCaixa === null ? 'sem base' : formatarMoeda(projecaoCaixa) }}</strong> · Prazo médio de recebimento (estimado): <strong>{{ pmr === null ? 'sem base' : `${pmr} dias` }}</strong></div>
        </div>
      </div>

      <div v-if="podeVerMargem" class="cartao-secao">
        <div class="secao-titulo">Margem por produto — top 5</div>
        <div v-for="item in margemTop" :key="item.produtoId" class="barra-h">
          <span class="barra-h-rotulo">{{ item.produto }}</span>
          <span class="barra-h-trilho"><span class="barra-h-preenchimento" :style="{ width: Math.round((item.margem / maxMargemTop) * 100) + '%' }" /></span>
          <strong>{{ formatarMoeda(item.margem) }}</strong>
        </div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Perdas por motivo (Pareto)</div>
        <div v-if="resumoDesp.porMotivo.length === 0" class="legenda">Sem perdas registradas.</div>
        <div v-for="item in resumoDesp.porMotivo" :key="item.motivo" class="barra-h">
          <span class="barra-h-rotulo">{{ ROTULO_MOTIVO_DESPERDICIO[item.motivo as keyof typeof ROTULO_MOTIVO_DESPERDICIO] ?? item.motivo }} · {{ item.quantidade.toFixed(1) }} kg</span>
          <span class="barra-h-trilho"><span class="barra-h-preenchimento perda" :style="{ width: Math.round((item.valor / Math.max(1, resumoDesp.totalReais)) * 100) + '%' }" /></span>
          <strong>{{ formatarMoeda(item.valor) }}</strong>
        </div>
      </div>

      <div class="grade-dupla">
        <div class="cartao-secao">
          <div class="secao-titulo">Fiado por aging</div>
          <GraficoBarras :dados="barrasAging" />
        </div>
        <div class="cartao-secao">
          <div class="secao-titulo">Rendimento da desossa</div>
          <div v-if="rendimento.ordens === 0" class="legenda">Nenhuma desossa concluída — veja Desossa &amp; Subprodutos.</div>
          <template v-else>
            <div class="linha-custo"><span>Ordens</span><strong>{{ rendimento.ordens }}</strong></div>
            <div class="linha-custo"><span>Recebido × aproveitável</span><strong>{{ rendimento.recebidoKg }} kg × {{ rendimento.aproveitavelKg }} kg</strong></div>
            <div class="linha-custo"><span>Rendimento</span><strong>{{ rendimento.rendimento === null ? '—' : formatarPercentual(rendimento.rendimento) }}</strong></div>
            <div class="linha-custo"><span>Custo efetivo médio</span><strong>{{ rendimento.custoEfetivoMedio === null ? '—' : `${formatarMoeda(rendimento.custoEfetivoMedio)}/kg` }}</strong></div>
          </template>
        </div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Estoque valorizado — {{ formatarMoeda(estoqueVal.total) }}</div>
        <div v-if="estoqueVal.itens.length === 0" class="legenda">Estoque zerado.</div>
        <table v-else class="tabela">
          <thead><tr><th>Produto</th><th>Qtd</th><th>Custo médio</th><th>Valor</th></tr></thead>
          <tbody>
            <tr v-for="item in estoqueVal.itens.slice(0, 10)" :key="item.produto">
              <td>{{ item.produto }}</td>
              <td>{{ item.quantidade }} {{ item.unidade === 'KG' ? 'kg' : 'un' }}</td>
              <td>{{ formatarMoeda(item.custoMedio) }}</td>
              <td>{{ formatarMoeda(item.valor) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="legenda">Valor = quantidade em estoque × custo médio. Capital parado em itens de baixo giro aparece no topo quando o valor é alto.</div>
      </div>
    </template>

    <!-- RELATÓRIOS -->
    <template v-if="aba === 'relatorios'">
      <div class="cartao-secao">
        <div class="secao-cabecalho">
          <div class="secao-titulo">Filtros combináveis — {{ vendasFiltradas.length }} vendas</div>
          <button type="button" class="botao-exportar" @click="exportarRelatorios">Exportar relatórios</button>
        </div>
        <div class="grade-params">
          <label class="campo">Grupo
            <select v-model="filtroGrupo" @change="filtroSubgrupo = ''">
              <option value="">Todos</option>
              <option v-for="g in gruposDisponiveis" :key="g" :value="g">{{ g }}</option>
            </select>
          </label>
          <label class="campo">Subgrupo
            <select v-model="filtroSubgrupo">
              <option value="">Todos</option>
              <option v-for="s in subgruposDisponiveis" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label class="campo">Pagamento
            <select v-model="filtroForma">
              <option value="">Todos</option>
              <option v-for="f in formasDisponiveis" :key="f" :value="f">{{ f }}</option>
            </select>
          </label>
          <label class="campo">Operador
            <select v-model="filtroOperador">
              <option value="">Todos</option>
              <option v-for="o in operadoresDisponiveis" :key="o" :value="o">{{ o }}</option>
            </select>
          </label>
        </div>
        <div class="legenda">Grupo/subgrupo vêm do snapshot da venda — mudança no catálogo não reescreve o histórico.
          <button type="button" class="link" @click="limparFiltrosRel">limpar filtros</button>
        </div>
        <div v-if="mercado.vendas.length === 0" class="legenda">
          Sem vendas na sessão — <button type="button" class="link" @click="carregarDemoFin">carregar demonstração</button> para visualizar.
        </div>
      </div>

      <div class="cartoes">
        <div class="cartao"><span>Auditoria · válidas</span><strong>{{ resumoAud.vendasValidas }}</strong></div>
        <div class="cartao"><span>Canceladas</span><strong>{{ resumoAud.canceladas }}</strong></div>
        <div class="cartao"><span>Devoluções</span><strong>{{ resumoAud.devolvidas }}</strong></div>
        <div class="cartao"><span>Descontos</span><strong>{{ formatarMoeda(resumoAud.descontoTotal) }}</strong></div>
        <div class="cartao"><span>Reimpressões</span><strong>{{ resumoAud.reimpressoes }}</strong></div>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Por grupo e subgrupo — receita, CMV, margem e ABC</div>
        <div v-if="relGrupo.length === 0" class="legenda">Sem movimento no filtro.</div>
        <table v-else class="tabela">
          <thead><tr><th>Grupo / subgrupo</th><th>Receita</th><th>CMV</th><th>Lucro</th><th>Margem</th><th>Part.</th><th>ABC</th></tr></thead>
          <tbody>
            <tr v-for="l in relGrupo" :key="`${l.grupo}|${l.subgrupo}`">
              <td>{{ l.grupo }} · {{ l.subgrupo }}<br /><small>{{ l.vendas }} vendas · {{ l.quantidade }} qtd · desc. {{ formatarMoeda(l.desconto) }}</small></td>
              <td>{{ formatarMoeda(l.receita) }}</td>
              <td>{{ formatarMoeda(l.cmv) }}</td>
              <td>{{ formatarMoeda(l.lucro) }}</td>
              <td>{{ l.margem === null ? '—' : formatarPercentual(l.margem) }}</td>
              <td>{{ (l.participacao * 100).toFixed(1) }}%</td>
              <td>{{ l.classeABC }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="podeVerMargem" class="cartao-secao">
        <div class="secao-titulo">Margem real por produto (vendas da sessão)</div>
        <div v-if="relMargemReal.length === 0" class="legenda">Sem vendas.</div>
        <table v-else class="tabela">
          <thead><tr><th>Produto</th><th>Receita</th><th>Lucro</th><th>Margem</th><th>ABC</th></tr></thead>
          <tbody>
            <tr v-for="m in relMargemReal.slice(0, 12)" :key="m.produtoId">
              <td>{{ m.produto }}<br /><small>{{ m.grupo }} · {{ m.subgrupo }} · {{ m.quantidade }} qtd</small></td>
              <td>{{ formatarMoeda(m.receita) }}</td>
              <td>{{ formatarMoeda(m.lucro) }}</td>
              <td>{{ m.margem === null ? '—' : formatarPercentual(m.margem) }}</td>
              <td>{{ m.classeABC }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="cartao-secao">
        <div class="secao-titulo">Por hora — movimento, ticket e margem</div>
        <GraficoBarras v-if="barrasHora.length > 0" :dados="barrasHora" />
        <div class="mapa-hora" role="img" aria-label="Mapa de calor por hora">
          <div v-for="h in relHora" :key="h.hora" class="celula-hora" :class="{ ativa: h.vendas > 0 }" :style="{ opacity: h.vendas > 0 ? 0.35 + 0.65 * (h.receita / maxHoraReceita) : 1 }" :title="`${String(h.hora).padStart(2, '0')}h: ${h.vendas} vendas · ${formatarMoeda(h.receita)}`">
            <strong>{{ String(h.hora).padStart(2, '0') }}h</strong>
            <span>{{ h.vendas > 0 ? formatarMoedaCompacto(h.receita) : '—' }}</span>
          </div>
        </div>
        <table class="tabela">
          <thead><tr><th>Hora</th><th>Vendas</th><th>Receita</th><th>Ticket</th><th>Lucro</th><th>Cancel.</th></tr></thead>
          <tbody>
            <tr v-for="h in horasComMovimento" :key="h.hora">
              <td>{{ String(h.hora).padStart(2, '0') }}h</td>
              <td>{{ h.vendas }}</td>
              <td>{{ formatarMoeda(h.receita) }}</td>
              <td>{{ h.ticketMedio === null ? '—' : formatarMoeda(h.ticketMedio) }}</td>
              <td>{{ formatarMoeda(h.lucro) }}</td>
              <td>{{ h.cancelamentos }}</td>
            </tr>
          </tbody>
        </table>
        <div class="legenda">Cancelada não soma receita — aparece na coluna de cancelamentos e na auditoria.</div>
      </div>

      <div class="grade-dupla">
        <div class="cartao-secao">
          <div class="secao-titulo">Por operador</div>
          <div v-if="relOperador.length === 0" class="legenda">Sem vendas.</div>
          <table v-else class="tabela">
            <thead><tr><th>Operador</th><th>Vendas</th><th>Receita</th><th>Desc.</th></tr></thead>
            <tbody>
              <tr v-for="o in relOperador" :key="o.operador">
                <td>{{ o.operador }}<br /><small>ticket {{ o.ticketMedio === null ? '—' : formatarMoeda(o.ticketMedio) }} · canc. {{ o.cancelamentos }}</small></td>
                <td>{{ o.vendas }}</td>
                <td>{{ formatarMoeda(o.receita) }}</td>
                <td>{{ formatarMoeda(o.desconto) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="cartao-secao">
          <div class="secao-titulo">Por pagamento</div>
          <div v-if="relPagamento.length === 0" class="legenda">Sem vendas.</div>
          <div v-for="p in relPagamento" :key="p.forma" class="barra-h">
            <span class="barra-h-rotulo">{{ p.forma }} · {{ p.vendas }} vendas</span>
            <span class="barra-h-trilho"><span class="barra-h-preenchimento" :style="{ width: Math.round(p.participacao * 100) + '%' }" /></span>
            <strong>{{ formatarMoeda(p.receita) }}</strong>
          </div>
        </div>
      </div>

      <div class="grade-dupla">
        <div class="cartao-secao">
          <div class="secao-titulo">Por fornecedor (origem do custo)</div>
          <div v-if="relFornecedor.length === 0" class="legenda">Sem vendas.</div>
          <table v-else class="tabela">
            <thead><tr><th>Fornecedor</th><th>Receita</th><th>Margem</th></tr></thead>
            <tbody>
              <tr v-for="f in relFornecedor" :key="f.fornecedor">
                <td>{{ f.fornecedor }}<br /><small>{{ f.itens }} itens</small></td>
                <td>{{ formatarMoeda(f.receita) }}</td>
                <td>{{ f.margem === null ? '—' : formatarPercentual(f.margem) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="cartao-secao">
          <div class="secao-titulo">Perdas por grupo</div>
          <div v-if="relPerdasGrupo.length === 0" class="legenda">Sem perdas registradas.</div>
          <div v-for="p in relPerdasGrupo" :key="`${p.grupo}|${p.subgrupo}`" class="linha-custo">
            <span>{{ p.grupo }} · {{ p.subgrupo }} · {{ p.quantidade }} qtd</span>
            <strong>{{ formatarMoeda(p.valor) }}</strong>
          </div>
        </div>
      </div>
    </template>
    </template>
  </div>
</template>

<style scoped>
.pagina { padding: 36px 44px 60px; display: flex; flex-direction: column; gap: 18px; }
@media (max-width: 640px) { .pagina { padding: 24px 16px 90px; } }
.cabecalho { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.titulo { font-family: 'Bodoni Moda', serif; font-size: 30px; font-weight: 600; color: var(--cor-on-bg); }
.subtitulo { font-size: 13px; color: var(--cor-on-surface-variant); }
.filtros { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.segmentado { display: flex; border: 1px solid var(--cor-outline); border-radius: 100px; overflow: hidden; background: var(--cor-surface); }
.segmentado button { border: none; background: transparent; padding: 9px 14px; font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--cor-on-surface-variant); cursor: pointer; white-space: nowrap; }
.segmentado button.ativo { background: var(--cor-primary-container); color: var(--cor-on-primary-container); }
.botao-exportar { padding: 9px 14px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.abas { display: flex; gap: 8px; flex-wrap: wrap; }
.abas button { padding: 10px 18px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface-variant); font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.abas button.ativa { background: var(--cor-primary-container); color: var(--cor-on-primary-container); border-color: transparent; }
.cartoes { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.cartao { background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.cartao span { font-size: 12px; color: var(--cor-on-surface-variant); }
.cartao strong { font-family: 'Bodoni Moda', serif; font-size: 22px; color: var(--cor-on-surface); }
.cartao-secao { background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.cartao-secao.destaque-real { border-color: var(--cor-primary); }
.secao-titulo { font-size: 14.5px; font-weight: 700; color: var(--cor-on-surface); }
.secao-cabecalho { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.legenda { font-size: 12.5px; color: var(--cor-on-surface-variant); }
.erro { font-size: 13px; color: var(--cor-error); }
.tabela { width: 100%; border-collapse: collapse; font-size: 13px; color: var(--cor-on-surface); }
.tabela th, .tabela td { text-align: left; padding: 8px 4px; border-top: 1px solid var(--cor-outline); vertical-align: top; }
.tabela thead th { border-top: none; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--cor-on-surface-variant); }
.tabela td:last-child, .tabela th:last-child { text-align: right; }
.tabela tr.destaque td { font-weight: 700; }
.tabela tr.risco td { background: var(--cor-error-container); }
.tabela small { color: var(--cor-on-surface-variant); }
.linha-custo { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--cor-on-surface); padding: 8px 0; border-top: 1px solid var(--cor-outline); }
.acoes-conta { display: flex; gap: 10px; align-items: center; }
.link { background: none; border: none; padding: 0; font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--cor-primary); cursor: pointer; }
.link:disabled { opacity: 0.5; cursor: default; }
.grade-params { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.grade-dupla { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
.barra-h { display: grid; grid-template-columns: minmax(120px, 1fr) 2fr auto; gap: 10px; align-items: center; padding: 6px 0; font-size: 13px; color: var(--cor-on-surface); }
.barra-h-rotulo { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.barra-h-trilho { display: block; height: 10px; border-radius: 100px; background: var(--cor-surface-variant); overflow: hidden; }
.barra-h-preenchimento { display: block; height: 100%; background: var(--cor-primary); border-radius: 100px; }
.barra-h-preenchimento.perda { background: var(--cor-error); }
.campo { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--cor-on-surface-variant); }
.campo input, .campo select { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 13.5px; }
.mapa-hora { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); gap: 8px; }
.celula-hora { border: 1px solid var(--cor-outline); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--cor-on-surface-variant); background: var(--cor-surface-variant); }
.celula-hora.ativa { background: var(--cor-primary-container); color: var(--cor-on-primary-container); border-color: transparent; }
.celula-hora strong { font-size: 12.5px; }
.botao-primario { align-self: flex-start; padding: 11px 20px; border: none; border-radius: 100px; background: var(--cor-primary); color: var(--cor-on-primary); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.botao-primario:disabled { opacity: 0.5; cursor: default; }
</style>
