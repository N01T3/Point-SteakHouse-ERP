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
    const perda = store.registrarPerda(
      perdaProdutoId.value,
      perdaQtd.value,
      perdaMotivo.value,
      auth.usuario?.nome ?? 'admin',
    )
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
    store.criarPromocao({
      descricao: promoDesc.value.trim(),
      tipo: 'quantidade',
      percentual: promoPerc.value,
      ativa: true,
    })
    sucesso.value = 'Promoção criada e ativa no caixa.'
    promoDesc.value = ''
    promoPerc.value = null
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível criar.'
  }
}
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-alert v-if="erro" type="error" variant="tonal" density="compact">{{ erro }}</v-alert>
    <v-alert v-if="sucesso" type="success" variant="tonal" density="compact">{{ sucesso }}</v-alert>
    <v-tabs v-model="subAba" color="primary" show-arrows>
      <v-tab value="produtos">Produtos e precos</v-tab>
      <v-tab value="recebimento">Recebimento</v-tab>
      <v-tab value="estoque">Estoque e lotes</v-tab>
      <v-tab value="promocoes">Promocoes</v-tab>
      <v-tab value="perdas">Perdas{{ store.perdas.length ? ` (${store.perdas.length})` : '' }}</v-tab>
      <v-tab value="fiscal">Fiscal e auditoria</v-tab>
    </v-tabs>
    <v-window v-model="subAba">
      <v-window-item value="produtos">
        <v-card rounded="xl">
          <v-card-title>Produtos e precos - custo visivel so aqui</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="p in store.produtos" :key="p.id">
                <v-list-item-title>{{ p.nome }}</v-list-item-title>
                <v-list-item-subtitle
                  >{{ p.categoria }} - custo {{ formatarMoeda(p.custoMedio) }}</v-list-item-subtitle
                >
                <template #append>
                  <div class="d-flex ga-2 align-center">
                    <v-text-field
                      v-model.number="precoEdicao[p.id]"
                      type="number"
                      :placeholder="String(p.preco)"
                      prefix="R$"
                      density="compact"
                      hide-details
                      style="max-width: 130px"
                      :disabled="!podeAlterarPreco"
                    />
                    <v-btn
                      size="small"
                      variant="tonal"
                      :disabled="!podeAlterarPreco"
                      @click="salvarPreco(p.id)"
                      >Salvar</v-btn
                    >
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-window-item>
      <v-window-item value="recebimento">
        <v-card rounded="xl">
          <v-card-title>Recebimento - conferencia com quarentena automatica</v-card-title>
          <v-card-text class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <v-select
              v-model="recProdutoId"
              label="Produto"
              :items="store.produtos.map((p) => ({ title: p.nome, value: p.id }))"
            />
            <v-text-field v-model="recFornecedor" label="Fornecedor" />
            <v-text-field v-model.number="recQtd" type="number" label="Qtd" />
            <v-text-field v-model.number="recCusto" type="number" label="Custo unit. (R$)" prefix="R$" />
            <v-text-field v-model="recLote" label="Lote" />
            <v-text-field v-model="recValidade" type="date" label="Validade" />
            <v-text-field
              v-model="recDivergencia"
              label="Divergencia/avaria"
              placeholder="vazio = liberado"
            />
          </v-card-text>
          <v-card-actions
            ><v-spacer /><v-btn color="primary" variant="flat" rounded="xl" @click="confirmarRecebimento"
              >Confirmar recebimento</v-btn
            ></v-card-actions
          >
        </v-card>
      </v-window-item>
      <v-window-item value="estoque">
        <v-card rounded="xl">
          <v-card-title>Estoque e lotes - FEFO na venda</v-card-title>
          <v-card-text>
            <div v-for="p in store.produtos" :key="p.id" class="mb-3">
              <div class="font-weight-bold">{{ p.nome }}</div>
              <v-chip
                v-for="l in p.lotes"
                :key="l.lote"
                class="ma-1"
                size="small"
                :color="l.estado === 'LIBERADO' ? 'success' : l.estado === 'QUARENTENA' ? 'warning' : 'error'"
                variant="tonal"
                >{{ l.lote }} - val. {{ l.validade }} - {{ l.quantidade }}</v-chip
              >
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>
      <v-window-item value="promocoes">
        <v-card rounded="xl">
          <v-card-title>Promocoes e markdown</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="promo in store.promocoes" :key="promo.id">
                <v-list-item-title>{{ promo.descricao }} - {{ promo.percentual }}%</v-list-item-title>
                <template #append
                  ><v-btn size="small" variant="text" @click="store.alternarPromocao(promo.id)">{{
                    promo.ativa ? 'pausar' : 'ativar'
                  }}</v-btn></template
                >
              </v-list-item>
            </v-list>
            <div class="d-flex ga-2 mt-3">
              <v-text-field v-model="promoDesc" label="Nova promocao" hide-details />
              <v-text-field
                v-model.number="promoPerc"
                type="number"
                label="% off"
                hide-details
                style="max-width: 120px"
              />
              <v-btn color="primary" variant="flat" rounded="xl" @click="criarPromocao">Criar</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>
      <v-window-item value="perdas">
        <v-card rounded="xl">
          <v-card-title>Perdas</v-card-title>
          <v-card-text class="d-flex flex-wrap ga-2">
            <v-select
              v-model="perdaProdutoId"
              label="Produto"
              :items="store.produtos.map((p) => ({ title: p.nome, value: p.id }))"
              style="min-width: 200px"
            />
            <v-text-field v-model.number="perdaQtd" type="number" label="Qtd" style="max-width: 120px" />
            <v-select
              v-model="perdaMotivo"
              label="Motivo"
              :items="Object.entries(ROTULO_MOTIVO).map(([value, title]) => ({ title, value }))"
              style="min-width: 180px"
            />
            <v-btn color="primary" variant="flat" rounded="xl" @click="confirmarPerda">Registrar perda</v-btn>
          </v-card-text>
          <v-card-text>
            <v-list density="compact">
              <v-list-item v-for="perda in store.perdas" :key="perda.id"
                ><v-list-item-title
                  >{{ perda.produto }} - lote {{ perda.lote }} - {{ perda.quantidade }}</v-list-item-title
                ><template #append
                  ><strong>{{ formatarMoeda(perda.valor) }}</strong></template
                ></v-list-item
              >
            </v-list>
          </v-card-text>
        </v-card>
      </v-window-item>
      <v-window-item value="fiscal">
        <v-card rounded="xl">
          <v-card-title>Fiscal - central simulada</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item v-for="v in store.vendas" :key="v.id"
                ><v-list-item-title>venda #{{ v.numero }} - {{ formatarMoeda(v.total) }}</v-list-item-title
                ><template #append
                  ><v-chip size="small" variant="tonal">{{
                    v.sincronizada ? 'autorizado' : 'pendente'
                  }}</v-chip></template
                ></v-list-item
              >
            </v-list>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>
