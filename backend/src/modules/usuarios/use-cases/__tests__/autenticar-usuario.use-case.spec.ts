import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConfiguracaoService } from '../../../../config/configuracao.service.js'
import { PapelUsuario, Usuario } from '../../domain/usuario.entity.js'
import type { UsuarioRepository } from '../../repositories/usuario.repository.js'
import { AutenticarUsuarioUseCase } from '../autenticar-usuario.use-case.js'

function criarConfiguracaoFalsa(): ConfiguracaoService {
  return {
    jwtAccessSecret: 'segredo-de-acesso-para-teste-com-32-caracteres',
    jwtAccessExpiracao: '15m',
    jwtRefreshSecret: 'segredo-de-renovacao-para-teste-com-32-caracteres',
    jwtRefreshExpiracao: '30d',
  } as ConfiguracaoService
}

function criarRepositorioFalso(usuario: Usuario | null): UsuarioRepository {
  return {
    buscarPorEmail: vi.fn().mockResolvedValue(usuario),
    buscarPorId: vi.fn().mockResolvedValue(usuario),
    criar: vi.fn(),
    atualizarRefreshTokenHash: vi.fn().mockResolvedValue(undefined),
  }
}

describe('AutenticarUsuarioUseCase', () => {
  let senhaHash: string

  beforeEach(async () => {
    senhaHash = await bcrypt.hash('senha-correta', 10)
  })

  it('autentica um usuário com credenciais válidas e retorna os tokens', async () => {
    const usuario = new Usuario({
      id: 'usuario-1',
      nome: 'Dono',
      email: 'dono@pointsteakhouse.com',
      senhaHash,
      papel: PapelUsuario.PROPRIETARIO,
      refreshTokenHash: null,
    })
    const repositorio = criarRepositorioFalso(usuario)
    const useCase = new AutenticarUsuarioUseCase(repositorio, new JwtService(), criarConfiguracaoFalsa())

    const resultado = await useCase.executar('dono@pointsteakhouse.com', 'senha-correta')

    expect(resultado.tokenDeAcesso).toBeTruthy()
    expect(resultado.tokenDeRenovacao).toBeTruthy()
    expect(resultado.usuario.papel).toBe(PapelUsuario.PROPRIETARIO)
    expect(repositorio.atualizarRefreshTokenHash).toHaveBeenCalledWith('usuario-1', expect.any(String))
  })

  it('rejeita senha incorreta', async () => {
    const usuario = new Usuario({
      id: 'usuario-1',
      nome: 'Dono',
      email: 'dono@pointsteakhouse.com',
      senhaHash,
      papel: PapelUsuario.PROPRIETARIO,
      refreshTokenHash: null,
    })
    const repositorio = criarRepositorioFalso(usuario)
    const useCase = new AutenticarUsuarioUseCase(repositorio, new JwtService(), criarConfiguracaoFalsa())

    await expect(useCase.executar('dono@pointsteakhouse.com', 'senha-errada')).rejects.toThrow()
  })

  it('rejeita e-mail inexistente', async () => {
    const repositorio = criarRepositorioFalso(null)
    const useCase = new AutenticarUsuarioUseCase(repositorio, new JwtService(), criarConfiguracaoFalsa())

    await expect(useCase.executar('ninguem@pointsteakhouse.com', 'qualquer')).rejects.toThrow()
  })
})
