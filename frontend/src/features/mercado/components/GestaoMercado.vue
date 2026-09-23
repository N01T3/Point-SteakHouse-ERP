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
  <div class="gestao">
    <div class="grade">
      <div class="kpi">
        <span>Faturamento do turno</span>
        <strong>{{ formatarMoeda(store.faturamentoTurno) }}</strong>
      </div>
      <div class="kpi">
        <span>Ticket médio</span>
        <strong>{{ formatarMoeda(store.ticketMedio) }}</strong>
      </div>
      <div class="kpi">
        <span>Vendas</span>
        <strong>{{ store.vendas.length }}</strong>
      </div>
      <div class="kpi">
        <span>Fiado do turno</span>
        <strong>{{ formatarMoeda(store.fiadoTurno) }}</strong>
      </div>
    </div>

    <div class="cartao">
      <div class="secao-titulo">Mais vendidos no turno</div>
      <div v-if="topProdutos.length === 0" class="texto">Sem vendas ainda — os dados aparecem aqui.</div>
      <div v-for="item in topProdutos" :key="item.nome" class="linha">
        <span>{{ item.nome }}</span>
        <strong>{{ formatarMoeda(item.receita) }}</strong>
      </div>
    </div>

    <div class="cartao">
      <div class="secao-titulo">Validade — ação necessária</div>
      <div v-if="store.alertasValidade.length === 0" class="texto">Nenhum lote crítico.</div>
      <div v-for="alerta in store.alertasValidade" :key="alerta.lote" class="linha" :class="alerta.tipo">
        <span>{{ alerta.produto }} · lote {{ alerta.lote }} · {{ alerta.quantidade }}</span>
        <strong>{{ alerta.tipo === 'vencido' ? 'vencido' : `vence em ${alerta.dias}d` }}</strong>
      </div>
    </div>

    <div class="cartao">
      <div class="secao-titulo">Reposição sugerida</div>
      <div v-if="store.reposicoes.length === 0" class="texto">Estoque dentro do mínimo.</div>
      <div v-for="rep in store.reposicoes" :key="rep.produtoId" class="linha">
        <span>{{ rep.produto }} · atual {{ rep.atual }}{{ rep.unidade }}</span>
        <strong>pedir {{ rep.sugestao }}{{ rep.unidade }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gestao {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.kpi {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi span {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.kpi strong {
  font-family: 'Bodoni Moda', serif;
  font-size: 20px;
  color: var(--cor-on-surface);
}

.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.secao-titulo {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.texto {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.linha {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--cor-on-surface);
}

.linha.vencido strong {
  color: var(--cor-error);
}

.linha.proximo strong {
  color: var(--cor-secondary);
}
</style>
