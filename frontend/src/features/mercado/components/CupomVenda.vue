<script setup lang="ts">
import { computed, ref } from 'vue'
import { gerarHtmlCupom, gerarTextoCupom } from '../logica/cupom'
import { useMercadoStore } from '../store/mercado.store'
import type { Venda } from '../tipos'

const props = defineProps<{ venda: Venda; novidade?: boolean }>()
const emit = defineEmits<{ fechar: [] }>()

const store = useMercadoStore()
const erro = ref('')

const texto = computed(() => gerarTextoCupom(props.venda))

function imprimir(): void {
  erro.value = ''
  try {
    if (!props.novidade) store.registrarReimpressao(props.venda.id)
    const janela = window.open('', '_blank', 'width=320,height=600')
    if (!janela) throw new Error('Bloqueador de pop-up impediu a impressão.')
    janela.document.write(gerarHtmlCupom(props.venda))
    janela.document.close()
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível imprimir.'
  }
}
</script>

<template>
  <div class="fundo" @click.self="emit('fechar')">
    <div class="modal" role="dialog" aria-label="Cupom de venda">
      <div class="titulo">Cupom · venda #{{ venda.numero }}</div>
      <div v-if="!novidade && (venda.reimpressoes ?? 0) > 0" class="nota">
        Reimpressões registradas: {{ venda.reimpressoes }}
      </div>
      <pre class="cupom">{{ texto }}</pre>
      <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
      <div class="acoes">
        <button type="button" class="botao-secundario" @click="emit('fechar')">
          {{ novidade ? 'Nova venda' : 'Fechar' }}
        </button>
        <button type="button" class="botao-primario" @click="imprimir">Imprimir</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fundo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 60;
}

@media (min-width: 640px) {
  .fundo {
    align-items: center;
    padding: 24px;
  }
}

.modal {
  width: min(440px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  background: var(--cor-surface);
  border-radius: 20px 20px 0 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (min-width: 640px) {
  .modal {
    border-radius: 20px;
  }
}

.titulo {
  font-family: 'Bodoni Moda', serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--cor-on-surface);
}

.nota {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.cupom {
  font-family: ui-monospace, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  background: var(--cor-bg);
  border: 1px dashed var(--cor-outline);
  border-radius: 12px;
  padding: 16px;
  margin: 0;
  color: var(--cor-on-surface);
}

.erro {
  font-size: 13px;
  color: var(--cor-error);
}

.acoes {
  display: flex;
  gap: 8px;
}

.botao-primario {
  flex: 1;
  padding: 12px;
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
  padding: 12px 18px;
  border-radius: 100px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-surface);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
