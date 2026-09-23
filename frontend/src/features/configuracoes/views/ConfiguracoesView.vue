<script setup lang="ts">
import { ref } from 'vue'
import BadgeStatus from '../../../shared/components/BadgeStatus.vue'
import Botao from '../../../shared/components/Botao.vue'
import { useTema } from '../../../shared/composables/useTema'
import { useAutenticacao } from '../../auth/composables/useAutenticacao'
import { useDesossaStore } from '../../desossa-subprodutos/store/desossa.store'
import { useMaturacaoStore } from '../../maturacao/store/maturacao.store'
import { useParametrosSegurancaBiologicaStore } from '../../seguranca-biologica/store/parametros.store'
import { USUARIOS_MOCK } from '../mocks/usuarios.mock'
import { useConfigStore } from '../store/config.store'

const { usuario, autenticado, entrar, sair } = useAutenticacao()
const { modoEscuro, alternar } = useTema()
const maturacaoStore = useMaturacaoStore()
const parametros = useParametrosSegurancaBiologicaStore()
const desossaStore = useDesossaStore()
const cfg = useConfigStore()
const erroCfg = ref('')
const okCfg = ref('')

function salvarCfg(): void {
  erroCfg.value = ''
  okCfg.value = ''
  try {
    cfg.salvar({ ...cfg.config }, usuario.value?.nome ?? 'admin')
    okCfg.value = 'Configurações salvas.'
  } catch (e) {
    erroCfg.value = e instanceof Error ? e.message : 'Não foi possível salvar.'
  }
}

const identificador = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)

// Parâmetros agora persistentes via useConfigStore.

