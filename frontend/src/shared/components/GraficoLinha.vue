<script setup lang="ts">
import { computed } from 'vue'

export interface SerieLinha {
  nome: string
  cor: string
  valores: number[]
}

const props = defineProps<{ rotulos: string[]; series: SerieLinha[] }>()

const LARGURA = 640
const ALTURA = 230
const MARGEM = { superior: 14, direita: 12, inferior: 26, esquerda: 46 }
const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita
const alturaUtil = ALTURA - MARGEM.superior - MARGEM.inferior

const todosValores = computed(() => props.series.flatMap((s) => s.valores))
const minimo = computed(() => Math.min(0, ...todosValores.value))
const maximo = computed(() => Math.max(1, ...todosValores.value))

function escalaX(i: number): number {
  const n = Math.max(1, props.rotulos.length - 1)
  return MARGEM.esquerda + (i / n) * larguraUtil
}

function escalaY(v: number): number {
  const faixa = maximo.value - minimo.value || 1
  return MARGEM.superior + (1 - (v - minimo.value) / faixa) * alturaUtil
}

function caminho(valores: number[]): string {
  return valores
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${escalaX(i).toFixed(1)},${escalaY(v).toFixed(1)}`)
    .join(' ')
}

const linhasGrade = computed(() => {
  const faixa = maximo.value - minimo.value || 1
  return [0, 1, 2, 3, 4].map((i) => minimo.value + (faixa * i) / 4)
})

const passoRotulo = computed(() => Math.max(1, Math.ceil(props.rotulos.length / 8)))
const temDados = computed(() => props.rotulos.length > 0 && props.series.some((s) => s.valores.length > 0))
</script>

<template>
  <div class="linha-container">
    <div v-if="series.length > 0" class="legenda">
      <span v-for="s in series" :key="s.nome" class="item">
        <span class="ponto" :style="{ background: s.cor }" />{{ s.nome }}
      </span>
    </div>
    <svg
      v-if="temDados"
      :viewBox="`0 0 ${LARGURA} ${ALTURA}`"
      class="grafico-svg"
      role="img"
      aria-label="Gráfico de linha"
    >
      <line
        v-for="(g, i) in linhasGrade"
        :key="i"
        :x1="MARGEM.esquerda"
        :x2="LARGURA - MARGEM.direita"
        :y1="escalaY(g)"
        :y2="escalaY(g)"
        class="grade"
      />
      <text
        v-for="(g, i) in linhasGrade"
        :key="`t-${i}`"
        :x="MARGEM.esquerda - 6"
        :y="escalaY(g)"
        class="rotulo eixo-y"
      >
        {{ g >= 1000 || g <= -1000 ? `${(g / 1000).toFixed(0)}k` : Math.round(g) }}
      </text>
      <text
        v-for="(r, i) in rotulos"
        v-show="i % passoRotulo === 0"
        :key="`r-${i}`"
        :x="escalaX(i)"
        :y="ALTURA - 8"
        class="rotulo eixo-x"
      >
        {{ r }}
      </text>
      <path
        v-for="s in series"
        :key="s.nome"
        :d="caminho(s.valores)"
        fill="none"
        :stroke="s.cor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="s in series"
        :key="`end-${s.nome}`"
        :cx="escalaX(s.valores.length - 1)"
        :cy="escalaY(s.valores[s.valores.length - 1])"
        r="3"
        :fill="s.cor"
      />
    </svg>
    <div v-else class="vazio">Sem dados no período.</div>
  </div>
</template>

<style scoped>
.linha-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.legenda {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}
.ponto {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.grafico-svg {
  width: 100%;
  height: auto;
}
.grade {
  stroke: var(--cor-outline);
  stroke-width: 1;
  opacity: 0.6;
}
.rotulo {
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
.vazio {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}
</style>
