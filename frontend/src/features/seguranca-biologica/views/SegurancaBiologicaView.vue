<script setup lang="ts">
import { computed, ref } from 'vue'
import BadgeStatus from '../../../shared/components/BadgeStatus.vue'
import BarraDeProgresso from '../../../shared/components/BarraDeProgresso.vue'
import { useAutenticacao } from '../../auth/composables/useAutenticacao'
import { useMaturacaoStore } from '../../maturacao/store/maturacao.store'
import { NOMES_TECNICA } from '../../maturacao/types'
import GraficoCrescimentoMicrobiano from '../components/GraficoCrescimentoMicrobiano.vue'
import {
  calcularDiasArmazenado,
  classificarStatusDeArmazenamento,
  NOMES_STATUS_ARMAZENAMENTO,
} from '../logica/armazenamento-refrigerado'
import { abaixoDoLimiarDeSeguranca, estimarAtividadeDeAgua } from '../logica/atividade-de-agua'
import { MODELOS_CHECKLIST, type TurnoChecklist } from '../logica/checklists'
import {
  DOENCA_CAUSADA,
  NOMES_ORGANISMO,
  type OrganismoIndicador,
  PARAMETROS_POR_ORGANISMO,
  simularCrescimento,
} from '../logica/crescimento-microbiano'
import { percentualDoLimite, proximoDoLimite, ultrapassouOLimite } from '../logica/zona-de-perigo'
import { useParametrosSegurancaBiologicaStore } from '../store/parametros.store'
import { useSegurancaBiologicaStore } from '../store/seguranca-biologica.store'
import type { StatusDeConformidade } from '../types'

type NivelAlerta = 'critico' | 'atencao'

interface Alerta {
  id: string
  nivel: NivelAlerta
  titulo: string
  detalhe: string
  acaoTexto: string
  executar: () => void
}

const store = useSegurancaBiologicaStore()
const parametros = useParametrosSegurancaBiologicaStore()
const maturacaoStore = useMaturacaoStore()
const { usuario } = useAutenticacao()

const nomeResponsavel = computed(() => usuario.value?.nome ?? 'Usuário atual')
const mostrarDetalhes = ref(false)

// --- Simulador (detalhes técnicos) ---
const organismoSimulado = ref<OrganismoIndicador>('LISTERIA')
const temperaturaSimuladaC = ref(25)
const duracaoSimuladaHoras = ref(8)
const contagemInicialLog10 = ref(1)

const pontosSimulados = computed(() =>
  simularCrescimento(
    organismoSimulado.value,
    temperaturaSimuladaC.value,
    contagemInicialLog10.value,
    duracaoSimuladaHoras.value,
    Math.max(0.25, duracaoSimuladaHoras.value / 40),
  ),
)
const limiteDeAcaoLog = computed(() => contagemInicialLog10.value + 2)

// --- Dados derivados ---
const itensGeladeira = computed(() =>
  store.itensNaGeladeira.map((item) => {
    const dias = calcularDiasArmazenado(item.reservadoDesde)
    return { ...item, dias, status: classificarStatusDeArmazenamento(dias) }
  }),
)

const ccpsCriticos = computed(() => store.ccps.filter((ccp) => ccp.status === 'critico'))
const ccpsAtencao = computed(() => store.ccps.filter((ccp) => ccp.status === 'atencao'))
const ccpsConformes = computed(() => store.ccps.filter((ccp) => ccp.status === 'conforme'))
const coletasCriticas = computed(() => store.coletas.filter((coleta) => coleta.status === 'critico'))
const geladeiraCritica = computed(() => itensGeladeira.value.filter((item) => item.status === 'vencido'))
const geladeiraAtencao = computed(() => itensGeladeira.value.filter((item) => item.status === 'atencao'))

const minutosZonaPerigo = computed(() =>
  Math.max(0, ...store.ccps.map((ccp) => ccp.minutosAcumuladosEmZonaDePerigo)),
)