async function aoEnviarLogin(): Promise<void> {
  erro.value = ''
  carregando.value = true
  try {
    await entrar(identificador.value, senha.value)
    identificador.value = ''
    senha.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível entrar.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="pagina">
    <div class="titulo">Configurações</div>

    <div v-if="!autenticado" class="cartao-login">
      <p class="texto-aviso">Área restrita — informe as credenciais de administrador para continuar.</p>
      <form @submit.prevent="aoEnviarLogin">
        <label class="campo">
          <span>Usuário</span>
          <input v-model="identificador" type="text" required autocomplete="username" />
        </label>
        <label class="campo">
          <span>Senha</span>
          <input v-model="senha" type="password" required autocomplete="current-password" />
        </label>
        <div v-if="erro" class="erro">{{ erro }}</div>
        <button class="botao-primario" type="submit" :disabled="carregando">
          {{ carregando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
    </div>

    <template v-else>
      <div class="cabecalho-admin">
        <BadgeStatus tom="sucesso">Autenticado como {{ usuario?.nome }}</BadgeStatus>
        <Botao @clique="sair">Sair</Botao>
      </div>

      <div class="secao">
        <div class="secao-titulo">Usuários e permissões</div>
        <div class="lista-usuarios">
          <div v-for="u in USUARIOS_MOCK" :key="u.id" class="linha-usuario">
            <span>{{ u.nome }} · {{ u.identificador }}</span>
            <span class="papel">{{ u.papel }}</span>
          </div>
        </div>
      </div>

      <div class="secao">
        <div class="secao-titulo">Câmaras — faixa ideal</div>
        <div class="grade-camaras">
          <div v-for="camara in maturacaoStore.camaras" :key="camara.id" class="cartao-camara">
            <div class="camara-nome">{{ camara.nome }}</div>
            <label class="campo-inline">
              <span>Temp. mín (°C)</span>
              <input v-model.number="camara.temperaturaIdealMin" type="number" step="0.1" />
            </label>
            <label class="campo-inline">
              <span>Temp. máx (°C)</span>
              <input v-model.number="camara.temperaturaIdealMax" type="number" step="0.1" />
            </label>
            <label class="campo-inline">
              <span>Umidade mín (%)</span>
              <input v-model.number="camara.umidadeIdealMin" type="number" step="1" />
            </label>
            <label class="campo-inline">
              <span>Umidade máx (%)</span>
              <input v-model.number="camara.umidadeIdealMax" type="number" step="1" />
            </label>
          </div>
        </div>
      </div>

      <div class="secao">
        <div class="secao-titulo">Templates de desossa</div>
        <div v-for="template in desossaStore.templates" :key="template.id" class="linha-template">
          <strong>{{ template.tipoDePeca }}</strong>
          <span>{{
            template.cortesEsperados
              .map((c) => `${c.nome} (${(c.percentualEsperado * 100).toFixed(0)}%)`)
              .join(', ')
          }}</span>
        </div>
      </div>

      <div class="secao">
        <div class="secao-titulo">Parâmetros de Segurança Biológica</div>
        <label class="campo-inline">
          <span>Limite de zona de perigo (min)</span>
          <input v-model.number="parametros.limiteZonaDePerigoMinutos" type="number" />
        </label>
        <label class="campo-inline">
          <span>Limiar de Aw</span>
          <input v-model.number="parametros.limiarAw" type="number" step="0.01" min="0" max="1" />
        </label>
        <label class="campo-inline">
          <span>Frequência de coleta (dias)</span>
          <input v-model.number="parametros.frequenciaColetaDias" type="number" />
        </label>
      </div>

      <div class="secao">
        <div class="secao-titulo">Parâmetros financeiros do açougue (persistentes)</div>
        <label class="campo-inline">
          <span>Margem alvo das carnes (%)</span>
          <input v-model.number="cfg.config.margemAlvoCarnes" type="number" min="0" max="90" />
        </label>
        <label class="campo-inline">
          <span>Desconto sem aprovação (%)</span>
          <input v-model.number="cfg.config.limiteDescontoSemAprovacao" type="number" min="0" max="100" />
        </label>
        <div class="nota">Usados no preço mínimo e no alerta de margem em risco do Financeiro.</div>
      </div>

      <div class="secao">
        <div class="secao-titulo">Parâmetros de mercado e caixa (persistentes)</div>
        <label class="campo-inline">
          <span>Tolerância de divergência do caixa (R$)</span>
          <input v-model.number="cfg.config.toleranciaDivergenciaCaixa" type="number" min="0" step="0.01" />
        </label>
        <label class="campo-inline">
          <span>Markdown — dias antes do vencimento</span>
          <input v-model.number="cfg.config.diasMarkdownValidade" type="number" min="0" />
        </label>
        <label class="campo-inline">
          <span>Markdown — percentual (%)</span>
          <input v-model.number="cfg.config.percentualMarkdown" type="number" min="0" max="100" />
        </label>
      </div>

      <div class="secao">
        <div class="secao-titulo">Fiscal do estabelecimento (persistente por UF)</div>
        <label class="campo-inline">
          <span>UF</span>
          <input v-model="cfg.config.ufFiscal" type="text" maxlength="2" />
        </label>
        <label class="campo-inline">
          <span>Ambiente</span>
          <select v-model="cfg.config.ambienteFiscal">
            <option value="homologacao">Homologação</option>
            <option value="producao">Produção</option>
          </select>
        </label>
        <label class="campo-inline">
          <span>Série NFC-e</span>
          <input v-model="cfg.config.serieNfce" type="text" />
        </label>
        <div v-if="erroCfg" class="erro">{{ erroCfg }}</div>
        <div v-if="okCfg" class="sucesso" role="status">{{ okCfg }}</div>
        <button class="botao-primario" type="button" @click="salvarCfg">Salvar configurações</button>
        <div class="nota">
          Regras fiscais ficam em configuração, nunca fixas no frontend. Segredos (certificado, CSC) não
          aparecem aqui.
        </div>
      </div>

      <div class="secao">
        <div class="secao-titulo">Tema padrão do sistema</div>
        <Botao @clique="alternar">{{ modoEscuro ? 'Modo escuro' : 'Modo claro' }}</Botao>
      </div>

      <div class="secao">
        <div class="secao-titulo">Fila offline (Modo Híbrido "Inquebrável")</div>
        <div class="status-fila">
          <BadgeStatus tom="sucesso">0 comandos pendentes</BadgeStatus>
          <span>Última sincronização: agora</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pagina {
  padding: 36px 44px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 760px;
}

.titulo {
  font-family: var(--fonte-display);
  font-size: 30px;
  font-weight: 600;
  color: var(--cor-on-bg);
}

.cartao-login {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 360px;
}

.cartao-login form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.texto-aviso {
  font-size: 13px;
  color: var(--cor-on-surface-variant);
  margin: 0;
}

.campo,
.campo-inline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.campo-inline {
  max-width: 280px;
}

.campo input,
.campo-inline input,
.campo-inline select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--cor-outline);
  background: var(--cor-bg);
  color: var(--cor-on-surface);
  font-family: inherit;
  font-size: 13.5px;
}

.nota {
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}

.erro {
  font-size: 12.5px;
  color: var(--cor-error);
  background: var(--cor-error-container);
  border-radius: 10px;
  padding: 10px 12px;
}

.sucesso {
  font-size: 12.5px;
  color: var(--cor-success);
  background: var(--cor-surface-variant);
  border-radius: 10px;
  padding: 10px 12px;
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

.cabecalho-admin {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.secao {
  background: var(--cor-surface);
  border: 1px solid var(--cor-outline);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.secao-titulo {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.lista-usuarios {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.linha-usuario {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--cor-on-surface);
}

.papel {
  font-size: 11px;
  font-weight: 700;
  color: var(--cor-on-surface-variant);
  text-transform: uppercase;
}

.grade-camaras {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.cartao-camara {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--cor-outline);
}

.camara-nome {
  font-size: 13px;
  font-weight: 700;
  color: var(--cor-on-surface);
}

.linha-template {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--cor-on-surface);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--cor-outline);
}

.linha-template:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.linha-template span {
  font-size: 12px;
  color: var(--cor-on-surface-variant);
}

.status-fila {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12.5px;
  color: var(--cor-on-surface-variant);
}
</style>
