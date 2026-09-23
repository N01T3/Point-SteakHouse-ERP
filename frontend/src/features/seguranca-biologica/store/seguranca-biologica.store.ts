import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  criarAuditoriaMock,
  criarCcpsMock,
  criarColetasMock,
  criarItensNaGeladeiraMock,
  criarProximasColetasMock,
} from '../mocks/seguranca-biologica.mock'
import { criarChecklist, validarTemperatura, type AcaoCorretiva, type ChecklistSanitario, type RegistroTemperatura, type TurnoChecklist } from '../logica/checklists'

export const useSegurancaBiologicaStore = defineStore('seguranca-biologica', () => {
  const ccps = ref(criarCcpsMock())
  const coletas = ref(criarColetasMock())
  const proximasColetas = ref(criarProximasColetasMock())
  const auditoria = ref(criarAuditoriaMock())
  const itensNaGeladeira = ref(criarItensNaGeladeiraMock())
  const checklists = ref<ChecklistSanitario[]>([])
  const temperaturas = ref<RegistroTemperatura[]>([])
  const acoes = ref<AcaoCorretiva[]>([])

  function verificarCcpAgora(ccpId: string, responsavel: string): void {
    const ccp = ccps.value.find((item) => item.id === ccpId)
    if (!ccp) return

    ccp.ultimaVerificacao = new Date()
    ccp.status = 'conforme'
    ccp.minutosAcumuladosEmZonaDePerigo = 0
    auditoria.value.unshift({
      id: `aud-${crypto.randomUUID()}`,
      descricao: `Verificação de CCP: ${ccp.nome}`,
      responsavel,
      registradoEm: new Date(),
    })
  }

  function descartarItemDaGeladeira(itemId: string, responsavel: string): void {
    const indice = itensNaGeladeira.value.findIndex((item) => item.id === itemId)
    if (indice === -1) return

    const [item] = itensNaGeladeira.value.splice(indice, 1)
    auditoria.value.unshift({
      id: `aud-${crypto.randomUUID()}`,
      descricao: `Descarte por prazo de armazenamento: ${item.corteNome}`,
      responsavel,
      registradoEm: new Date(),
    })
  }

  function registrarChecklist(turno: TurnoChecklist, estados: boolean[], responsavel: string, observacao?: string): ChecklistSanitario {
    const chk = criarChecklist(turno, responsavel, estados, observacao)
    checklists.value.unshift(chk)
    auditoria.value.unshift({
      id: `aud-${crypto.randomUUID()}`,
      descricao: `Checklist ${turno}: ${chk.itens.filter((i) => i.ok).length}/${chk.itens.length} OK`,
      responsavel,
      registradoEm: new Date(),
    })
    return chk
  }

  function registrarTemperatura(local: string, temperatura: number, responsavel: string, umidade?: number): RegistroTemperatura {
    const erro = validarTemperatura(local, temperatura, responsavel)
    if (erro) throw new Error(erro)
    const reg: RegistroTemperatura = {
      id: `tmp-${crypto.randomUUID()}`,
      local: local.trim(),
      temperatura,
      umidade,
      responsavel: responsavel.trim(),
      criadoEm: new Date().toISOString(),
    }
    temperaturas.value.unshift(reg)
    auditoria.value.unshift({
      id: `aud-${crypto.randomUUID()}`,
      descricao: `Temperatura ${local}: ${temperatura}°C`,
      responsavel,
      registradoEm: new Date(),
    })
    return reg
  }

  function abrirAcaoCorretiva(descricao: string, responsavel: string, lote?: string): AcaoCorretiva {
    if (!descricao.trim()) throw new Error('Descreva a ação corretiva.')
    if (!responsavel.trim()) throw new Error('Responsável é obrigatório.')
    const acao: AcaoCorretiva = {
      id: `ac-${crypto.randomUUID()}`,
      descricao: descricao.trim(),
      lote: lote?.trim() || undefined,
      responsavel: responsavel.trim(),
      status: 'aberta',
      criadaEm: new Date().toISOString(),
    }
    acoes.value.unshift(acao)
    return acao
  }

  function concluirAcao(id: string): void {
    const a = acoes.value.find((x) => x.id === id)
    if (!a) throw new Error('Ação não encontrada.')
    a.status = 'concluida'
  }

  return {
    ccps,
    coletas,
    proximasColetas,
    auditoria,
    itensNaGeladeira,
    checklists,
    temperaturas,
    acoes,
    verificarCcpAgora,
    descartarItemDaGeladeira,
    registrarChecklist,
    registrarTemperatura,
    abrirAcaoCorretiva,
    concluirAcao,
  }
})
