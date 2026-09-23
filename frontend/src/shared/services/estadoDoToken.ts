let tokenDeAcesso: string | null = null

export function definirTokenDeAcesso(token: string | null): void {
  tokenDeAcesso = token
}

export function obterTokenDeAcesso(): string | null {
  return tokenDeAcesso
}
