<script setup lang="ts">
import { RouterLink } from 'vue-router'

interface PendenciaAdministrativa {
  titulo: string
  detalhe: string
  nivel: 'critica' | 'atencao'
  destino: string
}

const pendencias: PendenciaAdministrativa[] = [
  { titulo: '3 itens precisam de reposição', detalhe: 'Filé mignon abaixo do mínimo · 2 dias de cobertura', nivel: 'critica', destino: 'clientes' },
  { titulo: '2 lotes vencem em 48h', detalhe: 'Picanha L2408 · 8,4 kg na câmara fria 2', nivel: 'atencao', destino: 'maturacao' },
  { titulo: '1 conta a pagar vence hoje', detalhe: 'Energia · competência atual', nivel: 'atencao', destino: 'financeiro' },
]
</script>

<template>
  <div class="pagina">
    <div class="titulo">Administração — o que precisa de ação</div>

    <div v-for="pendencia in pendencias" :key="pendencia.titulo" class="cartao" :class="pendencia.nivel">
      <div>
        <div class="pendencia-titulo">{{ pendencia.titulo }}</div>
        <div class="pendencia-detalhe">{{ pendencia.detalhe }}</div>
      </div>
      <RouterLink :to="{ name: pendencia.destino }" class="link">resolver →</RouterLink>
    </div>

    <div class="atalhos">
      <RouterLink :to="{ name: 'financeiro' }" class="atalho">Finanças</RouterLink>
      <RouterLink :to="{ name: 'mercado' }" class="atalho">Visão do Mercado</RouterLink>
      <RouterLink :to="{ name: 'dashboard' }" class="atalho">Dashboard</RouterLink>
    </div>
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

.titulo {
  font-family: 'Bodoni Moda', serif;
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-left: 4px solid var(--cor-outline);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.cartao.critica {
  border-left-color: var(--cor-error);
}

.cartao.atencao {
  border-left-color: var(--cor-secondary);
}

.pendencia-titulo {
  font-size: 15px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.pendencia-detalhe {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
  margin-top: 4px;
}

.link {
  font-size: 13px;
  font-weight: 600;
  color: var(--cor-primary);
  flex-shrink: 0;
}

.atalhos {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.atalho {
  padding: 10px 16px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  font-size: 13px;
  font-weight: 600;
}
</style>
