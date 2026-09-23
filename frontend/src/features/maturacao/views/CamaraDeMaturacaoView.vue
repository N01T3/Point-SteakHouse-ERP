<script setup lang="ts">
import { computed, ref } from 'vue'
import BadgeStatus from '../../../shared/components/BadgeStatus.vue'
import BarraDeProgresso from '../../../shared/components/BarraDeProgresso.vue'
import Modal from '../../../shared/components/Modal.vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { useMercadoStore } from '../../mercado/store/mercado.store'
import {
  custoAtualPorKg,
  desvioSignificativo,
  estaProntaParaFinalizar,
  percentualDePerdaReal,
  pesoProjetadoKg,
} from '../logica/projecao-de-evaporacao'
import { useMaturacaoStore } from '../store/maturacao.store'
import { type Camara, NOMES_TECNICA, type PecaEmMaturacao } from '../types'

const store = useMaturacaoStore()
const mercado = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()
const avisoEstoque = ref('')
const erro = ref('')

// iniciar maturação
const nNome = ref('')
const nTecnica = ref<'dry_aged' | 'wet_aged'>('dry_aged')
const nCamara = ref('camara-1')
const nPeso = ref<number | null>(null)
const nDias = ref<number | null>(null)
const nCusto = ref<number | null>(null)
const nLote = ref('')
const nPesoAtual = ref<Record<string, number | null>>({})

function iniciar(): void {
  erro.value = ''
  try {
    if (nPeso.value === null || nDias.value === null || nCusto.value === null)
      throw new Error('Informe peso, prazo e custo.')
    store.iniciarMaturacao({
      nome: nNome.value,
      tecnica: nTecnica.value,
      camaraId: nCamara.value,
      pesoInicialKg: nPeso.value,
      diasTotal: nDias.value,
      custoInicialPorKg: nCusto.value,
      loteOrigem: nLote.value,
      responsavel: auth.usuario?.nome,
    })
    nNome.value = ''
    nPeso.value = null
    nDias.value = null
    nCusto.value = null
    nLote.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível iniciar.'
  }
}

function salvarPeso(pecaId: string): void {
  erro.value = ''
  try {
    const v = nPesoAtual.value[pecaId]
    if (v === null || v === undefined) throw new Error('Informe o peso atual.')
    store.registrarPesagem(pecaId, v)
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível registrar.'
  }
}

const pecaSelecionadaId = ref<string | null>(null)
const pecaSelecionada = computed(
  () => store.pecas.find((peca) => peca.id === pecaSelecionadaId.value) ?? null,
)

function camaraDaPeca(peca: PecaEmMaturacao): Camara | undefined {
  return store.camaras.find((camara) => camara.id === peca.camaraId)
}

function dentroDaFaixaIdeal(camara: Camara): boolean {
  return (
    camara.temperaturaAtual >= camara.temperaturaIdealMin &&
    camara.temperaturaAtual <= camara.temperaturaIdealMax &&
    camara.umidadeAtual >= camara.umidadeIdealMin &&
    camara.umidadeAtual <= camara.umidadeIdealMax
  )
}

function finalizarPeca(pecaId: string): void {
  erro.value = ''
  try {
    const peca = store.pecas.find((p) => p.id === pecaId)
    if (!peca) return
    store.finalizarMaturacao(pecaId)
    mercado.aplicarMaturacaoAoEstoque(peca, auth.usuario?.nome ?? 'operador')
    avisoEstoque.value = `${peca.nome} finalizada e enviada ao estoque (Balcão).`
    pecaSelecionadaId.value = null
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível finalizar.'
  }
}
</script>