// --- Alertas priorizados (máx. 5): crítico antes de atenção ---
const alertas = computed<Alerta[]>(() => {
  const lista: Alerta[] = []

  for (const ccp of [...ccpsCriticos.value, ...ccpsAtencao.value]) {
    lista.push({
      id: `ccp-${ccp.id}`,
      nivel: ccp.status === 'critico' ? 'critico' : 'atencao',
      titulo: ccp.nome,
      detalhe: `${ccp.minutosAcumuladosEmZonaDePerigo}/${parametros.limiteZonaDePerigoMinutos} min em zona de perigo`,
      acaoTexto: 'Verificar agora',
      executar: () => store.verificarCcpAgora(ccp.id, nomeResponsavel.value),
    })
  }
  for (const item of [...geladeiraCritica.value, ...geladeiraAtencao.value]) {
    lista.push({
      id: `gel-${item.id}`,
      nivel: item.status === 'vencido' ? 'critico' : 'atencao',
      titulo: item.status === 'vencido' ? `${item.corteNome} venceu` : `${item.corteNome} vence em breve`,
      detalhe: `${item.pesoKg.toFixed(1)} kg há ${item.dias.toFixed(1)} dias na geladeira`,
      acaoTexto: 'Descartar',
      executar: () => store.descartarItemDaGeladeira(item.id, nomeResponsavel.value),
    })
  }
  for (const coleta of coletasCriticas.value) {
    lista.push({
      id: `col-${coleta.id}`,
      nivel: 'critico',
      titulo: `${coleta.indicador} fora do limite`,
      detalhe: `${coleta.resultado} · limite ${coleta.limiteDeReferencia}`,
      acaoTexto: 'Ver coleta',
      executar: () => {
        mostrarDetalhes.value = true
      },
    })
  }
  const peso: Record<NivelAlerta, number> = { critico: 0, atencao: 1 }
  return lista.sort((a, b) => peso[a.nivel] - peso[b.nivel]).slice(0, 5)
})

const totalAlertas = computed(
  () =>
    ccpsCriticos.value.length +
    ccpsAtencao.value.length +
    geladeiraCritica.value.length +
    geladeiraAtencao.value.length +
    coletasCriticas.value.length,
)

const statusGeral = computed(() => {
  if (ccpsCriticos.value.length + geladeiraCritica.value.length + coletasCriticas.value.length > 0) {
    return { texto: 'Atenção necessária', tom: 'erro' as const }
  }
  if (totalAlertas.value > 0) return { texto: 'Pontos em atenção', tom: 'aviso' as const }
  return { texto: 'Tudo sob controle', tom: 'sucesso' as const }
})

const proximaAcao = computed(() => alertas.value[0] ?? null)

const pecasComAw = computed(() =>
  maturacaoStore.pecas.map((peca) => {
    const aw = estimarAtividadeDeAgua(peca)
    return { ...peca, aw, emRisco: abaixoDoLimiarDeSeguranca(aw, parametros.limiarAw) }
  }),
)

const loteConsultado = ref('')
const resultadoBusca = ref<string | null>(null)

// checklist operacional
const chkTurno = ref<TurnoChecklist>('abertura')
const chkEstados = ref<boolean[]>(MODELOS_CHECKLIST.abertura.map(() => false))
const chkObs = ref('')
const chkErro = ref('')
const tmpLocal = ref('Câmara fria 1')
const tmpValor = ref<number | null>(null)
const acaoDesc = ref('')
const acaoLote = ref('')

function trocarTurno(): void {
  chkEstados.value = MODELOS_CHECKLIST[chkTurno.value].map(() => false)
}

function salvarChecklist(): void {
  chkErro.value = ''
  try {
    store.registrarChecklist(chkTurno.value, chkEstados.value, nomeResponsavel.value, chkObs.value)
    chkObs.value = ''
    trocarTurno()
  } catch (e) {
    chkErro.value = e instanceof Error ? e.message : 'Não foi possível registrar.'
  }
}

