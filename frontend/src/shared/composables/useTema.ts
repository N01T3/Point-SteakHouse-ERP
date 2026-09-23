import { ref, watchEffect } from 'vue'
import { NOME_VARIAVEL_CSS, tokensClaro, tokensEscuro } from '../../design-system/tokens'

const CHAVE_ARMAZENAMENTO = 'point-steakhouse:modo-escuro'

function lerPreferenciaSalva(): boolean {
  try {
    const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO)
    if (salvo !== null) return salvo === 'true'
  } catch {
    // localStorage indisponível (ex.: navegação privada) — cai no padrão abaixo
  }
  return true
}

const modoEscuro = ref(lerPreferenciaSalva())

watchEffect(() => {
  const tokens = modoEscuro.value ? tokensEscuro : tokensClaro
  const raiz = document.documentElement
  for (const chave of Object.keys(tokens) as (keyof typeof tokens)[]) {
    raiz.style.setProperty(NOME_VARIAVEL_CSS[chave], tokens[chave])
  }
  raiz.dataset.tema = modoEscuro.value ? 'escuro' : 'claro'
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, String(modoEscuro.value))
  } catch {
    // per-viewer convenience only — ausência de armazenamento não deve quebrar o tema
  }
})

export function useTema() {
  function alternar() {
    modoEscuro.value = !modoEscuro.value
  }

  return { modoEscuro, alternar }
}
