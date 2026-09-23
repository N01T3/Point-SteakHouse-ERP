import { storeToRefs } from 'pinia'
import { useAuthStore } from '../store/auth.store'

export function useAutenticacao() {
  const store = useAuthStore()
  const { usuario, autenticado, papel } = storeToRefs(store)
  return { usuario, autenticado, papel, entrar: store.entrar, sair: store.sair, temPermissao: store.temPermissao }
}
