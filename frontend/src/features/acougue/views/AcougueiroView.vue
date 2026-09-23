<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useDesossaStore } from '../../desossa-subprodutos/store/desossa.store'
import { useMaturacaoStore } from '../../maturacao/store/maturacao.store'
import { useMercadoStore } from '../../mercado/store/mercado.store'
import { useSegurancaBiologicaStore } from '../../seguranca-biologica/store/seguranca-biologica.store'

const mercado = useMercadoStore()
const desossa = useDesossaStore()
const maturacao = useMaturacaoStore()
const bio = useSegurancaBiologicaStore()

interface TarefaDoAcougue {
  id: string
  titulo: string
  detalhe: string
  destino: string
  concluida: boolean
}

const manuais = ref<TarefaDoAcougue[]>([])
const concluidasHoje = ref(2)
const ocultar = ref(new Set<string>())

const tarefasReais = computed<TarefaDoAcougue[]>(() => {
  const lista: TarefaDoAcougue[] = []
  const quarentena = mercado.produtos.flatMap((p) =>
    p.lotes.filter((l) => l.estado === 'QUARENTENA').map((l) => ({ p, l })),
  )
  for (const q of quarentena.slice(0, 3)) {
    lista.push({
      id: `q-${q.p.id}-${q.l.lote}`,
      titulo: 'Liberar quarentena',
      detalhe: `${q.p.nome} · lote ${q.l.lote}`,
      destino: 'estoque',
      concluida: false,
    })
  }
  for (const peca of desossa.pecasBrutasPendentes.slice(0, 3)) {
    lista.push({
      id: `d-${peca.id}`,
      titulo: 'Desossar peça',
      detalhe: `${peca.tipoDePeca} · ${peca.pesoKg} kg`,
      destino: 'desossa-subprodutos',
      concluida: false,
    })
  }
  for (const peca of maturacao.pecas.slice(0, 3)) {
    lista.push({
      id: `m-${peca.id}`,
      titulo: 'Conferir maturação',
      detalhe: `${peca.nome} · ${peca.diasAtual}/${peca.diasTotal} dias`,
      destino: 'maturacao',
      concluida: false,
    })
  }
  const criticos = bio.ccps.filter((c) => c.status !== 'conforme').slice(0, 2)
  for (const c of criticos) {
    lista.push({
      id: `b-${c.id}`,
      titulo: 'Verificar ponto sanitário',
      detalhe: c.nome,
      destino: 'seguranca-biologica',
      concluida: false,
    })
  }
  return lista
})

const todas = computed(() => [...manuais.value, ...tarefasReais.value])

function concluirTarefa(id: string): void {
  const manual = manuais.value.find((t) => t.id === id)
  if (manual) {
    manual.concluida = true
    concluidasHoje.value += 1
    return
  }
  // tarefa real: apenas oculta localmente após conferência
  manuais.value.push({ id: `ok-${id}`, titulo: '', detalhe: '', destino: '', concluida: true })
  concluidasHoje.value += 1
  ocultar.value.add(id)
}

const pendentes = () => todas.value.filter((t) => !t.concluida && !ocultar.value.has(t.id) && t.titulo)
</script>

<template>
  <div class="pagina">
    <div class="cabecalho">
      <div>
        <div class="titulo">Açougue — sua próxima tarefa</div>
        <div class="subtitulo">{{ concluidasHoje }} etapas concluídas hoje</div>
      </div>
    </div>

    <div v-if="pendentes().length === 0" class="vazio">Tudo em dia. Nenhuma tarefa de carne pendente.</div>

    <div v-for="tarefa in pendentes()" :key="tarefa.id" class="cartao-tarefa">
      <div class="tarefa-info">
        <div class="tarefa-titulo">{{ tarefa.titulo }}</div>
        <div class="tarefa-detalhe">{{ tarefa.detalhe }}</div>
      </div>
      <div class="tarefa-acoes">
        <button type="button" class="botao-primario" @click="concluirTarefa(tarefa.id)">
          Confirmar etapa
        </button>
        <RouterLink :to="{ name: tarefa.destino }" class="link">abrir área →</RouterLink>
      </div>
    </div>

    <div class="atalhos">
      <RouterLink :to="{ name: 'maturacao' }" class="atalho">Câmara de Maturação</RouterLink>
      <RouterLink :to="{ name: 'desossa-subprodutos' }" class="atalho">Desossa & Subprodutos</RouterLink>
      <RouterLink :to="{ name: 'seguranca-biologica' }" class="atalho">Segurança Biológica</RouterLink>
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

.cabecalho .titulo {
  font-family: var(--fonte-display);
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.subtitulo {
  font-size: 13.5px;
  color: var(--cor-on-surface-variant);
}

.vazio {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 20px;
  font-size: 14px;
  color: var(--cor-on-surface);
}

.cartao-tarefa {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.tarefa-titulo {
  font-size: 15px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.tarefa-detalhe {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
  margin-top: 4px;
}

.tarefa-acoes {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
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

.link {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--cor-primary);
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
