import { definirTokenDeAcesso, obterTokenDeAcesso } from './estadoDoToken'

const URL_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface OpcoesRequisicao extends RequestInit {
  semAutenticacao?: boolean
}

async function tentarRenovarToken(): Promise<boolean> {
  const resposta = await fetch(`${URL_BASE}/auth/renovar`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!resposta.ok) {
    definirTokenDeAcesso(null)
    return false
  }
  const dados = (await resposta.json()) as { tokenDeAcesso: string }
  definirTokenDeAcesso(dados.tokenDeAcesso)
  return true
}

export async function requisitar<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const executar = () => {
    const cabecalhos = new Headers(opcoes.headers)
    cabecalhos.set('Content-Type', 'application/json')
    const token = obterTokenDeAcesso()
    if (token && !opcoes.semAutenticacao) {
      cabecalhos.set('Authorization', `Bearer ${token}`)
    }
    return fetch(`${URL_BASE}${caminho}`, { ...opcoes, headers: cabecalhos, credentials: 'include' })
  }

  let resposta = await executar()

  if (resposta.status === 401 && !opcoes.semAutenticacao) {
    const renovou = await tentarRenovarToken()
    if (renovou) resposta = await executar()
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    throw new Error(corpo?.message ?? `Erro na requisição: ${resposta.status}`)
  }

  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}