<template>
  <div class="pagina">
    <div class="titulo">Câmara de Maturação</div>
    <div v-if="avisoEstoque" class="aviso-desvio" role="status">{{ avisoEstoque }}</div>
    <div v-if="erro" class="aviso-desvio" role="alert">{{ erro }}</div>

    <div class="cartao-camara cartao-form">
      <div class="secao-titulo">Iniciar maturação — a partir de lote recebido</div>
      <div class="nota">
        A peça sai do estoque pelo lote de origem e entra na câmara com custo e prazo controlados.
      </div>
      <div class="form-grade">
        <label class="campo"
          ><span>Peça</span><input v-model="nNome" type="text" placeholder="ex.: Ancho Angus"
        /></label>
        <label class="campo"
          ><span>Técnica</span
          ><select v-model="nTecnica">
            <option value="dry_aged">Dry aged</option>
            <option value="wet_aged">Wet aged</option>
          </select></label
        >
        <label class="campo"
          ><span>Câmara</span
          ><select v-model="nCamara">
            <option v-for="c in store.camaras" :key="c.id" :value="c.id">{{ c.nome }}</option>
          </select></label
        >
        <label class="campo"
          ><span>Peso inicial (kg)</span
          ><input v-model.number="nPeso" type="number" min="0" step="0.01" placeholder="0,00"
        /></label>
        <label class="campo"
          ><span>Prazo (dias)</span
          ><input v-model.number="nDias" type="number" min="1" step="1" placeholder="30"
        /></label>
        <label class="campo"
          ><span>Custo/kg (R$)</span
          ><input v-model.number="nCusto" type="number" min="0" step="0.01" placeholder="0,00"
        /></label>
        <label class="campo"
          ><span>Lote origem</span><input v-model="nLote" type="text" placeholder="L…"
        /></label>
      </div>
      <div class="acoes-linha">
        <button class="botao-primario" type="button" @click="iniciar">Iniciar maturação</button>
        <span v-if="store.pecasFinalizadas.length" class="nota"
          >{{ store.pecasFinalizadas.length }} finalizada(s) no histórico.</span
        >
      </div>
    </div>

    <div class="grade-camaras">
      <div v-for="camara in store.camaras" :key="camara.id" class="cartao-camara">
        <div class="camara-cabecalho">
          <span class="camara-nome">{{ camara.nome }}</span>
          <BadgeStatus :tom="dentroDaFaixaIdeal(camara) ? 'sucesso' : 'erro'">
            {{ dentroDaFaixaIdeal(camara) ? 'Dentro da faixa ideal' : 'Fora da faixa ideal' }}
          </BadgeStatus>
        </div>
        <div class="camara-medidas">
          <span
            >{{ camara.temperaturaAtual }}°C (ideal {{ camara.temperaturaIdealMin }}–{{
              camara.temperaturaIdealMax
            }}°C)</span
          >
          <span
            >{{ camara.umidadeAtual }}% UR (ideal {{ camara.umidadeIdealMin }}–{{
              camara.umidadeIdealMax
            }}%)</span
          >
        </div>
      </div>
    </div>

    <div class="grade-pecas">
      <button
        v-for="peca in store.pecas"
        :key="peca.id"
        class="cartao-peca"
        type="button"
        @click="pecaSelecionadaId = peca.id"
      >
        <div class="peca-cabecalho">
          <span class="peca-nome">{{ peca.nome }}</span>
          <span class="peca-tecnica">{{ NOMES_TECNICA[peca.tecnica] }}</span>
        </div>
        <div class="peca-dias">{{ peca.diasAtual }}/{{ peca.diasTotal }} dias</div>
        <BarraDeProgresso :percentual="(peca.diasAtual / peca.diasTotal) * 100" />
        <div class="peca-rodape">
          <span>{{ peca.pesoAtualKg.toFixed(2) }} kg atual</span>
          <span v-if="estaProntaParaFinalizar(peca)" class="etiqueta pronta">Pronta</span>
          <span v-else-if="desvioSignificativo(peca)" class="etiqueta desvio">Desvio</span>
        </div>
      </button>
    </div>

    <Modal v-if="pecaSelecionada" :titulo="pecaSelecionada.nome" @fechar="pecaSelecionadaId = null">
      <div class="detalhe-linha">
        <span>Técnica</span>
        <strong>{{ NOMES_TECNICA[pecaSelecionada.tecnica] }}</strong>
      </div>
      <div class="detalhe-linha">
        <span>Câmara</span>
        <strong>{{ camaraDaPeca(pecaSelecionada)?.nome ?? '—' }}</strong>
      </div>
      <div class="detalhe-linha">
        <span>Peso inicial</span>
        <strong>{{ pecaSelecionada.pesoInicialKg.toFixed(2) }} kg</strong>
      </div>
      <div class="detalhe-linha">
        <span>Peso atual</span>
        <strong>{{ pecaSelecionada.pesoAtualKg.toFixed(2) }} kg</strong>
      </div>
      <div class="detalhe-linha">
        <span>Peso projetado (modelo)</span>
        <strong>{{ pesoProjetadoKg(pecaSelecionada).toFixed(2) }} kg</strong>
      </div>
      <div class="detalhe-linha">
        <span>Perda acumulada</span>
        <strong>{{ (percentualDePerdaReal(pecaSelecionada) * 100).toFixed(1) }}%</strong>
      </div>
      <div class="detalhe-linha">
        <span>Custo atual por kg</span>
        <strong>{{ formatarMoeda(custoAtualPorKg(pecaSelecionada)) }}</strong>
      </div>
      <div class="detalhe-linha pesagem">
        <span>Registrar pesagem</span>
        <span class="pesagem-controles">
          <input
            v-model.number="nPesoAtual[pecaSelecionada.id]"
            type="number"
            min="0"
            step="0.01"
            placeholder="kg atual"
            aria-label="Peso atual em kg"
          />
          <button type="button" class="botao-secundario" @click="salvarPeso(pecaSelecionada.id)">
            Salvar
          </button>
        </span>
      </div>
      <div v-if="desvioSignificativo(pecaSelecionada)" class="aviso-desvio">
        Peso real fora da curva projetada — possível falha de câmara ou variável fora do padrão.
      </div>
      <button
        class="botao-primario"
        type="button"
        :disabled="!estaProntaParaFinalizar(pecaSelecionada)"
        @click="finalizarPeca(pecaSelecionada.id)"
      >
        {{
          estaProntaParaFinalizar(pecaSelecionada)
            ? 'Finalizar maturação'
            : 'Ainda não atingiu o tempo mínimo'
        }}
      </button>
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
}

