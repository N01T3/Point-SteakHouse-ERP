<script setup lang="ts">
import { computed, ref } from 'vue'
import BadgeStatus from '../../../shared/components/BadgeStatus.vue'
import Modal from '../../../shared/components/Modal.vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { desvioDeRendimentoSignificativo, calcularPrecoSugeridoPorKg } from '../logica/custeio'
import { useDesossaStore } from '../store/desossa.store'
import { useMercadoStore } from '../../mercado/store/mercado.store'
import { useAuthStore } from '../../auth/store/auth.store'
import { NOMES_DESTINO, SAIDAS_SECUNDARIAS_PADRAO, type PecaBruta, type SaidaDeDesossa } from '../types'

const store = useDesossaStore()
const mercado = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()
const erro = ref('')
const enviadaAoEstoque = ref<Record<string, number>>({})

// nova peça bruta
const novaFornecedor = ref('')
const novaTipo = ref('Traseiro')
const novaPeso = ref<number | null>(null)
const novaCusto = ref<number | null>(null)

function cadastrarPeca(): void {
  erro.value = ''
  try {
    if (novaPeso.value === null || novaCusto.value === null) throw new Error('Informe peso e custo.')
    store.registrarPecaBruta({ fornecedor: novaFornecedor.value, tipoDePeca: novaTipo.value, pesoKg: novaPeso.value, custoPorKg: novaCusto.value })
    novaFornecedor.value = ''
    novaPeso.value = null
    novaCusto.value = null
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível cadastrar.'
  }
}

function enviarAoEstoque(ordemId: string): void {
  erro.value = ''
  try {
    const ordem = store.ordensConcluidas.find((o) => o.id === ordemId)
    if (!ordem) return
    const total = mercado.aplicarDesossaAoEstoque(ordem, auth.usuario?.nome ?? 'operador')
    store.marcarEnviada(ordemId)
    enviadaAoEstoque.value = { ...enviadaAoEstoque.value, [ordemId]: total }
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível enviar.'
  }
}

function cancelarOrdem(ordemId: string): void {
  erro.value = ''
  try {
    store.cancelarOrdem(ordemId)
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível cancelar.'
  }
}

const pecaEmDesossaId = ref<string | null>(null)
const pecaEmDesossa = computed(
  () => store.pecasBrutasPendentes.find((peca) => peca.id === pecaEmDesossaId.value) ?? null,
)
const templateDaPeca = computed(
  () => store.templates.find((template) => template.tipoDePeca === pecaEmDesossa.value?.tipoDePeca) ?? null,
)

const pesosPorCorte = ref<Record<string, number | null>>({})
const pesosSecundarios = ref<Record<string, number | null>>({})

function abrirDesossa(peca: PecaBruta): void {
  pecaEmDesossaId.value = peca.id
  pesosPorCorte.value = {}
  pesosSecundarios.value = {}
}

function fecharModal(): void {
  pecaEmDesossaId.value = null
}

const rendimentoEsperadoDoTemplate = computed(() =>
  (templateDaPeca.value?.cortesEsperados ?? []).reduce((soma, corte) => soma + corte.percentualEsperado, 0),
)

function confirmarDesossa(): void {
  erro.value = ''
  try {
    if (!pecaEmDesossa.value || !templateDaPeca.value) return

    const saidas: SaidaDeDesossa[] = []

    for (const corteEsperado of templateDaPeca.value.cortesEsperados) {
      const peso = pesosPorCorte.value[corteEsperado.nome]
      if (peso && peso > 0) {
        saidas.push({
          id: `saida-${crypto.randomUUID()}`,
          nome: corteEsperado.nome,
          pesoKg: peso,
          classificacao: 'CORTE',
          destino: null,
        })
      }
    }

    for (const secundaria of SAIDAS_SECUNDARIAS_PADRAO) {
      const peso = pesosSecundarios.value[secundaria.classificacao]
      if (peso && peso > 0) {
        saidas.push({
          id: `saida-${crypto.randomUUID()}`,
          nome: secundaria.nome,
          pesoKg: peso,
          classificacao: secundaria.classificacao,
          destino: secundaria.destinoPadrao,
        })
      }
    }

    store.concluirDesossa(pecaEmDesossa.value.id, saidas, rendimentoEsperadoDoTemplate.value)
    fecharModal()
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível concluir.'
  }
}
</script>

