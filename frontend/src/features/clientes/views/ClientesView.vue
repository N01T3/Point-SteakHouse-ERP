<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatador } from '../../../shared/composables/useFormatador'
import { contaBloqueada, fiadoDisponivel } from '../logica/clientes'
import { useClientesStore } from '../store/clientes.store'
import type { Cliente } from '../tipos'
import { useAuthStore } from '../../auth/store/auth.store'

type Aba = 'clientes' | 'cobranca'

const store = useClientesStore()
const auth = useAuthStore()
const { formatarMoeda } = useFormatador()

const aba = ref<Aba>('clientes')
const busca = ref('')
const detalhe = ref<Cliente | null>(null)
const mostrandoCadastro = ref(false)
const erro = ref('')
const sucesso = ref('')

const podeGerenciar = computed(
  () => auth.temPermissao('clientes.quitar_fiado') || auth.temPermissao('usuarios.gerenciar'),
)
const podeQuitar = computed(() => auth.temPermissao('clientes.quitar_fiado'))

// --- cadastro ---
const fNome = ref('')
const fTelefone = ref('')
const fEndereco = ref('')
const fAniversario = ref('')
const fLimite = ref<number | null>(null)

// --- quitação ---
const qClienteId = ref('')
const qValor = ref<number | null>(null)
const qObs = ref('')

const lista = computed(() => store.buscar(busca.value))

const clienteQuitar = computed(() => store.clientes.find((c) => c.id === qClienteId.value) ?? null)

function percentualUso(cliente: Cliente): number {
  if (cliente.limite <= 0) return 0
  return Math.min(100, Math.round((cliente.saldo / cliente.limite) * 100))
}

function ehAniversario(cliente: Cliente): boolean {
  if (!cliente.aniversario) return false
  const hoje = new Date()
  const [_, mes, dia] = cliente.aniversario.split('-').map(Number)
  return mes === hoje.getMonth() + 1 && dia === hoje.getDate()
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function cadastrar(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (fLimite.value === null) {
      erro.value = 'Informe o limite de crédito.'
      return
    }
    const cliente = store.cadastrarCliente(
      { nome: fNome.value, telefone: fTelefone.value, endereco: fEndereco.value, aniversario: fAniversario.value || undefined, limite: fLimite.value },
      auth.usuario?.nome ?? 'admin',
    )
    sucesso.value = `${cliente.nome} cadastrado com limite de ${formatarMoeda(cliente.limite)}.`
    fNome.value = ''
    fTelefone.value = ''
    fEndereco.value = ''
    fAniversario.value = ''
    fLimite.value = null
    mostrandoCadastro.value = false
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível cadastrar.'
  }
}

function quitarTotal(): void {
  if (clienteQuitar.value) qValor.value = clienteQuitar.value.saldo
}

function confirmarQuitacao(): void {
  erro.value = ''
  sucesso.value = ''
  try {
    if (!qClienteId.value || qValor.value === null) {
      erro.value = 'Selecione o cliente e o valor.'
      return
    }
    const lanc = store.quitar(qClienteId.value, qValor.value, auth.usuario?.nome ?? 'admin', qObs.value)
    sucesso.value = `Recebido ${formatarMoeda(lanc.valor)} de ${clienteQuitar.value?.nome}.`
    qValor.value = null
    qObs.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível quitar.'
  }
}

function rotuloLancamento(tipo: string, vendaNumero?: number): string {
  if (tipo === 'venda') return `Venda${vendaNumero ? ` #${vendaNumero}` : ''}`
  if (tipo === 'pagamento') return 'Pagamento'
  return 'Ajuste'
}

const prefCortes = ref('')
const prefObs = ref('')
const resDesc = ref('')
const resQtd = ref('')

function salvarPrefs(): void {
  erro.value = ''
  try {
    if (!detalhe.value) return
    store.salvarPreferencias(detalhe.value.id, prefCortes.value.split(','), prefObs.value)
    detalhe.value = store.clientes.find((c) => c.id === detalhe.value?.id) ?? null
    prefCortes.value = ''
    prefObs.value = ''
    sucesso.value = 'Preferências salvas.'
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível salvar.'
  }
}

function criarRes(): void {
  erro.value = ''
  try {
    if (!detalhe.value) return
    store.criarReserva(detalhe.value.id, resDesc.value, resQtd.value, undefined, auth.usuario?.nome ?? 'admin')
    resDesc.value = ''
    resQtd.value = ''
    sucesso.value = 'Reserva registrada.'
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível reservar.'
  }
}
</script>