function salvarTemperatura(): void {
  chkErro.value = ''
  try {
    if (tmpValor.value === null) throw new Error('Informe a temperatura.')
    store.registrarTemperatura(tmpLocal.value, tmpValor.value, nomeResponsavel.value)
    tmpValor.value = null
  } catch (e) {
    chkErro.value = e instanceof Error ? e.message : 'Não foi possível registrar.'
  }
}

function salvarAcao(): void {
  chkErro.value = ''
  try {
    store.abrirAcaoCorretiva(acaoDesc.value, nomeResponsavel.value, acaoLote.value)
    acaoDesc.value = ''
    acaoLote.value = ''
  } catch (e) {
    chkErro.value = e instanceof Error ? e.message : 'Não foi possível abrir.'
  }
}

function buscarLote(): void {
  resultadoBusca.value = loteConsultado.value.trim() || null
}

function tomPorStatus(status: StatusDeConformidade): 'sucesso' | 'aviso' | 'erro' {
  if (status === 'conforme') return 'sucesso'
  if (status === 'atencao') return 'aviso'
  return 'erro'
}

function rotuloPorStatus(status: StatusDeConformidade): string {
  if (status === 'conforme') return 'Conforme'
  if (status === 'atencao') return 'Atenção'
  return 'Crítico'
}