<template>
  <div class="pagina">
    <div class="titulo">Desossa &amp; Subprodutos</div>
    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>

    <div class="secao">
      <div class="secao-titulo">Nova peça bruta — entrada da desossa</div>
      <div class="nota">Cadastre a peça recebida antes de abrir a ordem. O peso total limita a soma dos cortes.</div>
      <div class="form-grade">
        <label class="campo-inline"><span>Fornecedor</span><input v-model="novaFornecedor" type="text" placeholder="Frigorífico…" /></label>
        <label class="campo-inline"><span>Tipo</span>
          <select v-model="novaTipo">
            <option v-for="t in store.templates" :key="t.id" :value="t.tipoDePeca">{{ t.tipoDePeca }}</option>
          </select>
        </label>
        <label class="campo-inline"><span>Peso (kg)</span><input v-model.number="novaPeso" type="number" min="0" step="0.1" placeholder="0,0" /></label>
        <label class="campo-inline"><span>Custo/kg (R$)</span><input v-model.number="novaCusto" type="number" min="0" step="0.01" placeholder="0,00" /></label>
      </div>
      <button class="botao-primario" type="button" @click="cadastrarPeca">Cadastrar peça</button>
    </div>

    <div class="secao">
      <div class="secao-titulo">Peças brutas pendentes de desossa</div>
      <div v-if="store.pecasBrutasPendentes.length === 0" class="vazio">Nenhuma peça pendente.</div>
      <div class="grade-pecas">
        <div v-for="peca in store.pecasBrutasPendentes" :key="peca.id" class="cartao-peca">
          <div class="peca-nome">{{ peca.tipoDePeca }}</div>
          <div class="peca-meta">{{ peca.fornecedor }}</div>
          <div class="peca-meta">{{ peca.pesoKg }} kg · {{ formatarMoeda(peca.custoPorKg) }}/kg</div>
          <button class="botao-primario" type="button" @click="abrirDesossa(peca)">Iniciar desossa</button>
        </div>
      </div>
    </div>

    <div class="secao">
      <div class="secao-titulo">Histórico de desossas</div>
      <div v-if="store.ordensConcluidas.length === 0" class="vazio">Nenhuma desossa concluída ainda.</div>
      <div v-for="ordem in store.ordensConcluidas" :key="ordem.id" class="linha-ordem">
        <div class="ordem-cabecalho">
          <strong>{{ ordem.pecaBruta.tipoDePeca }} · {{ ordem.pecaBruta.fornecedor }}</strong>
          <BadgeStatus :tom="desvioDeRendimentoSignificativo(ordem.rendimentoRealizado, ordem.rendimentoEsperado) ? 'aviso' : 'sucesso'">
            {{ (ordem.rendimentoRealizado * 100).toFixed(1) }}% rendimento (esperado {{ (ordem.rendimentoEsperado * 100).toFixed(0) }}%)
          </BadgeStatus>
        </div>
        <div class="ordem-detalhe">
          Custo efetivo {{ formatarMoeda(ordem.custoEfetivoPorKg) }}/kg · preço sugerido
          {{ formatarMoeda(calcularPrecoSugeridoPorKg(ordem.custoEfetivoPorKg)) }}/kg
        </div>
        <div v-if="ordem.custoPorCorte?.length" class="ordem-detalhe">
          <span v-for="c in ordem.custoPorCorte" :key="c.nome">{{ c.nome }}: {{ c.pesoKg }}kg · {{ formatarMoeda(c.custoTotal) }} · </span>
        </div>
        <div class="ordem-saidas">
          <span v-for="saida in ordem.saidas" :key="saida.id" class="etiqueta-saida">
            {{ saida.nome }} · {{ saida.pesoKg.toFixed(1) }}kg
            <template v-if="saida.destino"> → {{ NOMES_DESTINO[saida.destino] }}</template>
          </span>
        </div>
        <div class="ordem-acoes">
          <button v-if="!ordem.enviadaAoEstoque" type="button" class="botao-primario" @click="enviarAoEstoque(ordem.id)">Enviar cortes ao estoque</button>
          <span v-else class="vazio">{{ enviadaAoEstoque[ordem.id] ?? 'Enviada' }} lotes no estoque.</span>
          <button v-if="!ordem.enviadaAoEstoque" type="button" class="botao-primario" @click="cancelarOrdem(ordem.id)">Cancelar ordem</button>
        </div>
      </div>
    </div>

    <Modal v-if="pecaEmDesossa && templateDaPeca" :titulo="`Ordem de desossa — ${pecaEmDesossa.tipoDePeca}`" @fechar="fecharModal">
      <p class="texto-aviso">
        {{ pecaEmDesossa.pesoKg }} kg recebidos de {{ pecaEmDesossa.fornecedor }} — rendimento esperado do template:
        {{ (rendimentoEsperadoDoTemplate * 100).toFixed(0) }}%.
      </p>

      <div class="grupo-campos">
        <div class="grupo-titulo">Cortes de venda</div>
        <label v-for="corte in templateDaPeca.cortesEsperados" :key="corte.nome" class="campo-inline">
          <span>{{ corte.nome }} (esperado {{ (corte.percentualEsperado * 100).toFixed(0) }}%)</span>
          <input v-model.number="pesosPorCorte[corte.nome]" type="number" min="0" step="0.1" placeholder="peso real (kg)" />
        </label>
      </div>

      <div class="grupo-campos">
        <div class="grupo-titulo">Subprodutos (osso, sebo, apara, perda)</div>
        <label v-for="secundaria in SAIDAS_SECUNDARIAS_PADRAO" :key="secundaria.classificacao" class="campo-inline">
          <span>{{ secundaria.nome }} → {{ NOMES_DESTINO[secundaria.destinoPadrao] }}</span>
          <input
            v-model.number="pesosSecundarios[secundaria.classificacao]"
            type="number"
            min="0"
            step="0.1"
            placeholder="peso (kg)"
          />
        </label>
      </div>

      <button class="botao-primario" type="button" @click="confirmarDesossa">Concluir desossa</button>
    </Modal>
  </div>