.titulo {
  font-family: var(--fonte-display);
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.grade-camaras {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
  max-width: 760px;
}

.cartao-camara {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cartao-form {
  gap: 12px;
  max-width: 760px;
}

.secao-titulo {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
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

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--cor-on-surface-variant);
}

.campo input,
.campo select {
  padding: 10px 12px;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 400;
  width: 100%;
  box-sizing: border-box;
}

.campo input:focus-visible,
.campo select:focus-visible {
  outline: 2px solid var(--cor-primary);
  outline-offset: 1px;
}

.acoes-linha {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.camara-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.camara-nome {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.camara-medidas {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.grade-pecas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.cartao-peca {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
}

.peca-cabecalho {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.peca-nome {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.peca-tecnica {
  font-size: 11px;
  color: var(--cor-on-surface-variant);
}

.peca-dias {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.peca-rodape {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.etiqueta {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 20px;
}

.etiqueta.pronta {
  background: var(--cor-success);
  color: var(--cor-bg);
}

.etiqueta.desvio {
  background: var(--cor-error-container);
  color: var(--cor-on-error-container);
}

.detalhe-linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--cor-on-surface);
}

.pesagem-controles {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pesagem-controles input {
  width: 110px;
  padding: 9px 12px;
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13px;
  box-sizing: border-box;
}

.botao-secundario {
  padding: 9px 16px;
  min-height: 40px;
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

.aviso-desvio {
  font-size: 12.5px;
  color: var(--cor-on-error-container);
  background: var(--cor-error-container);
  border-radius: 10px;
  padding: 10px 12px;
}

.botao-primario {
  padding: 11px 16px;
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
</style>
