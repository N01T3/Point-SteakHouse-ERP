<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { useAuthStore } from '../../auth/store/auth.store'
import { useMercadoStore } from '../store/mercado.store'
import type { MotivoPerdaMercado } from '../tipos'

type SubAba = 'produtos' | 'recebimento' | 'estoque' | 'promocoes' | 'perdas' | 'fiscal'

const store = useMercadoStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const subAba = ref<SubAba>('produtos')
const erro = ref('')
const sucesso = ref('')

const podeAlterarPreco = computed(() => auth.temPermissao('mercado.alterar_preco'))

// produtos
const precoEdicao = ref<Record<string, number>>({})

// recebimento
const recProdutoId = ref('')
const recFornecedor = ref('')
const recQtd = ref<number | null>(null)
const recCusto = ref<number | null>(null)
const recLote = ref('')
const recValidade = ref('')
const recTemp = ref<number | null>(null)
const recDivergencia = ref('')
const recPedidoId = ref('')

// perda
const perdaProdutoId = ref('')
const perdaQtd = ref<number | null>(null)
const perdaMotivo = ref<MotivoPerdaMercado>('validade')

// promoção
const promoDesc = ref('')
const promoPerc = ref<number | null>(null)

const ROTULO_MOTIVO: Record<MotivoPerdaMercado, string> = {
  validade: 'Validade',
  deterioracao: 'Deterioração',
  quebra_frio: 'Quebra de cadeia fria',
  desossa: 'Desossa',
  maturacao: 'Maturação',
  dano: 'Dano/avaria',
  outros: 'Outros',
}

function salvarPreco(produtoId: string): void {
  erro.value = ''
  sucesso.value = ''
  try {
    const valor = precoEdicao.value[produtoId]
    if (valor === undefined) return
    store.ajustarPreco(produtoId, valor, auth.usuario?.nome ?? 'admin')
    sucesso.value = 'Preço atualizado com auditoria do operador.'
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível atualizar.'
  }
}

function confirmarRecebimento(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (!recProdutoId.value || recQtd.value === null || !recLote.value || !recValidade.value) {
      erro.value = 'Informe produto, quantidade, lote e validade.'
      return
    }
    const rec = store.registrarRecebimento({
      fornecedor: recFornecedor.value,
      produtoId: recProdutoId.value,
      quantidade: recQtd.value,
      custoUnitario: recCusto.value ?? 0,
      lote: recLote.value,
      validade: recValidade.value,
      temperatura: recTemp.value ?? undefined,
      divergencia: recDivergencia.value,
      pedidoId: recPedidoId.value || undefined,
      operador: auth.usuario?.nome ?? 'admin',
    })
    sucesso.value = rec.divergencia
      ? `Recebido com divergência — lote ${rec.lote} em quarentena.`
      : `Recebimento confirmado — lote ${rec.lote} liberado.`
    recQtd.value = null
    recLote.value = ''
    recDivergencia.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível receber.'
  }
}

function confirmarPerda(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (!perdaProdutoId.value || perdaQtd.value === null) {
      erro.value = 'Informe produto e quantidade.'
      return
    }
    const perda = store.registrarPerda(perdaProdutoId.value, perdaQtd.value, perdaMotivo.value, auth.usuario?.nome ?? 'admin')
    sucesso.value = `Perda de ${formatarMoeda(perda.valor)} registrada (baixa no lote ${perda.lote}). Alimenta o Financeiro.`
    perdaQtd.value = null
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível registrar.'
  }
}

function criarPromocao(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (!promoDesc.value.trim() || promoPerc.value === null) {
      erro.value = 'Informe descrição e percentual.'
      return
    }
    store.criarPromocao({ descricao: promoDesc.value.trim(), tipo: 'quantidade', percentual: promoPerc.value, ativa: true })
    sucesso.value = 'Promoção criada e ativa no caixa.'
    promoDesc.value = ''
    promoPerc.value = null
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível criar.'
  }
}
</script>