function formatarTempoRelativo(data: Date): string {
  const minutos = Math.round((Date.now() - data.getTime()) / 60000)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas}h`
  return `há ${Math.round(horas / 24)}d`
}
</script>

<template>
  <div class="pagina">
    <div class="cabecalho">
      <div class="titulo">Segurança Biológica</div>
      <BadgeStatus :tom="statusGeral.tom">{{ statusGeral.texto }}</BadgeStatus>
    </div>

    <!-- 1. Próxima ação -->
    <div v-if="proximaAcao" class="proxima-acao" :class="proximaAcao.nivel">
      <div>
        <div class="proxima-rotulo">Próxima ação</div>
        <div class="proxima-titulo">{{ proximaAcao.titulo }}</div>
        <div class="proxima-detalhe">{{ proximaAcao.detalhe }}</div>
      </div>
      <button type="button" class="botao-primario" @click="proximaAcao.executar()">
        {{ proximaAcao.acaoTexto }}
      </button>
    </div>
    <div v-else class="tudo-ok">Nenhuma pendência sanitária. Bom trabalho.</div>

    <!-- 2. Três indicadores -->
    <div class="indicadores">
      <div class="indicador">
        <span>Pontos conformes</span>
        <strong>{{ ccpsConformes.length }}/{{ store.ccps.length }}</strong>
      </div>
      <div class="indicador">
        <span>Zona de perigo (máx)</span>
        <strong>{{ minutosZonaPerigo }}/{{ parametros.limiteZonaDePerigoMinutos }} min</strong>
      </div>
      <div class="indicador">
        <span>Coletas críticas</span>
        <strong>{{ coletasCriticas.length }}</strong>
      </div>
    </div>

    <!-- 3. Alertas (restantes após a próxima ação) -->
    <div v-if="alertas.length > 1" class="cartao">
      <div class="secao-titulo">Outros pontos ({{ alertas.length - 1 }})</div>
      <div v-for="alerta in alertas.slice(1)" :key="alerta.id" class="linha-alerta">
        <div>
          <div class="alerta-titulo">{{ alerta.titulo }}</div>
          <div class="alerta-detalhe">{{ alerta.detalhe }}</div>
        </div>
        <button type="button" class="link" @click="alerta.executar()">{{ alerta.acaoTexto }}</button>
      </div>
    </div>

    <!-- 4. Pontos de controle — compacto -->
    <div class="cartao">
      <div class="secao-titulo">Pontos de controle</div>
      <div v-for="ccp in store.ccps" :key="ccp.id" class="linha-ccp">
        <div class="ccp-info">
          <span class="ccp-nome">{{ ccp.nome }}</span>
          <span class="ccp-meta">verificado {{ formatarTempoRelativo(ccp.ultimaVerificacao) }}</span>
        </div>
        <BadgeStatus :tom="tomPorStatus(ccp.status)">{{ rotuloPorStatus(ccp.status) }}</BadgeStatus>
        <button
          v-if="ccp.status !== 'conforme'"
          type="button"
          class="botao-secundario"
          @click="store.verificarCcpAgora(ccp.id, nomeResponsavel)"
        >
          Verificar
        </button>
      </div>
    </div>

    <!-- 5. Geladeira — só o que importa -->
    <div v-if="geladeiraCritica.length + geladeiraAtencao.length > 0" class="cartao">
      <div class="secao-titulo">Geladeira do PDV — agir</div>
      <div v-for="item in [...geladeiraCritica, ...geladeiraAtencao]" :key="item.id" class="linha-ccp">
        <div class="ccp-info">
          <span class="ccp-nome">{{ item.corteNome }}</span>
          <span class="ccp-meta">{{ item.pesoKg.toFixed(1) }} kg · há {{ item.dias.toFixed(1) }} dias</span>
        </div>
        <BadgeStatus :tom="item.status === 'vencido' ? 'erro' : 'aviso'">
          {{ NOMES_STATUS_ARMAZENAMENTO[item.status] }}
        </BadgeStatus>
        <button
          type="button"
          class="botao-secundario"
          @click="store.descartarItemDaGeladeira(item.id, nomeResponsavel)"
        >
          Descartar
        </button>
      </div>
    </div>

    <!-- 6. Checklist + temperatura + ação corretiva -->
    <div class="cartao">
      <div class="secao-titulo">Checklist sanitário — {{ store.checklists.length }} registrado(s)</div>
      <div class="nota">
        Marque cada item do turno, registre a temperatura e abra ação corretiva quando houver desvio.
      </div>
      <div class="controles">
        <label class="campo"
          ><span>Turno</span>
          <select v-model="chkTurno" @change="trocarTurno">
            <option value="abertura">Abertura</option>
            <option value="manipulacao">Manipulação</option>
            <option value="fechamento">Fechamento</option>
          </select>
        </label>
        <label class="campo"
          ><span>Observação</span><input v-model="chkObs" type="text" placeholder="ocorrência…"
        /></label>
      </div>
      <div class="check-lista">
        <label v-for="(item, i) in MODELOS_CHECKLIST[chkTurno]" :key="item" class="check-item">
          <input v-model="chkEstados[i]" type="checkbox" />
          <span>{{ item }}</span>
        </label>
      </div>
      <div class="controles">
        <label class="campo"><span>Local</span><input v-model="tmpLocal" type="text" /></label>
        <label class="campo"
          ><span>Temp (°C)</span><input v-model.number="tmpValor" type="number" step="0.1" placeholder="0,0"
        /></label>
        <label class="campo"
          ><span>Ação corretiva</span
          ><input v-model="acaoDesc" type="text" placeholder="ex.: descartar lote…"
        /></label>
        <label class="campo"
          ><span>Lote</span><input v-model="acaoLote" type="text" placeholder="L…"
        /></label>
      </div>
      <div v-if="chkErro" class="erro" role="alert">{{ chkErro }}</div>
      <div class="acoes-linha">
        <button type="button" class="botao-primario" @click="salvarChecklist">Registrar checklist</button>
        <button type="button" class="botao-secundario" @click="salvarTemperatura">
          Registrar temperatura
        </button>
        <button type="button" class="botao-secundario" @click="salvarAcao">Abrir ação corretiva</button>
      </div>
      <div v-for="a in store.acoes" :key="a.id" class="linha-simples">
        <span>{{ a.descricao }}{{ a.lote ? ` · lote ${a.lote}` : '' }} · {{ a.status }}</span>
        <button
          v-if="a.status === 'aberta'"
          type="button"
          class="botao-secundario"
          @click="store.concluirAcao(a.id)"
        >
          concluir
        </button>
      </div>
    </div>

    <!-- 7. Detalhes técnicos recolhidos -->
    <button type="button" class="botao-detalhes" @click="mostrarDetalhes = !mostrarDetalhes">
      {{ mostrarDetalhes ? '▾' : '▸' }} Ver detalhes técnicos
    </button>

    <template v-if="mostrarDetalhes">
      <div class="cartao">
        <div class="secao-titulo">Atividade de Água — maturação</div>
        <div v-if="pecasComAw.length === 0" class="texto">Nenhuma peça em maturação.</div>
        <div v-for="peca in pecasComAw" :key="peca.id" class="linha-simples">
          <span
            >{{ peca.nome }} <span class="muted">({{ NOMES_TECNICA[peca.tecnica] }})</span></span
          >
          <BadgeStatus :tom="peca.emRisco ? 'erro' : 'sucesso'"> Aw {{ peca.aw.toFixed(2) }} </BadgeStatus>
        </div>
        <div class="texto">Limiar de segurança: {{ parametros.limiarAw.toFixed(2) }}</div>
      </div>

      <div class="cartao">
        <div class="secao-titulo">Zona de perigo por ponto</div>
        <div v-for="ccp in store.ccps" :key="ccp.id" class="zona-linha">
          <div class="zona-topo">
            <span>{{ ccp.nome }}</span>
            <span
              >{{ ccp.minutosAcumuladosEmZonaDePerigo }}/{{ parametros.limiteZonaDePerigoMinutos }} min</span
            >
          </div>
          <BarraDeProgresso
            :percentual="
              percentualDoLimite(ccp.minutosAcumuladosEmZonaDePerigo, parametros.limiteZonaDePerigoMinutos) *
              100
            "
            :cor="
              ultrapassouOLimite(ccp.minutosAcumuladosEmZonaDePerigo, parametros.limiteZonaDePerigoMinutos)
                ? 'var(--cor-error)'
                : proximoDoLimite(ccp.minutosAcumuladosEmZonaDePerigo, parametros.limiteZonaDePerigoMinutos)
                  ? 'var(--cor-secondary)'
                  : 'var(--cor-primary)'
            "
          />
        </div>
      </div>

      <div class="cartao">
        <div class="secao-titulo">Simulador de crescimento microbiano</div>
        <p class="texto">Estimativa ilustrativa — não substitui coleta laboratorial.</p>
        <div class="controles">
          <label class="campo">
            <span>Organismo</span>
            <select v-model="organismoSimulado">
              <option v-for="(nome, chave) in NOMES_ORGANISMO" :key="chave" :value="chave">{{ nome }}</option>
            </select>
          </label>
          <label class="campo">
            <span>Temperatura (°C)</span>
            <input v-model.number="temperaturaSimuladaC" type="number" step="1" />
          </label>
          <label class="campo">
            <span>Duração (h)</span>
            <input v-model.number="duracaoSimuladaHoras" type="number" min="1" max="48" step="1" />
          </label>
        </div>
        <p class="texto">
          <strong>{{ NOMES_ORGANISMO[organismoSimulado] }}</strong> — causa:
          {{ DOENCA_CAUSADA[organismoSimulado] }}
        </p>
        <GraficoCrescimentoMicrobiano :pontos="pontosSimulados" :limite-de-acao-log="limiteDeAcaoLog" />
        <p class="referencia">
          Baranyi &amp; Roberts (1994); Ratkowsky et al. (1982).
          {{ PARAMETROS_POR_ORGANISMO[organismoSimulado].referencia }}
        </p>
      </div>

      <div class="cartao">
        <div class="secao-titulo">Coletas e auditoria</div>
        <div v-for="coleta in store.coletas" :key="coleta.id" class="linha-simples">
          <span>{{ coleta.indicador }} · {{ coleta.resultado }}</span>
          <BadgeStatus :tom="tomPorStatus(coleta.status)">{{ rotuloPorStatus(coleta.status) }}</BadgeStatus>
        </div>
        <div class="secao-titulo espacar">Rastreabilidade de lote</div>
        <form class="busca-lote" @submit.prevent="buscarLote">
          <input v-model="loteConsultado" type="text" placeholder="Código do lote…" />
          <button class="botao-secundario" type="submit">Buscar</button>
        </form>
        <div v-if="resultadoBusca" class="cadeia">
          <div>Fornecedor (SIF 1234) → recebimento</div>
          <div>Desossa — lote {{ resultadoBusca }} → cortes gerados</div>
          <div>Câmara de Maturação → venda no mercado</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pagina {
  padding: 36px 44px 60px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 760px;
}

@media (max-width: 640px) {
  .pagina {
    padding: 24px 16px 90px;
  }
}

.cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.titulo {
  font-family: var(--fonte-display);
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.proxima-acao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-left: 4px solid var(--cor-secondary);
  border-radius: 16px;
  padding: 18px 20px;
}

.proxima-acao.critico {
  border-left-color: var(--cor-error);
}

.proxima-rotulo {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cor-on-surface-variant);
}

.proxima-titulo {
  font-size: 16px;
  font-weight: 700;
  color: var(--cor-on-surface);
  margin-top: 2px;
}

.proxima-detalhe {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.botao-primario {
  padding: 12px 20px;
  border: none;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.tudo-ok {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 18px 20px;
  font-size: 14px;
  color: var(--cor-on-surface);
}

.indicadores {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 560px) {
  .indicadores {
    grid-template-columns: 1fr;
  }
}

.indicador {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.indicador span {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.indicador strong {
  font-family: var(--fonte-display);
  font-size: 20px;
  color: var(--cor-on-surface);
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

.linha-alerta,
.linha-ccp,
.linha-simples {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--cor-outline);
}

.linha-alerta:first-of-type,
.linha-ccp:first-of-type,
.linha-simples:first-of-type {
  border-top: none;
  padding-top: 0;
}

.alerta-titulo,
.ccp-nome {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.alerta-detalhe,
.ccp-meta {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
  margin-top: 2px;
}

.ccp-info {
  flex: 1;
  min-width: 0;
}

.link {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--cor-primary);
  cursor: pointer;
  white-space: nowrap;
}

.botao-secundario {
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.botao-detalhes {
  align-self: flex-start;
  border: none;
  background: none;
  color: var(--cor-on-surface-variant);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.texto {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
  margin: 0;
}

.muted {
  color: var(--cor-on-surface-variant);
  font-weight: 400;
}

.zona-linha {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.zona-topo {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.controles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.nota {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
  margin: 0;
}

.erro {
  font-size: 12.5px;
  color: var(--cor-error);
  background: var(--cor-error-container);
  border-radius: 10px;
  padding: 10px 12px;
}

.check-lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  min-height: 44px;
  border: 1px solid var(--cor-outline);
  border-radius: 12px;
  background: var(--cor-bg);
  font-size: 13px;
  color: var(--cor-on-surface);
  cursor: pointer;
  box-sizing: border-box;
}

.check-item input {
  width: 18px;
  height: 18px;
  accent-color: var(--cor-primary);
  flex-shrink: 0;
}

.acoes-linha {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.campo select,
.campo input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13.5px;
}

.referencia {
  font-size: 11px;
  color: var(--cor-on-surface-variant);
  line-height: 1.5;
  margin: 0;
}

.busca-lote {
  display: flex;
  gap: 8px;
}

.busca-lote input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13.5px;
}

.cadeia {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}
</style>
