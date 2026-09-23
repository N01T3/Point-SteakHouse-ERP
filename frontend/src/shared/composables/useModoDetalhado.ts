// Modo simples (padrão) × detalhado (Proprietário) — `simplificacao-*.md`.
// Preferência salva por usuário neste dispositivo (localStorage).
import { ref, watch } from 'vue'
import { useAuthStore } from '../../features/auth/store/auth.store'

export type ModoVisualizacao = 'simples' | 'detalhado'

function chaveDoUsuario(usuarioId: string): string {
  return `psh-modo-${usuarioId}`
}

export function lerModoSalvo(usuarioId: string | undefined): ModoVisualizacao {
  if (!usuarioId) return 'simples'
  try {
    return localStorage.getItem(chaveDoUsuario(usuarioId)) === 'detalhado' ? 'detalhado' : 'simples'
  } catch {
    return 'simples'
  }
}

export function useModoDetalhado() {
  const auth = useAuthStore()
  const modo = ref<ModoVisualizacao>(lerModoSalvo(auth.usuario?.id))

  function podeDetalhar(): boolean {
    return auth.papel === 'PROPRIETARIO'
  }

  function definir(novo: ModoVisualizacao): void {
    if (novo === 'detalhado' && !podeDetalhar()) return
    modo.value = novo
    try {
      if (auth.usuario) localStorage.setItem(chaveDoUsuario(auth.usuario.id), novo)
    } catch {
      // dispositivo sem storage: mantém só na sessão
    }
  }

  // Troca de usuário recarrega a preferência dele
  watch(
    () => auth.usuario?.id,
    (id) => {
      modo.value = lerModoSalvo(id)
    },
  )

  return { modo, podeDetalhar, definir }
}
