// Bomba-relógio da amostra online: após o prazo, o site se inutiliza
// (tela de encerrada + login e navegação bloqueados).
//
// Precedência do prazo:
//  1. `VITE_AMOSTRA_EXPIRA_EM` (ISO, ex.: deploy + 12h) — vale para todos.
//  2. Fallback: primeira visita + 12h (por navegador, via localStorage).
//
// Só vale com `VITE_AMOSTRA_ONLINE === 'true'`.
// Limites conhecidos: usa o relógio do cliente e o fonte é público — a
// remoção real do ar exige suspender/excluir o serviço no dashboard do Render.
export const DURACAO_PADRAO_SITE_MS = 12 * 60 * 60 * 1000

const CHAVE_PRIMEIRA_VISITA = 'point_site_primeira_visita'

function amostraOnline(): boolean {
  try {
    const v = import.meta.env?.VITE_AMOSTRA_ONLINE as string | undefined
    return (v ?? '').trim() === 'true'
  } catch {
    return false
  }
}

function lerExpiracaoConfigurada(): number | null {
  try {
    const raw = import.meta.env?.VITE_AMOSTRA_EXPIRA_EM as string | undefined
    if (!raw) return null
    const ts = Date.parse(raw)
    return Number.isFinite(ts) ? ts : null
  } catch {
    return null
  }
}

export function lerPrimeiraVisita(): number | null {
  try {
    const raw = localStorage.getItem(CHAVE_PRIMEIRA_VISITA)
    if (!raw) return null
    const ts = Number(raw)
    return Number.isFinite(ts) && ts > 0 ? ts : null
  } catch {
    return null
  }
}

/** Carimba a primeira visita (sem sobrescrever). Chamar uma vez no boot. */
export function marcarPrimeiraVisita(agora = Date.now()): void {
  try {
    if (localStorage.getItem(CHAVE_PRIMEIRA_VISITA) === null) {
      localStorage.setItem(CHAVE_PRIMEIRA_VISITA, String(agora))
    }
  } catch {
    // storage indisponível: sem carimbo, sem fallback
  }
}

/** Timestamp em que o site expira, ou null se indeterminado/inaplicável. */
export function obterExpiracaoDoSite(): number | null {
  if (!amostraOnline()) return null
  const configurada = lerExpiracaoConfigurada()
  if (configurada !== null) return configurada
  const primeira = lerPrimeiraVisita()
  return primeira === null ? null : primeira + DURACAO_PADRAO_SITE_MS
}

export function siteExpirado(agora = Date.now()): boolean {
  const expiracao = obterExpiracaoDoSite()
  return expiracao !== null && agora >= expiracao
}

/** Ms restantes até o encerramento, 0 se expirado, null se indeterminado. */
export function obterTempoRestanteDoSite(agora = Date.now()): number | null {
  const expiracao = obterExpiracaoDoSite()
  if (expiracao === null) return null
  return Math.max(0, expiracao - agora)
}
