<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import AdministracaoMercado from '../components/AdministracaoMercado.vue'
import CaixaVenda from '../components/CaixaVenda.vue'
import CatalogoProdutos from '../components/CatalogoProdutos.vue'
import GestaoMercado from '../components/GestaoMercado.vue'
import HistoricoVendas from '../components/HistoricoVendas.vue'
import PainelTurno from '../components/PainelTurno.vue'
import { useMercadoStore } from '../store/mercado.store'

type Aba = 'caixa' | 'produtos' | 'historico' | 'turno' | 'gestao' | 'admin'

const store = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const aba = ref<Aba>('caixa')
const valorInicial = ref<number | null>(200)
const erro = ref('')

const podeVerGestao = computed(
  () => auth.papel === 'PROPRIETARIO' || auth.papel === 'ADMINISTRADOR',
)

// Cadastro assistido: bip de EAN desconhecido no caixa leva ao catálogo
watch(
  () => store.eanParaCadastrar,
  (codigo) => {
    if (codigo) aba.value = 'produtos'
  },
)

function abrir(): void {
  erro.value = ''
  try {
    if (valorInicial.value === null) return
    store.abrirTurno(valorInicial.value, auth.usuario?.nome ?? 'operador')
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível abrir o turno.'
  }
}
</script>

<template>
  <div class="pagina">
    <div class="cabecalho">
      <div>
        <div class="titulo">Mercado</div>
        <div v-if="store.turno" class="subtitulo">
          {{ store.turno.terminal }} · {{ store.turno.operador }} · {{ store.turno.estado === 'ABERTO' ? 'turno aberto' : 'turno fechado' }}
        </div>
      </div>
      <div v-if="store.turno" class="status">
        <button
          type="button"
          class="conexao"
          :class="{ off: !store.online }"
          @click="store.alternarOnline()"
          :title="store.online ? 'Simular queda de internet' : 'Voltar a sincronizar'"
        >
          {{ store.online ? 'Online · sincronizado' : `Offline · ${store.vendasPendentesSinc} pendentes` }}
        </button>
      </div>
    </div>

    <div v-if="!store.turno" class="cartao">
      <div class="secao-titulo">Abrir turno</div>
      <p class="texto">Conte o dinheiro da gaveta e informe o valor inicial.</p>
      <div class="linha">
        <input v-model.number="valorInicial" type="number" min="0" step="0.01" inputmode="decimal" />
        <button type="button" class="botao-primario" @click="abrir">Abrir caixa</button>
      </div>
      <div v-if="erro" class="erro">{{ erro }}</div>
    </div>

    <template v-else>
      <div class="abas">
        <button type="button" :class="{ ativa: aba === 'caixa' }" @click="aba = 'caixa'">Caixa</button>
        <button type="button" :class="{ ativa: aba === 'produtos' }" @click="aba = 'produtos'">
          Produtos e Depósito ({{ store.produtos.length }})
        </button>
        <button type="button" :class="{ ativa: aba === 'historico' }" @click="aba = 'historico'">
          Vendas{{ store.vendas.length > 0 ? ` (${store.vendas.length})` : '' }}
        </button>
        <button type="button" :class="{ ativa: aba === 'turno' }" @click="aba = 'turno'">Turno</button>
        <button v-if="podeVerGestao" type="button" :class="{ ativa: aba === 'gestao' }" @click="aba = 'gestao'">
          Gestão · {{ formatarMoeda(store.faturamentoTurno) }}
        </button>
        <button v-if="podeVerGestao" type="button" :class="{ ativa: aba === 'admin' }" @click="aba = 'admin'">
          Administração
        </button>
      </div>

      <CaixaVenda v-if="aba === 'caixa'" />
      <CatalogoProdutos v-if="aba === 'produtos'" />
      <HistoricoVendas v-if="aba === 'historico'" />
      <PainelTurno v-if="aba === 'turno'" />
      <GestaoMercado v-if="aba === 'gestao' && podeVerGestao" />
      <AdministracaoMercado v-if="aba === 'admin' && podeVerGestao" />
    </template>
  </div>
</template>

<style scoped>
.pagina {
  padding: 36px 44px 60px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (max-width: 640px) {
  .pagina {
    padding: 24px 16px 90px;
  }
}

.cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.titulo {
  font-family: 'Bodoni Moda', serif;
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.subtitulo {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

.conexao {
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  border-radius: 100px;
  padding: 9px 14px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.conexao.off {
  border-color: var(--cor-error);
  color: var(--cor-error);
}

.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 480px;
}

.secao-titulo {
  font-size: 15px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.texto {
  margin: 0;
  font-size: 13.5px;
  color: var(--cor-on-surface-variant);
}

.linha {
  display: flex;
  gap: 8px;
}

.linha input {
  flex: 1;
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 15px;
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
}

.erro {
  font-size: 13px;
  color: var(--cor-error);
}

.abas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.abas button {
  padding: 10px 18px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface-variant);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
}

.abas button.ativa {
  background: var(--cor-primary-container);
  color: var(--cor-on-primary-container);
  border-color: transparent;
}
</style>
