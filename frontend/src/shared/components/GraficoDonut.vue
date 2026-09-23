<script setup lang="ts">
export interface FatiaDoDonut {
  label: string
  percentual: number
  cor: string
}

const props = defineProps<{
  fatias: FatiaDoDonut[]
  valorCentral: string
  legendaCentral: string
}>()

const fundoConico = (() => {
  let acumulado = 0
  const partes = props.fatias.map((fatia) => {
    const inicio = acumulado
    acumulado += fatia.percentual
    return `${fatia.cor} ${inicio}% ${acumulado}%`
  })
  return `conic-gradient(${partes.join(', ')})`
})()
</script>

<template>
  <div class="container">
    <div class="anel" :style="{ background: fundoConico }">
      <div class="centro">
        <div class="valor-central">{{ valorCentral }}</div>
        <div class="legenda-central">{{ legendaCentral }}</div>
      </div>
    </div>
    <div class="legenda">
      <div v-for="fatia in fatias" :key="fatia.label" class="item-legenda">
        <span class="ponto" :style="{ background: fatia.cor }" />
        {{ fatia.label }} — {{ fatia.percentual }}%
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.anel {
  width: 148px;
  height: 148px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px auto;
}

.centro {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--cor-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.valor-central {
  font-family: 'Bodoni Moda', serif;
  font-size: 19px;
  font-weight: 600;
  color: var(--cor-on-surface);
}

.legenda-central {
  font-size: 10.5px;
  color: var(--cor-on-surface-variant);
}

.legenda {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-legenda {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.ponto {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
</style>
