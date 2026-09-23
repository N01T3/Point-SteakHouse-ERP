<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PontoDeCrescimento } from '../logica/crescimento-microbiano'

const props = defineProps<{
  pontos: PontoDeCrescimento[]
  limiteDeAcaoLog: number
}>()

const LARGURA = 640
const ALTURA = 220
const MARGEM = { superior: 16, direita: 16, inferior: 28, esquerda: 34 }
const DOMINIO_Y: [number, number] = [0, 9]

const mostrarTabela = ref(false)
const indicePassado = ref<number | null>(null)

const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita
const alturaUtil = ALTURA - MARGEM.superior - MARGEM.inferior

const horaMaxima = computed(() => props.pontos[props.pontos.length - 1]?.horas ?? 1)

function escalaX(horas: number): number {
  return MARGEM.esquerda + (horas / horaMaxima.value) * larguraUtil
}

function escalaY(valor: number): number {
  const [min, max] = DOMINIO_Y
  const fracao = (valor - min) / (max - min)
  return MARGEM.superior + (1 - fracao) * alturaUtil
}

const caminhoDaLinha = computed(() =>
  props.pontos.map((ponto, indice) => `${indice === 0 ? 'M' : 'L'}${escalaX(ponto.horas)},${escalaY(ponto.logCfuPorGrama)}`).join(' '),
)

const yDoLimite = computed(() => escalaY(props.limiteDeAcaoLog))

const marcasY = [0, 3, 6, 9]
const marcasX = computed(() => {
  const passo = horaMaxima.value / 4
  return [0, passo, passo * 2, passo * 3, horaMaxima.value]
})

const pontoAtivo = computed(() => (indicePassado.value !== null ? props.pontos[indicePassado.value] : null))

function aoMoverMouse(evento: MouseEvent): void {
  const svg = evento.currentTarget as SVGSVGElement
  const retangulo = svg.getBoundingClientRect()
  const xRelativo = ((evento.clientX - retangulo.left) / retangulo.width) * LARGURA
  const horasNoPonto = ((xRelativo - MARGEM.esquerda) / larguraUtil) * horaMaxima.value

  let maisProximo = 0
  let menorDistancia = Infinity
  props.pontos.forEach((ponto, indice) => {
    const distancia = Math.abs(ponto.horas - horasNoPonto)
    if (distancia < menorDistancia) {
      menorDistancia = distancia
      maisProximo = indice
    }
  })
  indicePassado.value = maisProximo
}

function aoSairDoMouse(): void {
  indicePassado.value = null
}

const linhasParaTabela = computed(() =>
  props.pontos.filter((_, indice) => indice % Math.max(1, Math.floor(props.pontos.length / 12)) === 0),
)
</script>

<template>
  <div class="grafico-container">
    <svg
      :viewBox="`0 0 ${LARGURA} ${ALTURA}`"
      class="grafico-svg"
      role="img"
      aria-label="Simulação de crescimento microbiano ao longo do tempo"
      @mousemove="aoMoverMouse"
      @mouseleave="aoSairDoMouse"
    >
      <line
        v-for="marca in marcasY"
        :key="`grade-${marca}`"
        :x1="MARGEM.esquerda"
        :x2="LARGURA - MARGEM.direita"
        :y1="escalaY(marca)"
        :y2="escalaY(marca)"
        class="linha-grade"
      />
      <text v-for="marca in marcasY" :key="`rotulo-y-${marca}`" :x="MARGEM.esquerda - 8" :y="escalaY(marca)" class="rotulo-eixo eixo-y">
        {{ marca }}
      </text>
      <text
        v-for="marca in marcasX"
        :key="`rotulo-x-${marca}`"
        :x="escalaX(marca)"
        :y="ALTURA - 8"
        class="rotulo-eixo eixo-x"
      >
        {{ marca.toFixed(0) }}h
      </text>

      <rect
        :x="MARGEM.esquerda"
        :y="MARGEM.superior"
        :width="larguraUtil"
        :height="Math.max(0, yDoLimite - MARGEM.superior)"
        class="area-acima-do-limite"
      />
      <line :x1="MARGEM.esquerda" :x2="LARGURA - MARGEM.direita" :y1="yDoLimite" :y2="yDoLimite" class="linha-limite" />

      <path :d="caminhoDaLinha" class="linha-crescimento" />

      <template v-if="pontoAtivo">
        <line
          :x1="escalaX(pontoAtivo.horas)"
          :x2="escalaX(pontoAtivo.horas)"
          :y1="MARGEM.superior"
          :y2="ALTURA - MARGEM.inferior"
          class="linha-crosshair"
        />
        <circle :cx="escalaX(pontoAtivo.horas)" :cy="escalaY(pontoAtivo.logCfuPorGrama)" r="4" class="ponto-ativo" />
      </template>
    </svg>

    <div v-if="pontoAtivo" class="tooltip">
      {{ pontoAtivo.horas.toFixed(1) }}h · {{ pontoAtivo.logCfuPorGrama.toFixed(2) }} log₁₀ CFU/g
    </div>

    <button class="botao-tabela" type="button" @click="mostrarTabela = !mostrarTabela">
      {{ mostrarTabela ? 'Ver gráfico' : 'Ver como tabela' }}
    </button>

    <table v-if="mostrarTabela" class="tabela-dados">
      <thead>
        <tr>
          <th>Horas</th>
          <th>log₁₀ CFU/g</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ponto in linhasParaTabela" :key="ponto.horas">
          <td>{{ ponto.horas.toFixed(1) }}</td>
          <td>{{ ponto.logCfuPorGrama.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.grafico-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.grafico-svg {
  width: 100%;
  height: auto;
}

.linha-grade {
  stroke: var(--cor-outline);
  stroke-width: 1;
  opacity: 0.6;
}

.rotulo-eixo {
  font-size: 9px;
  fill: var(--cor-on-surface-variant);
}

.eixo-y {
  text-anchor: end;
  dominant-baseline: middle;
}

.eixo-x {
  text-anchor: middle;
}

.area-acima-do-limite {
  fill: var(--cor-error);
  opacity: 0.08;
}

.linha-limite {
  stroke: var(--cor-error);
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
}

.linha-crescimento {
  fill: none;
  stroke: var(--cor-primary);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.linha-crosshair {
  stroke: var(--cor-on-surface-variant);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.ponto-ativo {
  fill: var(--cor-primary);
  stroke: var(--cor-surface);
  stroke-width: 2;
}

.tooltip {
  align-self: flex-start;
  font-size: 11.5px;
  color: var(--cor-on-surface);
  background: var(--cor-surface-variant);
  border-radius: 8px;
  padding: 4px 10px;
}

.botao-tabela {
  align-self: flex-start;
  border: none;
  background: none;
  color: var(--cor-primary);
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.tabela-dados {
  width: 100%;
  font-size: 11.5px;
  color: var(--cor-on-surface-variant);
  border-collapse: collapse;
}

.tabela-dados th,
.tabela-dados td {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid var(--cor-outline);
}
</style>
