<script setup lang="ts">
import { computed, ref } from 'vue'
import { PERMISSOES_POR_PAPEL, type PapelUsuario, type Permissao } from '../../../shared/tipos/papel'
import { useAuthStore } from '../../auth/store/auth.store'
import { useAcessoStore } from '../store/acesso.store'
import type { TipoEventoAuditoria } from '../tipos'

type Aba = 'usuarios' | 'cargos' | 'auditoria'

const store = useAcessoStore()
const auth = useAuthStore()

const aba = ref<Aba>('usuarios')
const erro = ref('')
const sucesso = ref('')

const podeGerenciarUsuarios = computed(() => auth.temPermissao('usuarios.gerenciar'))
const podeSolicitarCargo = computed(
  () => auth.temPermissao('cargos.solicitar') || auth.temPermissao('cargos.gerenciar'),
)
const podeGerenciarCargos = computed(() => auth.temPermissao('cargos.gerenciar'))

const TODAS_PERMISSOES = PERMISSOES_POR_PAPEL.PROPRIETARIO
const PAPEIS: PapelUsuario[] = ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO', 'CAIXA']

// --- senha ---
const senhaUsuarioId = ref('')
const novaSenha = ref('')

// --- cargo ---
const cargoNome = ref('')
const cargoDescricao = ref('')
const cargoPermissoes = ref<Permissao[]>([])
const aprovandoId = ref<string | null>(null)
const senhaDono = ref('')

// --- auditoria ---
const filtroEvento = ref<TipoEventoAuditoria | 'todos'>('todos')
const eventos = computed(() => store.eventosPorTipo(filtroEvento.value))

function ok(mensagem: string): void {
  erro.value = ''
  sucesso.value = mensagem
}

function falha(e: unknown): void {
  sucesso.value = ''
  erro.value = e instanceof Error ? e.message : 'Não foi possível concluir.'
}

function alternarPermissaoNaLista(permissao: Permissao): void {
  const i = cargoPermissoes.value.indexOf(permissao)
  if (i >= 0) cargoPermissoes.value.splice(i, 1)
  else cargoPermissoes.value.push(permissao)
}

function solicitar(): void {
  try {
    store.solicitarCargo(
      { nome: cargoNome.value, descricao: cargoDescricao.value, permissoes: cargoPermissoes.value },
      auth.usuario?.nome ?? 'admin',
      podeSolicitarCargo.value,
    )
    cargoNome.value = ''
    cargoDescricao.value = ''
    cargoPermissoes.value = []
    ok('Solicitação enviada — aguarda aprovação do Proprietário.')
  } catch (e) {
    falha(e)
  }
}

async function aprovar(id: string): Promise<void> {
  try {
    if (!senhaDono.value) {
      erro.value = 'Informe a senha do Proprietário para confirmar.'
      return
    }
    await store.aprovarCargo(id, 'dono', senhaDono.value)
    aprovandoId.value = null
    senhaDono.value = ''
    ok('Cargo aprovado.')
  } catch (e) {
    falha(e)
  }
}

async function recusar(id: string): Promise<void> {
  try {
    if (!senhaDono.value) {
      erro.value = 'Informe a senha do Proprietário para confirmar.'
      return
    }
    await store.recusarCargo(id, 'dono', senhaDono.value, 'recusado pelo Proprietário')
    aprovandoId.value = null
    senhaDono.value = ''
    ok('Cargo recusado.')
  } catch (e) {
    falha(e)
  }
}

function redefinir(): void {
  try {
    if (!senhaUsuarioId.value || !novaSenha.value) {
      erro.value = 'Selecione o usuário e a nova senha.'
      return
    }
    store.redefinirSenha(senhaUsuarioId.value, novaSenha.value, auth.usuario?.nome ?? 'admin', podeGerenciarUsuarios.value)
    novaSenha.value = ''
    ok('Senha redefinida — vale para os próximos logins.')
  } catch (e) {
    falha(e)
  }
}

function dataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="pagina">
    <div class="cabecalho">
      <div>
        <div class="titulo">Acesso e Auditoria</div>
        <div class="subtitulo">Usuários, cargos e permissões · tudo auditado</div>
      </div>
    </div>

    <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
    <div v-if="sucesso" class="sucesso" role="status">{{ sucesso }}</div>

    <div class="subabas">
      <button type="button" :class="{ ativa: aba === 'usuarios' }" @click="aba = 'usuarios'">Usuários</button>
      <button type="button" :class="{ ativa: aba === 'cargos' }" @click="aba = 'cargos'">
        Cargos{{ store.cargosPendentes.length ? ` (${store.cargosPendentes.length})` : '' }}
      </button>
      <button type="button" :class="{ ativa: aba === 'auditoria' }" @click="aba = 'auditoria'">Auditoria</button>
    </div>

    <!-- USUÁRIOS -->
    <div v-if="aba === 'usuarios'" class="cartao">
      <div class="secao-titulo">Usuários ({{ store.usuariosAtivos.length }} ativos)</div>
      <div v-for="u in store.usuarios" :key="u.id" class="linha">
        <div>
          <strong>{{ u.nome }}</strong>
          <div class="meta">{{ u.identificador }} · {{ u.papel }}{{ u.ativo ? '' : ' · bloqueado' }}</div>
        </div>
        <span class="acoes-linha">
          <select
            v-if="podeGerenciarUsuarios && u.papel !== 'PROPRIETARIO'"
            :value="u.papel"
            aria-label="Cargo do usuário"
            @change="store.alterarPapel(u.id, ($event.target as HTMLSelectElement).value as PapelUsuario, auth.usuario?.nome ?? 'admin', true)"
          >
            <option v-for="p in PAPEIS" :key="p" :value="p">{{ p }}</option>
          </select>
          <button
            v-if="podeGerenciarUsuarios && u.papel !== 'PROPRIETARIO'"
            type="button"
            class="link"
            @click="store.alternarAtivo(u.id, auth.usuario?.nome ?? 'admin', true)"
          >
            {{ u.ativo ? 'bloquear' : 'reativar' }}
          </button>
        </span>
      </div>
      <div v-if="!podeGerenciarUsuarios" class="nota">Bloqueio e cargos exigem usuarios.gerenciar (Proprietário).</div>

      <div v-if="podeGerenciarUsuarios" class="secao-titulo espacar">Redefinir senha</div>
      <div v-if="podeGerenciarUsuarios" class="grade">
        <label class="campo">Usuário
          <select v-model="senhaUsuarioId">
            <option value="" disabled>Selecionar…</option>
            <option v-for="u in store.usuarios" :key="u.id" :value="u.id">{{ u.nome }}</option>
          </select>
        </label>
        <label class="campo">Nova senha<input v-model="novaSenha" type="text" autocomplete="off" /></label>
      </div>
      <button v-if="podeGerenciarUsuarios" type="button" class="botao-primario" @click="redefinir">Redefinir</button>
    </div>

    <!-- CARGOS -->
    <div v-if="aba === 'cargos'" class="cartao">
      <div class="secao-titulo">Solicitar cargo personalizado</div>
      <div v-if="!podeSolicitarCargo" class="nota">Solicitação exige cargos.solicitar.</div>
      <div class="grade">
        <label class="campo">Nome do cargo<input v-model="cargoNome" type="text" :disabled="!podeSolicitarCargo" /></label>
        <label class="campo">Descrição<input v-model="cargoDescricao" type="text" :disabled="!podeSolicitarCargo" /></label>
      </div>
      <div class="permissoes">
        <label v-for="p in TODAS_PERMISSOES" :key="p" class="check">
          <input type="checkbox" :checked="cargoPermissoes.includes(p)" :disabled="!podeSolicitarCargo" @change="alternarPermissaoNaLista(p)" />
          {{ p }}
        </label>
      </div>
      <button type="button" class="botao-primario" :disabled="!podeSolicitarCargo" @click="solicitar">Enviar solicitação</button>

      <div class="secao-titulo espacar">Solicitações e cargos ({{ store.cargos.length }})</div>
      <div v-if="store.cargos.length === 0" class="nota">Nenhum cargo personalizado ainda.</div>
      <div v-for="cargo in store.cargos" :key="cargo.id" class="bloco">
        <div class="linha-topo"><strong>{{ cargo.nome }}</strong><span>{{ cargo.status }} · v{{ cargo.versao }}</span></div>
        <div class="meta">{{ cargo.descricao || 'sem descrição' }} · solicitado por {{ cargo.solicitadoPor }}</div>
        <div class="meta">{{ cargo.permissoes.length }} permissões</div>
        <div v-if="cargo.status === 'solicitado' && podeGerenciarCargos" class="botoes-linha">
          <button type="button" class="botao-secundario" @click="aprovandoId = aprovandoId === cargo.id ? null : cargo.id">
            aprovar / recusar…
          </button>
        </div>
        <div v-if="aprovandoId === cargo.id" class="grade">
          <label class="campo">Senha do Proprietário (reautenticação)<input v-model="senhaDono" type="password" autocomplete="off" /></label>
        </div>
        <div v-if="aprovandoId === cargo.id" class="botoes-linha">
          <button type="button" class="botao-primario" @click="aprovar(cargo.id)">Aprovar</button>
          <button type="button" class="botao-secundario" @click="recusar(cargo.id)">Recusar</button>
        </div>
        <div v-if="cargo.historico.length > 0" class="meta">Histórico: {{ cargo.historico.length }} alterações de permissão (versão auditada).</div>
      </div>
    </div>

    <!-- AUDITORIA -->
    <div v-if="aba === 'auditoria'" class="cartao">
      <div class="secao-titulo">Eventos de acesso</div>
      <select v-model="filtroEvento" aria-label="Filtrar eventos">
        <option value="todos">todos</option>
        <option value="login">login</option>
        <option value="logout">logout</option>
        <option value="login-negado">login negado</option>
        <option value="usuario">usuário</option>
        <option value="cargo">cargo</option>
        <option value="permissao">permissão</option>
      </select>
      <div v-if="eventos.length === 0" class="nota">Nenhum evento ainda — entre e saia para gerar o primeiro.</div>
      <div v-for="ev in eventos" :key="ev.id" class="linha">
        <div>
          <strong>{{ ev.descricao }}</strong>
          <div class="meta">{{ ev.tipo }} · por {{ ev.responsavel }} · {{ dataHora(ev.criadoEm) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pagina { padding: 36px 44px 60px; display: flex; flex-direction: column; gap: 18px; max-width: 760px; }
@media (max-width: 640px) { .pagina { padding: 24px 16px 90px; } }
.cabecalho { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.titulo { font-family: 'Bodoni Moda', serif; font-size: 30px; font-weight: 600; color: var(--cor-on-bg); }
.subtitulo { font-size: 13px; color: var(--cor-on-surface-variant); }
.erro, .sucesso { font-size: 13px; border-radius: 10px; padding: 10px 14px; }
.erro { color: var(--cor-error); background: var(--cor-error-container); }
.sucesso { color: var(--cor-success); background: var(--cor-surface-variant); }
.subabas { display: flex; gap: 8px; flex-wrap: wrap; }
.subabas button { padding: 9px 16px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-surface); color: var(--cor-on-surface-variant); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.subabas button.ativa { background: var(--cor-primary-container); color: var(--cor-on-primary-container); border-color: transparent; }
.cartao { background: var(--cor-surface); border: 1px solid var(--cor-outline); border-radius: 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.cartao select { padding: 9px 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 13px; align-self: flex-start; }
.secao-titulo { font-size: 14px; font-weight: 700; color: var(--cor-on-surface); }
.secao-titulo.espacar { margin-top: 8px; }
.linha { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--cor-on-surface); padding: 10px 0; border-top: 1px solid var(--cor-outline); }
.meta { font-size: 12px; color: var(--cor-on-surface-variant); margin-top: 2px; }
.acoes-linha { display: flex; gap: 10px; align-items: center; }
.acoes-linha select { padding: 6px 8px; border-radius: 8px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 12px; }
.nota { font-size: 12.5px; color: var(--cor-on-surface-variant); }
.grade { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.campo { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--cor-on-surface-variant); }
.campo input, .campo select { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 13px; }
.permissoes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px; }
.check { display: flex; gap: 8px; align-items: center; font-size: 12.5px; color: var(--cor-on-surface); }
.bloco { display: flex; flex-direction: column; gap: 4px; padding: 10px 0; border-top: 1px solid var(--cor-outline); }
.linha-topo { display: flex; justify-content: space-between; font-size: 13.5px; color: var(--cor-on-surface); }
.botoes-linha { display: flex; gap: 8px; flex-wrap: wrap; }
.botao-primario { align-self: flex-start; padding: 11px 20px; border: none; border-radius: 100px; background: var(--cor-primary); color: var(--cor-on-primary); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.botao-primario:disabled { opacity: 0.5; cursor: default; }
.botao-secundario { padding: 9px 16px; border-radius: 100px; border: 1px solid var(--cor-outline); background: var(--cor-bg); color: var(--cor-on-surface); font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.link { background: none; border: none; padding: 0; font-family: inherit; font-size: 12.5px; font-weight: 600; color: var(--cor-primary); cursor: pointer; }
</style>
