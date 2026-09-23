// Gestão de acesso em modo demonstração.
// Senhas e reautenticação usam o mock de login (sem backend real).
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PapelUsuario, Permissao } from '../../../shared/tipos/papel'
import { login, redefinirSenhaMock } from '../../auth/services/auth.mock'
import { USUARIOS_GERENCIADOS_MOCK } from '../mock/acesso.mock'
import type {
  CargoPersonalizado,
  EventoAuditoria,
  StatusCargo,
  TipoEventoAuditoria,
} from '../tipos'

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T
}

export const useAcessoStore = defineStore('acesso', () => {
  const usuarios = ref(clonar(USUARIOS_GERENCIADOS_MOCK))
  const cargos = ref<CargoPersonalizado[]>([])
  const eventos = ref<EventoAuditoria[]>([])

  const usuariosAtivos = computed(() => usuarios.value.filter((u) => u.ativo))
  const cargosPendentes = computed(() => cargos.value.filter((c) => c.status === 'solicitado'))

  function auditar(tipo: TipoEventoAuditoria, descricao: string, responsavel: string): void {
    eventos.value.unshift({
      id: `ev-${crypto.randomUUID()}`,
      tipo,
      descricao,
      responsavel,
      criadoEm: new Date().toISOString(),
    })
  }

  function eventosPorTipo(tipo: TipoEventoAuditoria | 'todos'): EventoAuditoria[] {
    if (tipo === 'todos') return eventos.value
    return eventos.value.filter((e) => e.tipo === tipo)
  }

  // --- Usuários (dono: usuarios.gerenciar) ---

  function exigirGerenciar(tem: boolean): void {
    if (!tem) throw new Error('Sem permissão: usuarios.gerenciar (Proprietário).')
  }

  function alternarAtivo(usuarioId: string, operador: string, pode: boolean): void {
    exigirGerenciar(pode)
    const usuario = usuarios.value.find((u) => u.id === usuarioId)
    if (!usuario) throw new Error('Usuário não encontrado.')
    if (usuario.papel === 'PROPRIETARIO') throw new Error('O Proprietário não pode ser bloqueado.')
    usuario.ativo = !usuario.ativo
    auditar('usuario', `${usuario.nome} ${usuario.ativo ? 'reativado' : 'bloqueado'}`, operador)
  }

  function alterarPapel(usuarioId: string, papel: PapelUsuario, operador: string, pode: boolean): void {
    exigirGerenciar(pode)
    const usuario = usuarios.value.find((u) => u.id === usuarioId)
    if (!usuario) throw new Error('Usuário não encontrado.')
    if (usuario.papel === 'PROPRIETARIO') throw new Error('O cargo de Proprietário não pode ser alterado.')
    const anterior = usuario.papel
    usuario.papel = papel
    auditar('permissao', `${usuario.nome}: ${anterior} → ${papel}`, operador)
  }

  function redefinirSenha(usuarioId: string, novaSenha: string, operador: string, pode: boolean): void {
    exigirGerenciar(pode)
    const usuario = usuarios.value.find((u) => u.id === usuarioId)
    if (!usuario) throw new Error('Usuário não encontrado.')
    redefinirSenhaMock(usuario.identificador, novaSenha)
    auditar('usuario', `Senha de ${usuario.nome} redefinida`, operador)
  }

  // --- Cargos personalizados ---

  function solicitarCargo(
    dados: { nome: string; descricao: string; permissoes: Permissao[] },
    solicitadoPor: string,
    pode: boolean,
  ): CargoPersonalizado {
    if (!pode) throw new Error('Sem permissão: cargos.solicitar.')
    const nome = dados.nome.trim()
    if (!nome) throw new Error('Nome do cargo é obrigatório.')
    if (dados.permissoes.length === 0) throw new Error('Selecione ao menos uma permissão.')
    if (cargos.value.some((c) => c.nome.toLowerCase() === nome.toLowerCase() && c.status !== 'recusado')) {
      throw new Error('Já existe solicitação ou cargo com este nome.')
    }
    const cargo: CargoPersonalizado = {
      id: `cargo-${crypto.randomUUID()}`,
      nome,
      descricao: dados.descricao.trim(),
      permissoes: [...dados.permissoes],
      status: 'solicitado',
      solicitadoPor,
      versao: 1,
      historico: [],
      criadoEm: new Date().toISOString(),
    }
    cargos.value.unshift(cargo)
    auditar('cargo', `Cargo "${nome}" solicitado`, solicitadoPor)
    return cargo
  }

  function mudarStatusCargo(cargoId: string, status: StatusCargo, operador: string, motivo = ''): CargoPersonalizado {
    const cargo = cargos.value.find((c) => c.id === cargoId)
    if (!cargo) throw new Error('Cargo não encontrado.')
    cargo.status = status
    auditar('cargo', `Cargo "${cargo.nome}" ${status}${motivo ? ` — ${motivo}` : ''}`, operador)
    return cargo
  }

  /**
   * Aprovação exige cargos.gerenciar (dono) + reautenticação com a senha atual
   * do Proprietário — validada no mock de login, nunca confiada do cliente.
   */
  async function aprovarCargo(cargoId: string, identificadorDono: string, senha: string): Promise<CargoPersonalizado> {
    const cargo = cargos.value.find((c) => c.id === cargoId)
    if (!cargo) throw new Error('Cargo não encontrado.')
    if (cargo.status !== 'solicitado') throw new Error('Só é possível aprovar solicitação pendente.')
    let resposta
    try {
      resposta = await login(identificadorDono, senha)
    } catch {
      auditar('cargo', `Aprovação de "${cargo.nome}" recusada: reautenticação falhou`, identificadorDono)
      throw new Error('Reautenticação falhou — confira a senha do Proprietário.')
    }
    if (resposta.usuario.papel !== 'PROPRIETARIO' || !resposta.usuario.permissoes.includes('cargos.gerenciar')) {
      throw new Error('Aprovação exclusiva do Proprietário.')
    }
    return mudarStatusCargo(cargoId, 'aprovado', resposta.usuario.nome)
  }

  async function recusarCargo(cargoId: string, identificadorDono: string, senha: string, motivo: string): Promise<CargoPersonalizado> {
    const cargo = cargos.value.find((c) => c.id === cargoId)
    if (!cargo) throw new Error('Cargo não encontrado.')
    try {
      const resposta = await login(identificadorDono, senha)
      if (resposta.usuario.papel !== 'PROPRIETARIO') throw new Error('exclusivo do Proprietário')
      return mudarStatusCargo(cargoId, 'recusado', resposta.usuario.nome, motivo)
    } catch (e) {
      if (e instanceof Error && e.message.includes('exclusivo')) throw e
      throw new Error('Reautenticação falhou — confira a senha do Proprietário.')
    }
  }

  function alterarPermissoesCargo(cargoId: string, permissoes: Permissao[], autor: string, motivo: string, pode: boolean): CargoPersonalizado {
    if (!pode) throw new Error('Sem permissão: cargos.gerenciar (Proprietário).')
    const cargo = cargos.value.find((c) => c.id === cargoId)
    if (!cargo) throw new Error('Cargo não encontrado.')
    if (cargo.status === 'desativado') throw new Error('Cargo desativado não pode ser alterado.')
    if (!motivo.trim()) throw new Error('Alteração de permissão exige motivo.')
    cargo.historico.unshift({
      versao: cargo.versao,
      antes: [...cargo.permissoes],
      depois: [...permissoes],
      autor,
      motivo: motivo.trim(),
      data: new Date().toISOString(),
    })
    cargo.permissoes = [...permissoes]
    cargo.versao += 1
    auditar('permissao', `Cargo "${cargo.nome}" v${cargo.versao}: permissões alteradas — ${motivo.trim()}`, autor)
    return cargo
  }

  function desativarCargo(cargoId: string, operador: string, pode: boolean): CargoPersonalizado {
    if (!pode) throw new Error('Sem permissão: cargos.gerenciar (Proprietário).')
    return mudarStatusCargo(cargoId, 'desativado', operador, 'histórico preservado')
  }

  return {
    usuarios,
    cargos,
    eventos,
    usuariosAtivos,
    cargosPendentes,
    auditar,
    eventosPorTipo,
    alternarAtivo,
    alterarPapel,
    redefinirSenha,
    solicitarCargo,
    aprovarCargo,
    recusarCargo,
    alterarPermissoesCargo,
    desativarCargo,
  }
})
