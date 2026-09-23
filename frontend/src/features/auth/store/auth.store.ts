import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { definirTokenDeAcesso } from '../../../shared/services/estadoDoToken'
import type { PapelUsuario, Permissao } from '../../../shared/tipos/papel'
import { useAcessoStore } from '../../acesso/store/acesso.store'
import { login } from '../services/auth.mock'
import type { UsuarioAutenticado } from '../services/auth.api'

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<UsuarioAutenticado | null>(null)
  const autenticado = computed(() => usuario.value !== null)
  const papel = computed<PapelUsuario | null>(() => usuario.value?.papel ?? null)

  function temPermissao(permissao: Permissao): boolean {
    return usuario.value?.permissoes.includes(permissao) ?? false
  }

  async function entrar(identificador: string, senha: string): Promise<UsuarioAutenticado> {
  const acesso = useAcessoStore()
  try {
    const resposta = await login(identificador, senha)
    definirTokenDeAcesso(resposta.tokenDeAcesso)
    usuario.value = resposta.usuario
    acesso.auditar('login', `Login: ${resposta.usuario.nome} (${resposta.usuario.papel})`, resposta.usuario.nome)
    return resposta.usuario
  } catch (e) {
    acesso.auditar('login-negado', `Tentativa com identificador "${identificador.trim().toLowerCase()}"`, 'sistema')
    throw e
  }
}

  function sair(): void {
    if (usuario.value) {
      useAcessoStore().auditar('logout', `Logout: ${usuario.value.nome}`, usuario.value.nome)
    }
    definirTokenDeAcesso(null)
    usuario.value = null
  }

  return { usuario, autenticado, papel, temPermissao, entrar, sair }
})
