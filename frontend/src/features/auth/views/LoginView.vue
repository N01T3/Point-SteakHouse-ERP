<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.store'

const store = useAuthStore()
const router = useRouter()
const route = useRoute()

const identificador = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)

async function aoEnviarLogin(): Promise<void> {
  erro.value = ''
  carregando.value = true
  try {
    const usuario = await store.entrar(identificador.value, senha.value)
    const destino = typeof route.query.redirecionar === 'string' ? route.query.redirecionar : usuario.rotaInicial
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
          <input v-model="identificador" type="text" required autocomplete="username" placeholder="ex.: caixa" />
        </label>
        <label class="campo">
          <span>Senha</span>
          <input v-model="senha" type="password" required autocomplete="current-password" placeholder="••••" />
        </label>
        <div v-if="erro" class="erro" role="alert">{{ erro }}</div>
        <button class="botao-primario" type="submit" :disabled="carregando">
          {{ carregando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <div class="demo">
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
  font-family: 'Bodoni Moda', serif;
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

.demo ul {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
