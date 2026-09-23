// Login mockado para o app de demonstração — sem backend real.
//
// Dois modos:
// - Local/dev/test (VITE_AMOSTRA_ONLINE != 'true'): 4 contas de vitrine (dono,
//   administrador, acougueiro, caixa), senha "123".
// - Amostra online (VITE_AMOSTRA_ONLINE === 'true'): credencial única
//   (VITE_DEMO_USUARIO / VITE_DEMO_SENHA) com queima global de 4h após o
//   primeiro uso. O carimbo fica em localStorage — suficiente para vitrine,
//   não é controle de segurança real (sem backend não há como impedir que
//   limpem o storage; o deploy usa ofuscação para dificultar a inspeção).
import { PERMISSOES_POR_PAPEL, ROTA_INICIAL_POR_PAPEL } from '../../../shared/tipos/papel'
import { siteExpirado } from '../../../shared/amostra/prazo-do-site'
import type { RespostaLogin, UsuarioAutenticado } from './auth.api'

interface CredencialDemo {
  usuario: UsuarioAutenticado
  senha: string
}

const CREDENCIAIS_DEV: CredencialDemo[] = [
  {
    usuario: {
      id: 'usuario-dono',
      nome: 'Dono',
      identificador: 'dono',
      papel: 'PROPRIETARIO',
      permissoes: PERMISSOES_POR_PAPEL.PROPRIETARIO,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.PROPRIETARIO,
    },
    senha: '123',
  },
  {
    usuario: {
      id: 'usuario-admin',
      nome: 'Marcos Gerente',
      identificador: 'administrador',
      papel: 'ADMINISTRADOR',
      permissoes: PERMISSOES_POR_PAPEL.ADMINISTRADOR,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.ADMINISTRADOR,
    },
    senha: '123',
  },
  {
    usuario: {
      id: 'usuario-acougue',
      nome: 'Rita Açougueira',
      identificador: 'acougueiro',
      papel: 'ACOUGUEIRO',
      permissoes: PERMISSOES_POR_PAPEL.ACOUGUEIRO,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.ACOUGUEIRO,
    },
    senha: '123',
  },
  {
    usuario: {
      id: 'usuario-caixa',
      nome: 'Paulo Caixa',
      identificador: 'caixa',
      papel: 'CAIXA',
      permissoes: PERMISSOES_POR_PAPEL.CAIXA,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.CAIXA,
    },
    senha: '123',
  },
]

// --- Amostra online: credencial única + queima de 4h ---

export const DEMO_DURACAO_MS = 4 * 60 * 60 * 1000
const CHAVE_PRIMEIRO_USO = 'point_demo_primeiro_uso'

export function modoAmostraOnline(): boolean {
  try {
    const v = import.meta.env?.VITE_AMOSTRA_ONLINE as string | undefined
    return (v ?? '').trim() === 'true'
  } catch {
    return false
  }
}

export function identificadorDemo(): string {
  const v = import.meta.env?.VITE_DEMO_USUARIO as string | undefined
  return (v ?? 'demo').trim().toLowerCase() || 'demo'
}

export const SENHA_DEMO_PADRAO = 'demo-4h-2026'

function senhaDemo(): string {
  const v = import.meta.env?.VITE_DEMO_SENHA as string | undefined
  // Var vazia ou só-espaços no dashboard = travamento total (nada loga);
  // cai no padrão documentado. Trim evita espaço colado no copiar/colar.
  const senha = (v ?? '').trim()
  return senha.length > 0 ? senha : SENHA_DEMO_PADRAO
}

function lerPrimeiroUso(): number | null {
  try {
    const raw = localStorage.getItem(CHAVE_PRIMEIRO_USO)
    if (!raw) return null
    const ts = Number(raw)
    return Number.isFinite(ts) && ts > 0 ? ts : null
  } catch {
    return null
  }
}

/** Timestamp em que a demonstração expira, ou null se ainda não foi ativada. */
export function obterExpiracaoDemo(): number | null {
  const primeiro = lerPrimeiroUso()
  return primeiro === null ? null : primeiro + DEMO_DURACAO_MS
}

export function demonstracaoExpirada(agora = Date.now()): boolean {
  const expiracao = obterExpiracaoDemo()
  return expiracao !== null && agora >= expiracao
}

/** Ms restantes até a queima, 0 se expirada, null se ainda não ativada. */
export function obterTempoRestanteDemo(agora = Date.now()): number | null {
  const expiracao = obterExpiracaoDemo()
  if (expiracao === null) return null
  return Math.max(0, expiracao - agora)
}

function credencialDemoUnica(): CredencialDemo {
  return {
    usuario: {
      id: 'usuario-demo',
      nome: 'Demonstração',
      identificador: identificadorDemo(),
      papel: 'PROPRIETARIO',
      permissoes: PERMISSOES_POR_PAPEL.PROPRIETARIO,
      rotaInicial: ROTA_INICIAL_POR_PAPEL.PROPRIETARIO,
    },
    senha: senhaDemo(),
  }
}

function atraso<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), 200))
}

export async function login(identificador: string, senha: string): Promise<RespostaLogin> {
  if (modoAmostraOnline()) {
    if (siteExpirado()) {
      await atraso(undefined)
      throw new Error('Site de demonstração encerrado — o período de avaliação terminou.')
    }
    if (demonstracaoExpirada()) {
      await atraso(undefined)
      throw new Error('Demonstração expirada — a credencial vale por 4 horas após o primeiro uso.')
    }
    const credencial = credencialDemoUnica()
    if (identificador.trim().toLowerCase() !== credencial.usuario.identificador || senha !== credencial.senha) {
      await atraso(undefined)
      throw new Error('Credenciais inválidas')
    }
    try {
      if (lerPrimeiroUso() === null) localStorage.setItem(CHAVE_PRIMEIRO_USO, String(Date.now()))
    } catch {
      // storage indisponível: segue sem carimbo (sessão atual continua válida)
    }
    const expiracao = obterExpiracaoDemo() ?? Date.now() + DEMO_DURACAO_MS
    return atraso({
      tokenDeAcesso: `token-mock-demo-${expiracao}`,
      usuario: credencial.usuario,
    })
  }

  const credencial = CREDENCIAIS_DEV.find(
    (c) => c.usuario.identificador === identificador.trim().toLowerCase(),
  )
  if (!credencial || credencial.senha !== senha) {
    await atraso(undefined)
    throw new Error('Credenciais inválidas')
  }
  return atraso({
    tokenDeAcesso: `token-mock-${credencial.usuario.identificador}`,
    usuario: credencial.usuario,
  })
}

/** Redefinição de senha em modo demonstração (dono). Vale para próximos logins. */
export function redefinirSenhaMock(identificador: string, novaSenha: string): void {
  if (modoAmostraOnline()) throw new Error('Redefinição indisponível na demonstração online.')
  const credencial = CREDENCIAIS_DEV.find(
    (c) => c.usuario.identificador === identificador.trim().toLowerCase(),
  )
  if (!credencial) throw new Error('Usuário não encontrado.')
  if (novaSenha.length < 3) throw new Error('Senha deve ter ao menos 3 caracteres.')
  credencial.senha = novaSenha
}