<template>
  <div class="admin">
    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
    <div v-if="sucesso" class="sucesso" role="status">{{ sucesso }}</div>

    <div class="subabas">
      <button type="button" :class="{ ativa: subAba === 'produtos' }" @click="subAba = 'produtos'">Produtos e preços</button>
      <button type="button" :class="{ ativa: subAba === 'recebimento' }" @click="subAba = 'recebimento'">Recebimento</button>
      <button type="button" :class="{ ativa: subAba === 'estoque' }" @click="subAba = 'estoque'">Estoque e lotes</button>
      <button type="button" :class="{ ativa: subAba === 'promocoes' }" @click="subAba = 'promocoes'">Promoções</button>
      <button type="button" :class="{ ativa: subAba === 'perdas' }" @click="subAba = 'perdas'">Perdas{{ store.perdas.length ? ` (${store.perdas.length})` : '' }}</button>
      <button type="button" :class="{ ativa: subAba === 'fiscal' }" @click="subAba = 'fiscal'">Fiscal e auditoria</button>
    </div>

    <!-- PRODUTOS -->
    <div v-if="subAba === 'produtos'" class="cartao">
      <div class="secao-titulo">Produtos e preços — custo visível só aqui, nunca no caixa</div>
      <div v-for="p in store.produtos" :key="p.id" class="linha-prod">
        <div class="prod-info">
          <strong>{{ p.nome }}</strong>
          <span>{{ p.categoria }} · {{ p.fornecedor }} · custo {{ formatarMoeda(p.custoMedio) }} · {{ p.ativo ? 'ativo' : 'inativo' }}</span>
        </div>
        <div class="prod-preco">
          <input v-model.number="precoEdicao[p.id]" type="number" min="0" step="0.01" :placeholder="String(p.preco)" :disabled="!podeAlterarPreco" />
          <button type="button" class="botao-secundario" :disabled="!podeAlterarPreco" @click="salvarPreco(p.id)">Salvar</button>
        </div>
      </div>
      <div v-if="!podeAlterarPreco" class="nota">Alteração de preço exige mercado.alterar_preco.</div>
    </div>

    <!-- RECEBIMENTO -->
    <div v-if="subAba === 'recebimento'" class="cartao">
      <div class="secao-titulo">Recebimento — conferência com quarentena automática em divergência</div>
      <div class="grade">
        <label class="campo">Produto
          <select v-model="recProdutoId">
            <option value="" disabled>Selecionar…</option>
            <option v-for="p in store.produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </label>
        <label class="campo">Fornecedor<input v-model="recFornecedor" type="text" placeholder="Frigorífico…" /></label>
        <label class="campo">Qtd<input v-model.number="recQtd" type="number" min="0" step="0.001" /></label>
        <label class="campo">Custo unit. (R$)<input v-model.number="recCusto" type="number" min="0" step="0.01" /></label>
        <label class="campo">Lote<input v-model="recLote" type="text" placeholder="L…" /></label>
        <label class="campo">Validade<input v-model="recValidade" type="date" /></label>
        <label class="campo">Temp. recebimento (°C)<input v-model.number="recTemp" type="number" step="0.5" /></label>
        <label class="campo">Divergência/avaria<input v-model="recDivergencia" type="text" placeholder="vazio = liberado" /></label>
        <label class="campo">Pedido
          <select v-model="recPedidoId">
            <option value="">Avulso</option>
            <option v-for="ped in store.pedidos.filter((p) => p.status === 'aberto' || p.status === 'recebido-parcial')" :key="ped.id" :value="ped.id">#{{ ped.numero }} · {{ ped.fornecedor }}</option>
          </select>
        </label>
      </div>
      <button type="button" class="botao-primario" @click="confirmarRecebimento">Confirmar recebimento</button>
      <div v-for="r in store.recebimentos" :key="r.id" class="linha-simples">
        <span>{{ r.produto }} · lote {{ r.lote }} · {{ r.quantidade }} · {{ r.fornecedor }}{{ r.divergencia ? ` · quarentena: ${r.divergencia}` : '' }}</span>
      </div>
      <div v-if="store.recebimentos.length === 0" class="nota">Nenhum recebimento neste turno.</div>
    </div>

    <!-- ESTOQUE -->
    <div v-if="subAba === 'estoque'" class="cartao">
      <div class="secao-titulo">Estoque e lotes — livro de movimentos (FEFO na venda)</div>
      <div class="nota">Lote em <strong>quarentena</strong> ou <strong>bloqueado</strong> não vende até liberação. Validade crítica aparece em vermelho.</div>
      <div v-for="p in store.produtos" :key="p.id" class="bloco-lote">
        <div class="bloco-lote-topo">
          <strong>{{ p.nome }}</strong>
          <span class="bloco-lote-meta">{{ p.grupo ?? p.categoria }}{{ p.subgrupo ? ` · ${p.subgrupo}` : '' }}</span>
        </div>
        <div v-if="p.lotes.length === 0" class="nota">Sem lotes.</div>
        <div v-for="l in p.lotes" :key="`${l.lote}-${l.local ?? ''}`" class="linha-simples lote">
          <span class="lote-codigo">{{ l.lote }}</span>
          <span class="lote-detalhe">{{ l.quantidade }} · val. {{ l.validade }} · {{ l.local ?? 'Loja' }}</span>
          <strong class="badge-mini" :class="l.estado.toLowerCase()">{{ l.estado.toLowerCase() }}</strong>
        </div>
      </div>
      <div class="secao-titulo espacar">Reposição sugerida</div>
      <div v-if="store.reposicoes.length === 0" class="nota">Estoque dentro do mínimo.</div>
      <div v-for="rep in store.reposicoes" :key="rep.produtoId" class="linha-simples">
        <span>{{ rep.produto }} · atual {{ rep.atual }}{{ rep.unidade }}</span>
        <strong>pedir {{ rep.sugestao }}{{ rep.unidade }}</strong>
      </div>
    </div>

    <!-- PROMOÇÕES -->
    <div v-if="subAba === 'promocoes'" class="cartao">
      <div class="secao-titulo">Promoções e markdown</div>
      <div v-for="promo in store.promocoes" :key="promo.id" class="linha-simples">
        <span>{{ promo.descricao }} · {{ promo.percentual }}% · {{ promo.ativa ? 'ativa' : 'pausada' }}</span>
        <button type="button" class="link" @click="store.alternarPromocao(promo.id)">
          {{ promo.ativa ? 'pausar' : 'ativar' }}
        </button>
      </div>
      <div class="grade">
        <label class="campo">Nova promoção<input v-model="promoDesc" type="text" placeholder="ex.: Fraldinha fds 10%" /></label>
        <label class="campo">% off<input v-model.number="promoPerc" type="number" min="0" max="100" /></label>
      </div>
      <button type="button" class="botao-primario" @click="criarPromocao">Criar promoção</button>
    </div>

    <!-- PERDAS -->
    <div v-if="subAba === 'perdas'" class="cartao">
      <div class="secao-titulo">Perdas — baixa no estoque + valor para o Financeiro</div>
      <div class="grade">
        <label class="campo">Produto
          <select v-model="perdaProdutoId">
            <option value="" disabled>Selecionar…</option>
            <option v-for="p in store.produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </label>
        <label class="campo">Qtd<input v-model.number="perdaQtd" type="number" min="0" step="0.001" /></label>
        <label class="campo">Motivo
          <select v-model="perdaMotivo">
            <option v-for="(rotulo, valor) in ROTULO_MOTIVO" :key="valor" :value="valor">{{ rotulo }}</option>
          </select>
        </label>
      </div>
      <button type="button" class="botao-primario" @click="confirmarPerda">Registrar perda</button>
      <div v-for="perda in store.perdas" :key="perda.id" class="linha-simples">
        <span>{{ perda.produto }} · lote {{ perda.lote }} · {{ perda.quantidade }} · {{ ROTULO_MOTIVO[perda.motivo] }}</span>
        <strong>{{ formatarMoeda(perda.valor) }}</strong>
      </div>
    </div>

    <!-- FISCAL -->
    <div v-if="subAba === 'fiscal'" class="cartao">
      <div class="secao-titulo">Fiscal — central simulada (NFC-e 65 / NF-e 55 por UF)</div>
      <div v-if="store.vendas.length === 0" class="nota">Sem documentos neste turno.</div>
      <div v-for="v in store.vendas" :key="v.id" class="linha-simples">
        <span>venda #{{ v.numero }} · {{ formatarMoeda(v.total) }} · {{ v.pagamento.forma }}</span>
        <strong>{{ v.sincronizada ? (store.online ? 'autorizado' : 'contingência') : 'pendente de transmissão' }}</strong>
      </div>
      <div class="secao-titulo espacar">Livro de movimentos ({{ store.livro.length }})</div>
      <div v-if="store.livro.length === 0" class="nota">Nenhum lançamento ainda — vendas, recebimentos e perdas aparecem aqui.</div>
      <div v-for="m in store.livro.slice(0, 20)" :key="m.id" class="linha-simples">
        <span>{{ m.tipo }} · {{ m.produto }} · lote {{ m.lote }} · {{ m.motivo }}</span>
        <strong>{{ m.quantidade }}</strong>
      </div>
      <div class="secao-titulo espacar">Auditoria do turno</div>
      <div class="nota">Movimentos: {{ store.movimentos.length }} · Devoluções: {{ store.devolucoes.length }} · Perdas: {{ store.perdas.length }} · Recebimentos: {{ store.recebimentos.length }}</div>
      <div v-for="mov in store.movimentos" :key="mov.id" class="linha-simples"><span>{{ mov.tipo }} · {{ mov.motivo }}</span><strong>{{ formatarMoeda(mov.valor) }}</strong></div>
      <div v-for="ev in store.eventos.slice(0, 20)" :key="ev.id" class="linha-simples"><span>{{ ev.tipo }} · {{ ev.descricao }} · {{ ev.operador }}{{ ev.online ? '' : ' · offline' }}</span></div>
    </div>
  </div>
