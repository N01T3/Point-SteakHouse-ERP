<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { LIMITE_DIVERGENCIA_CAIXA, useMercadoStore } from '../store/mercado.store'
import type { TipoMovimentoCaixa } from '../tipos'

const store = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const valorMov = ref<number | null>(null)
const motivoMov = ref('')
const tipoMov = ref<TipoMovimentoCaixa>('SANGRIA')
const valorContado = ref<number | null>(null)
const erro = ref('')
const sucesso = ref('')

const podeAprovar = computed(
  () => auth.papel === 'PROPRIETARIO' || auth.papel === 'ADMINISTRADOR',
)

function registrar(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (valorMov.value === null) return
    store.registrarMovimento(tipoMov.value, valorMov.value, motivoMov.value)
    sucesso.value = `${tipoMov.value === 'SANGRIA' ? 'Sangria' : 'Suprimento'} de ${formatarMoeda(valorMov.value)} registrada.`
    valorMov.value = null
    motivoMov.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível registrar.'
  }
}

function fechar(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (valorContado.value === null) return
    const turno = store.fecharTurno(valorContado.value, podeAprovar.value ? auth.usuario?.nome : undefined)
    sucesso.value = `Turno fechado com diferença de ${formatarMoeda(turno.diferenca ?? 0)}.`
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível fechar.'
  }
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="painel">
    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
    <div v-if="sucesso" class="sucesso" role="status">{{ sucesso }}</div>

    <div class="cartao">
      <div class="secao-titulo">Turno atual</div>
      <div class="grade">
        <div><span>Operador</span><strong>{{ store.turno?.operador }}</strong></div>
        <div><span>Abertura</span><strong>{{ store.turno ? hora(store.turno.abertoEm) : '—' }} · {{ formatarMoeda(store.turno?.valorInicial ?? 0) }}</strong></div>
        <div><span>Esperado em dinheiro</span><strong>{{ formatarMoeda(store.esperadoDinheiro) }}</strong></div>
        <div><span>Vendas</span><strong>{{ store.vendas.length }} · {{ formatarMoeda(store.faturamentoTurno) }}</strong></div>
        <div><span>Kg vendidos</span><strong>{{ store.kgVendidosTurno.toFixed(3) }} kg</strong></div>
      </div>
    </div>

    <div v-if="store.turno?.estado === 'ABERTO'" class="cartao">
      <div class="secao-titulo">Sangria / suprimento</div>
      <div class="linha">
        <div class="alternador">
          <button type="button" :class="{ ativo: tipoMov === 'SANGRIA' }" @click="tipoMov = 'SANGRIA'">Sangria</button>
          <button type="button" :class="{ ativo: tipoMov === 'SUPRIMENTO' }" @click="tipoMov = 'SUPRIMENTO'">Suprimento</button>
        </div>
        <input v-model.number="valorMov" type="number" min="0" step="0.01" placeholder="Valor" inputmode="decimal" />
        <input v-model="motivoMov" type="text" placeholder="Motivo (obrigatório)" />
        <button type="button" class="botao-secundario" @click="registrar">Registrar</button>
      </div>
      <div v-for="mov in store.movimentos" :key="mov.id" class="movimento">
        <span>{{ mov.tipo === 'SANGRIA' ? '−' : '+' }}{{ formatarMoeda(mov.valor) }} · {{ mov.motivo }} · {{ hora(mov.criadoEm) }}</span>
      </div>
    </div>

    <div v-if="store.turno?.estado === 'ABERTO'" class="cartao">
      <div class="secao-titulo">Fechar turno</div>
      <div class="linha">
        <input v-model.number="valorContado" type="number" min="0" step="0.01" placeholder="Valor contado" inputmode="decimal" />
        <button type="button" class="botao-primario" @click="fechar">Fechar caixa</button>
      </div>
      <div class="nota">Divergências acima de {{ formatarMoeda(LIMITE_DIVERGENCIA_CAIXA) }} exigem Proprietário ou Administrador.</div>
    </div>

    <div v-if="store.turno?.estado === 'FECHADO'" class="cartao">
      <div class="secao-titulo">Turno fechado</div>
      <div class="grade">
        <div><span>Esperado</span><strong>{{ formatarMoeda(store.esperadoDinheiro) }}</strong></div>
        <div><span>Contado</span><strong>{{ formatarMoeda(store.turno.valorContado ?? 0) }}</strong></div>
        <div><span>Diferença</span><strong>{{ formatarMoeda(store.turno.diferenca ?? 0) }}</strong></div>
        <div v-if="store.turno.aprovadorDivergencia"><span>Aprovado por</span><strong>{{ store.turno.aprovadorDivergencia }}</strong></div>
      </div>
      <button type="button" class="botao-secundario" @click="store.novoTurno()">Abrir novo turno</button>
    </div>
  </div>
</template>

<style scoped>
.painel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.erro,
.sucesso {
  font-size: 13px;
  border-radius: 10px;
  padding: 10px 14px;
}

.erro {
  color: var(--cor-error);
  background: var(--cor-error-container);
}

.sucesso {
  color: var(--cor-success);
  background: var(--cor-surface-variant);
}

.cartao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.secao-titulo {
  font-size: 14px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.grade div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.grade strong {
  font-size: 14px;
  color: var(--cor-on-surface);
}

.linha {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.linha input {
  flex: 1;
  min-width: 120px;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
}

.alternador {
  display: flex;
  border: 1px solid var(--cor-outline);
  border-radius: 100px;
  overflow: hidden;
}

.alternador button {
  border: none;
  background: transparent;
  padding: 11px 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--cor-on-surface-variant);
  cursor: pointer;
}

.alternador button.ativo {
  background: var(--cor-primary-container);
  color: var(--cor-on-primary-container);
}

.movimento {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.botao-primario {
  padding: 11px 18px;
  border: none;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.botao-secundario {
  padding: 11px 18px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.nota {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}
</style>
