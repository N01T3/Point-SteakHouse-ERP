<script setup lang="ts">
import { computed } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useMercadoStore } from '../store/mercado.store'

const store = useMercadoStore()
const { formatarMoeda } = useFormatador()

const topProdutos = computed(() => {
  const mapa = new Map<string, { nome: string; quantidade: number; receita: number }>()
  for (const venda of store.vendas) {
    if (venda.estado === 'CANCELADA') continue
    for (const item of venda.itens) {
      const atual = mapa.get(item.produtoId) ?? { nome: item.nome, quantidade: 0, receita: 0 }
      atual.quantidade += item.quantidade
      atual.receita += item.quantidade * item.precoUnitario - item.descontoPromo - item.descontoManual
      mapa.set(item.produtoId, atual)
    }
  }
  return [...mapa.values()].sort((a, b) => b.receita - a.receita).slice(0, 5)
})
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <v-card rounded="xl" variant="tonal"
        ><v-card-text
          ><div class="text-caption">Faturamento</div>
          <div class="text-h6">{{ formatarMoeda(store.faturamentoTurno) }}</div></v-card-text
        ></v-card
      >
      <v-card rounded="xl" variant="tonal"
        ><v-card-text
          ><div class="text-caption">Ticket medio</div>
          <div class="text-h6">{{ formatarMoeda(store.ticketMedio) }}</div></v-card-text
        ></v-card
      >
      <v-card rounded="xl" variant="tonal"
        ><v-card-text
          ><div class="text-caption">Vendas</div>
          <div class="text-h6">{{ store.vendas.length }}</div></v-card-text
        ></v-card
      >
      <v-card rounded="xl" variant="tonal"
        ><v-card-text
          ><div class="text-caption">Fiado</div>
          <div class="text-h6">{{ formatarMoeda(store.fiadoTurno) }}</div></v-card-text
        ></v-card
      >
    </div>
    <v-card rounded="xl">
      <v-card-title>Mais vendidos no turno</v-card-title>
      <v-card-text>
        <v-list v-if="topProdutos.length > 0" density="compact">
          <v-list-item v-for="item in topProdutos" :key="item.nome"
            ><v-list-item-title>{{ item.nome }}</v-list-item-title
            ><template #append
              ><strong>{{ formatarMoeda(item.receita) }}</strong></template
            ></v-list-item
          >
        </v-list>
        <div v-else class="text-caption">Sem vendas ainda.</div>
      </v-card-text>
    </v-card>
    <v-card rounded="xl">
      <v-card-title>Validade - acao necessaria</v-card-title>
      <v-card-text>
        <v-alert
          v-for="alerta in store.alertasValidade"
          :key="alerta.lote"
          :type="alerta.tipo === 'vencido' ? 'error' : 'warning'"
          variant="tonal"
          density="compact"
          class="mb-2"
          :prepend-icon="alerta.tipo === 'vencido' ? 'mdi-alert-octagon' : 'mdi-clock-alert'"
        >
          {{ alerta.produto }} - lote {{ alerta.lote }} - {{ alerta.quantidade }} -
          {{ alerta.tipo === 'vencido' ? 'vencido - retirar da venda' : `vence em ${alerta.dias}d` }}
        </v-alert>
        <div v-if="store.alertasValidade.length === 0" class="text-caption">Nenhum lote critico.</div>
      </v-card-text>
    </v-card>
    <v-card rounded="xl">
      <v-card-title>Reposicao sugerida</v-card-title>
      <v-card-text>
        <v-list v-if="store.reposicoes.length > 0" density="compact">
          <v-list-item v-for="rep in store.reposicoes" :key="rep.produtoId"
            ><v-list-item-title>{{ rep.produto }} - atual {{ rep.atual }}{{ rep.unidade }}</v-list-item-title
            ><template #append
              ><v-chip size="small" color="primary" variant="tonal"
                >pedir {{ rep.sugestao }}{{ rep.unidade }}</v-chip
              ></template
            ></v-list-item
          >
        </v-list>
        <div v-else class="text-caption">Estoque dentro do minimo.</div>
      </v-card-text>
    </v-card>
  </div>
</template>