</template>

<style scoped>
.admin { display: flex; flex-direction: column; gap: 14px; }
.erro, .sucesso { font-size: 13px; border-radius: 10px; padding: 10px 14px; }
.erro { color: var(--cor-error); background: var(--cor-error-container); }
.sucesso { color: var(--cor-success); background: var(--cor-surface-variant); }
.subabas { display: flex; gap: 8px; flex-wrap: wrap; }
.subabas button { padding: 9px 16px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface-variant); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.subabas button.ativa { background: var(--cor-primary-container); color: var(--cor-on-primary-container); border-color: transparent; }
.cartao { background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.secao-titulo { font-size: 14px; font-weight: 700; color: var(--cor-on-surface); }
.secao-titulo.espacar { margin-top: 8px; }
.linha-prod { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--cor-outline); flex-wrap: wrap; }
.prod-info { display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--cor-on-surface); }
.prod-info span { font-size: 12px; color: var(--cor-on-surface-variant); }
.prod-preco { display: flex; gap: 8px; align-items: center; }
.prod-preco input { width: 100px; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 13px; }
.grade { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.campo { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--cor-on-surface-variant); }
.campo input, .campo select { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 13px; }
.linha-simples { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--cor-on-surface); padding: 8px 0; border-top: 1px solid var(--cor-outline); }
.bloco-lote { display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--cor-on-surface); border-top: 1px solid var(--cor-outline); padding-top: 10px; }
.bloco-lote-topo { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; flex-wrap: wrap; }
.bloco-lote-meta { font-size: 11.5px; color: var(--cor-on-surface-variant); }
.linha-simples.lote { gap: 8px; }
.lote-codigo { font-family: ui-monospace, monospace; font-size: 12px; background: var(--cor-surface-variant); padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }
.lote-detalhe { flex: 1; min-width: 0; }
.badge-mini { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 8px; border-radius: 100px; background: var(--cor-surface-variant); }
.badge-mini.liberado { color: var(--cor-success); }
.badge-mini.quarentena { color: var(--cor-secondary); }
.badge-mini.bloqueado { color: var(--cor-error); background: var(--cor-error-container); }
.nota { font-size: 12.5px; color: var(--cor-on-surface-variant); }
.link { background: none; border: none; padding: 0; font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--cor-primary); cursor: pointer; }
.botao-primario { align-self: flex-start; padding: 11px 20px; border: none; border-radius: 100px; background: var(--cor-primary); color: var(--cor-on-primary); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.botao-secundario { padding: 9px 16px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.botao-secundario:disabled { opacity: 0.5; cursor: default; }
</style>