<template>
  <div class="pagina">
    <div class="cabecalho">
      <div>
        <div class="titulo">Clientes e Fiado</div>
        <div class="subtitulo">{{ store.resumo.devedores }} com saldo em aberto · {{ formatarMoeda(store.resumo.totalAberto) }}</div>
      </div>
      <div class="abas">
        <button type="button" :class="{ ativa: aba === 'clientes' }" @click="aba = 'clientes'">Clientes</button>
        <button type="button" :class="{ ativa: aba === 'cobranca' }" @click="aba = 'cobranca'">Cobrança</button>
      </div>
    </div>

    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
    <div v-if="sucesso" class="sucesso" role="status">{{ sucesso }}</div>

    <!-- CLIENTES -->
    <template v-if="aba === 'clientes'">
      <div class="barra">
        <input v-model="busca" type="text" placeholder="Buscar por nome ou telefone…" class="input-busca" />
        <button v-if="podeGerenciar" type="button" class="botao-primario" @click="mostrandoCadastro = !mostrandoCadastro">
          {{ mostrandoCadastro ? 'Fechar' : '+ Novo cliente' }}
        </button>
      </div>

      <div v-if="mostrandoCadastro && podeGerenciar" class="cartao">
        <div class="secao-titulo">Cadastrar cliente</div>
        <div class="grade">
          <label class="campo">Nome*<input v-model="fNome" type="text" /></label>
          <label class="campo">Telefone<input v-model="fTelefone" type="tel" placeholder="(44) 99999-9999" /></label>
          <label class="campo">Endereço<input v-model="fEndereco" type="text" /></label>
          <label class="campo">Aniversário<input v-model="fAniversario" type="date" /></label>
          <label class="campo">Limite (R$)*<input v-model.number="fLimite" type="number" min="0" step="0.01" /></label>
        </div>
        <button type="button" class="botao-primario" @click="cadastrar">Cadastrar</button>
      </div>

      <div class="lista">
        <button v-for="c in lista" :key="c.id" type="button" class="item" @click="detalhe = c">
          <div class="item-topo">
            <strong>{{ c.nome }}</strong>
            <span v-if="contaBloqueada(c)" class="badge bloqueado">bloqueado</span>
            <span v-else-if="c.saldo > 0" class="badge devendo">em aberto</span>
            <span v-else class="badge ok">em dia</span>
          </div>
          <div class="item-meta">{{ c.telefone ?? 'sem telefone' }}{{ ehAniversario(c) ? ' · 🎂 hoje!' : '' }}</div>
          <div class="item-barra"><span :style="{ width: `${percentualUso(c)}%` }"></span></div>
          <div class="item-base">
            <span>deve {{ formatarMoeda(c.saldo) }} de {{ formatarMoeda(c.limite) }}</span>
          </div>
        </button>
        <div v-if="lista.length === 0" class="nota">Nenhum cliente encontrado.</div>
      </div>
    </template>

    <!-- COBRANÇA -->
    <template v-if="aba === 'cobranca'">
      <div class="cartoes">
        <div class="cartao-mini"><span>Total em aberto</span><strong>{{ formatarMoeda(store.resumo.totalAberto) }}</strong></div>
        <div class="cartao-mini"><span>Devedores</span><strong>{{ store.resumo.devedores }}</strong></div>
        <div class="cartao-mini"><span>Bloqueados</span><strong>{{ store.resumo.bloqueados }}</strong></div>
      </div>

      <div v-if="podeQuitar" class="cartao">
        <div class="secao-titulo">Registrar recebimento (quitação parcial ou total)</div>
        <div class="grade">
          <label class="campo">Cliente
            <select v-model="qClienteId">
              <option value="" disabled>Selecionar…</option>
              <option v-for="c in store.devedores" :key="c.id" :value="c.id">
                {{ c.nome }} — deve {{ formatarMoeda(c.saldo) }}
              </option>
            </select>
          </label>
          <label class="campo">Valor (R$)
            <span class="campo-valor">
              <input v-model.number="qValor" type="number" min="0" step="0.01" />
              <button type="button" class="botao-secundario" :disabled="!clienteQuitar" @click="quitarTotal">Total</button>
            </span>
          </label>
          <label class="campo">Observação<input v-model="qObs" type="text" placeholder="dinheiro, PIX…" /></label>
        </div>
        <div v-if="clienteQuitar" class="nota">Disponível após pagar: {{ formatarMoeda(clienteQuitar.limite) }} · em aberto: {{ formatarMoeda(clienteQuitar.saldo) }}</div>
        <button type="button" class="botao-primario" @click="confirmarQuitacao">Confirmar recebimento</button>
      </div>
      <div v-else class="nota">Recebimentos exigem a permissão clientes.quitar_fiado.</div>

      <div class="cartao">
        <div class="secao-titulo">Quem deve — ordem de cobrança</div>
        <div v-if="store.devedores.length === 0" class="nota">Ninguém devendo. 🎉</div>
        <button
          v-for="c in store.devedores"
          :key="c.id"
          type="button"
          class="linha-devedor"
          @click="detalhe = c; qClienteId = c.id; qValor = c.saldo"
        >
          <span>{{ c.nome }} · {{ c.telefone ?? '—' }}{{ contaBloqueada(c) ? ' · bloqueado' : '' }}</span>
          <strong>{{ formatarMoeda(c.saldo) }}</strong>
        </button>
      </div>
    </template>

    <!-- DETALHE / EXTRATO -->
    <div v-if="detalhe" class="fundo" @click.self="detalhe = null">
      <div class="modal" role="dialog" aria-label="Conta do cliente">
        <div class="modal-titulo">{{ detalhe.nome }}</div>
        <div class="modal-sub">{{ detalhe.telefone ?? '—' }}{{ detalhe.endereco ? ` · ${detalhe.endereco}` : '' }}</div>

        <div class="bloco">
          <div class="linha"><span>Saldo em aberto</span><strong>{{ formatarMoeda(detalhe.saldo) }}</strong></div>
          <div class="linha"><span>Limite</span><strong>{{ formatarMoeda(detalhe.limite) }}</strong></div>
          <div class="linha"><span>Disponível</span><strong>{{ formatarMoeda(fiadoDisponivel(detalhe)) }}</strong></div>
          <div class="linha"><span>Status</span><strong>{{ contaBloqueada(detalhe) ? 'bloqueado' : 'liberado' }}</strong></div>
        </div>

        <div v-if="podeGerenciar" class="acoes-detalhe">
          <button type="button" class="botao-secundario" @click="store.alternarAtivo(detalhe.id); detalhe = store.clientes.find((c) => c.id === detalhe?.id) ?? null">
            {{ detalhe.ativo ? 'Suspender' : 'Reativar' }}
          </button>
          <button type="button" class="botao-secundario" @click="aba = 'cobranca'; qClienteId = detalhe.id; qValor = detalhe.saldo; detalhe = null">
            Quitar →
          </button>
        </div>

        <div class="secao-titulo">Extrato</div>
        <div v-if="store.extratoDoCliente(detalhe.id).length === 0" class="nota">Sem lançamentos.</div>
        <div v-for="l in store.extratoDoCliente(detalhe.id)" :key="l.id" class="linha">
          <span>{{ rotuloLancamento(l.tipo, l.vendaNumero) }} · {{ formatarData(l.criadoEm) }}{{ l.observacao ? ` · ${l.observacao}` : '' }}</span>
          <strong :class="l.tipo">{{ l.tipo === 'pagamento' ? '−' : '+' }}{{ formatarMoeda(l.valor) }}</strong>
        </div>

        <div class="secao-titulo">Preferências premium</div>
        <div class="nota">{{ detalhe.cortesPreferidos?.length ? detalhe.cortesPreferidos.join(' · ') : 'Sem cortes preferidos registrados.' }}{{ detalhe.observacoes ? ` — ${detalhe.observacoes}` : '' }}</div>
        <div v-if="podeGerenciar" class="grade">
          <label class="campo">Cortes preferidos (vírgula)<input v-model="prefCortes" type="text" placeholder="ex.: picanha, ancho" /></label>
          <label class="campo">Observações<input v-model="prefObs" type="text" placeholder="ex.: prefere dry aged" /></label>
        </div>
        <button v-if="podeGerenciar" type="button" class="botao-secundario" @click="salvarPrefs">Salvar preferências</button>

        <div class="secao-titulo">Reservas e encomendas ({{ store.reservas.filter((r) => r.clienteId === (detalhe?.id ?? '')).length }})</div>
        <div v-for="r in store.reservas.filter((x) => x.clienteId === (detalhe?.id ?? ''))" :key="r.id" class="linha">
          <span>{{ r.descricao }} · {{ r.quantidade }} · {{ r.status }}</span>
        </div>
        <div v-if="podeGerenciar" class="grade">
          <label class="campo">Nova reserva<input v-model="resDesc" type="text" placeholder="ex.: Picanha maturada 2kg" /></label>
          <label class="campo">Qtd<input v-model="resQtd" type="text" placeholder="ex.: 2 kg" /></label>
        </div>
        <button v-if="podeGerenciar" type="button" class="botao-secundario" @click="criarRes">Reservar</button>

        <button type="button" class="botao-secundario" @click="detalhe = null">Fechar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pagina { padding: 36px 44px 60px; display: flex; flex-direction: column; gap: 18px; }