</template>

<style scoped>
.pagina {
  padding: 36px 44px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 640px) {
  .pagina {
    padding: 24px 16px 90px;
  }
  .ordem-acoes {
    flex-wrap: wrap;
  }
}

.titulo {
  font-family: 'Bodoni Moda', serif;
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.secao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.secao-titulo {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.vazio {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.erro {
  font-size: 13px;
  color: var(--cor-error);
  background: var(--cor-error-container);
  border-radius: 10px;
  padding: 10px 14px;
}

.nota {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
  margin: 0;
}

.form-grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.grade-pecas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.cartao-peca {
  border: 1px solid var(--cor-outline);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.peca-nome {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.peca-meta {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.botao-primario {
  align-self: flex-start;
  margin-top: 4px;
  padding: 8px 14px;
  border: none;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.linha-ordem {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--cor-outline);
}

.linha-ordem:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.ordem-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: var(--cor-on-surface);
  flex-wrap: wrap;
}

.ordem-detalhe {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.ordem-saidas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ordem-acoes { display: flex; gap: 8px; align-items: center; margin-top: 4px; }

.etiqueta-saida {
  font-size: 11px;
  color: var(--cor-on-surface-variant);
  background: var(--cor-surface-variant);
  border-radius: 20px;
  padding: 3px 10px;
}

.texto-aviso {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
  margin: 0;
}

.grupo-campos {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grupo-titulo {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--cor-on-surface-variant);
}

.campo-inline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--cor-on-surface-variant);
}

.campo-inline input,
.campo-inline select {
  padding: 10px 12px;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  width: 100%;
  box-sizing: border-box;
}

.campo-inline input:focus-visible,
.campo-inline select:focus-visible {
  outline: 2px solid var(--cor-primary);
  outline-offset: 1px;
}
</style>
