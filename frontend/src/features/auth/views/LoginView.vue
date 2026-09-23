<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { demonstracaoExpirada, modoAmostraOnline, obterTempoRestanteDemo } from '../services/auth.mock'
import { obterTempoRestanteDoSite } from '../../../shared/amostra/prazo-do-site'
import { useAuthStore } from '../store/auth.store'

const store = useAuthStore()
const router = useRouter()
const route = useRoute()

const identificador = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)
const amostraOnline = computed(() => modoAmostraOnline())
const expirada = computed(() => amostraOnline.value && demonstracaoExpirada())
function formatarDuracao(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}min`
}

const tempoRestante = computed(() => {
  if (!amostraOnline.value) return null
  const ms = obterTempoRestanteDemo()
  if (ms === null) return null
  return formatarDuracao(ms)
})
const siteRestante = computed(() => {
  if (!amostraOnline.value) return null
  const ms = obterTempoRestanteDoSite()
  if (ms === null) return null
  return formatarDuracao(ms)
})

async function aoEnviarLogin(): Promise<void> {
  erro.value = ''
  carregando.value = true
  try {
    const usuario = await store.entrar(identificador.value, senha.value)
    const destino =
      typeof route.query.redirecionar === 'string' ? route.query.redirecionar : usuario.rotaInicial
    await router.push(destino)
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível entrar.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="tela">
    <div class="cartao">
      <div class="marca">Point Steak House</div>
      <p class="descricao">Entre com sua credencial para abrir sua área de trabalho.</p>

      <form @submit.prevent="aoEnviarLogin">
        <label class="campo">
          <span>Usuário</span>
          <input
            v-model="identificador"
            type="text"
            required
            autocomplete="username"
            placeholder="ex.: caixa"
          />
        </label>
        <label class="campo">
          <span>Senha</span>
          <input
            v-model="senha"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••"
          />
        </label>
        <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
        <button class="botao-primario" type="submit" :disabled="carregando">
          {{ carregando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <div v-if="amostraOnline" class="demo">
        <div class="demo-titulo">Acesso de demonstração</div>
        <p class="demo-texto">Use a credencial única enviada para avaliação. Ela vale por 4 horas após o primeiro uso.</p>
        <p v-if="tempoRestante" class="demo-texto">Tempo restante neste navegador: {{ tempoRestante }}.</p>
        <p v-if="siteRestante" class="demo-texto">Site disponível por mais {{ siteRestante }}.</p>
        <p v-if="expirada" class="erro" role="alert">Demonstração expirada neste navegador.</p>
      </div>
      <div v-else class="demo">
        <div class="demo-titulo">Contas de demonstração (senha 123)</div>
        <ul>
          <li><strong>dono</strong> — Proprietário</li>
          <li><strong>administrador</strong> — Administrador</li>
          <li><strong>acougueiro</strong> — Açougueiro</li>
          <li><strong>caixa</strong> — Caixa</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tela {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--cor-bg);
}

.cartao {
  width: min(400px, 100%);
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.marca {
  font-family: var(--fonte-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--cor-on-surface);
}

.descricao {
  margin: 0;
  font-size: 13px;
  color: var(--cor-on-surface-variant);
}

form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.campo input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 14px;
}

.erro {
  font-size: 12.5px;
  color: var(--cor-error);
}

.botao-primario {
  padding: 11px 16px;
  border: none;
  border-radius: 100px;
  background: var(--cor-primary);
  color: var(--cor-on-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.botao-primario:disabled {
  opacity: 0.6;
  cursor: default;
}

.demo {
  border-top: 1px solid var(--cor-outline);
  padding-top: 14px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.demo-titulo {
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--cor-on-surface);
}

.demo-texto {
  margin: 0 0 8px;
}

.demo ul {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