@media (max-width: 640px) { .pagina { padding: 24px 16px 90px; } }
.cabecalho { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.titulo { font-family: 'Bodoni Moda', serif; font-size: 30px; font-weight: 600; color: var(--cor-on-bg); }
.subtitulo { font-size: 13px; color: var(--cor-on-surface-variant); }
.abas { display: flex; gap: 8px; }
.abas button { padding: 10px 18px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface-variant); font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.abas button.ativa { background: var(--cor-primary-container); color: var(--cor-on-primary-container); border-color: transparent; }
.erro, .sucesso { font-size: 13px; border-radius: 10px; padding: 10px 14px; }
.erro { color: var(--cor-error); background: var(--cor-error-container); }
.sucesso { color: var(--cor-success); background: var(--cor-surface-variant); }
.barra { display: flex; gap: 8px; flex-wrap: wrap; }
.input-busca { flex: 1; min-width: 200px; padding: 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface); font-family: inherit; font-size: 14px; }
.nota { font-size: 12.5px; color: var(--cor-on-surface-variant); }
.cartao { background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.secao-titulo { font-size: 14px; font-weight: 700; color: var(--cor-on-surface); }
.grade { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.campo { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--cor-on-surface-variant); }
.campo input, .campo select { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 13px; }
.campo-valor { display: flex; gap: 6px; }
.campo-valor input { flex: 1; min-width: 0; }
.botao-primario { align-self: flex-start; padding: 11px 20px; border: none; border-radius: 100px; background: var(--cor-primary); color: var(--cor-on-primary); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.botao-secundario { padding: 9px 16px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.cartoes { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.cartao-mini { background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.cartao-mini span { font-size: 12px; color: var(--cor-on-surface-variant); }
.cartao-mini strong { font-family: 'Bodoni Moda', serif; font-size: 20px; color: var(--cor-on-surface); }
.lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.item { text-align: left; background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; cursor: pointer; font-family: inherit; color: var(--cor-on-surface); }
.item-topo { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.badge { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 100px; }
.badge.bloqueado { color: var(--cor-error); background: var(--cor-error-container); }
.badge.devendo { color: var(--cor-on-primary-container); background: var(--cor-primary-container); }
.badge.ok { color: var(--cor-success); background: var(--cor-surface-variant); }
.item-meta { font-size: 12px; color: var(--cor-on-surface-variant); }
.item-barra { height: 6px; border-radius: 100px; background: var(--cor-surface-variant); overflow: hidden; }
.item-barra span { display: block; height: 100%; background: var(--cor-primary); }
.item-base { font-size: 12.5px; color: var(--cor-on-surface-variant); }
.linha-devedor { display: flex; justify-content: space-between; gap: 12px; width: 100%; text-align: left; font-size: 13px; color: var(--cor-on-surface); background: none; border: none; border-top: 1px solid var(--cor-outline); padding: 10px 0; font-family: inherit; cursor: pointer; }
.fundo { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
@media (min-width: 640px) { .fundo { align-items: center; padding: 24px; } }
.modal { width: min(480px, 100%); max-height: 92vh; overflow-y: auto; background: var(--cor-surface); border-radius: 20px 20px 0 0; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
@media (min-width: 640px) { .modal { border-radius: 20px; } }
.modal-titulo { font-family: 'Bodoni Moda', serif; font-size: 22px; font-weight: 600; color: var(--cor-on-surface); }
.modal-sub { font-size: 13px; color: var(--cor-on-surface-variant); }
.bloco { display: flex; flex-direction: column; }
.linha { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--cor-on-surface); padding: 8px 0; border-top: 1px solid var(--cor-outline); }
.linha strong.pagamento { color: var(--cor-success); }
.acoes-detalhe { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
