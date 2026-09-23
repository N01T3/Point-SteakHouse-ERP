import { z } from 'zod'

export const esquemaDeAmbiente = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET deve ter ao menos 32 caracteres'),
  JWT_ACCESS_EXPIRACAO: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter ao menos 32 caracteres'),
  JWT_REFRESH_EXPIRACAO: z.string().default('30d'),
})

export type AmbienteValidado = z.infer<typeof esquemaDeAmbiente>

export function validarVariaveisDeAmbiente(env: Record<string, unknown>): AmbienteValidado {
  const resultado = esquemaDeAmbiente.safeParse(env)
  if (!resultado.success) {
    const mensagens = resultado.error.issues
      .map((problema) => `  - ${problema.path.join('.')}: ${problema.message}`)
      .join('\n')
    throw new Error(`Configuração de ambiente inválida:\n${mensagens}`)
  }
  return resultado.data
}
