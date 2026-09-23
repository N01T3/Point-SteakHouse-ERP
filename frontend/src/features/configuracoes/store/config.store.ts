// Parâmetros operacionais persistentes do açougue/mercado.
import { defineStore } from 'pinia'
import { ref } from 'vue'

const CHAVE = 'point-config-v1'

export interface ConfigOperacional {
  margemAlvoCarnes: number
  limiteDescontoSemAprovacao: number
  toleranciaDivergenciaCaixa: number
  diasMarkdownValidade: number
  percentualMarkdown: number
  ufFiscal: string
  ambienteFiscal: 'homologacao' | 'producao'
  serieNfce: string
}

const PADRAO: ConfigOperacional = {
  margemAlvoCarnes: 30,
  limiteDescontoSemAprovacao: 10,
  toleranciaDivergenciaCaixa: 10,
  diasMarkdownValidade: 2,
  percentualMarkdown: 15,
  ufFiscal: 'PR',
  ambienteFiscal: 'homologacao',
  serieNfce: '1',
}

function carregar(): ConfigOperacional {
  try {
    const raw = localStorage.getItem(CHAVE)
    if (!raw) return { ...PADRAO }
    return { ...PADRAO, ...(JSON.parse(raw) as Partial<ConfigOperacional>) }
  } catch {
    return { ...PADRAO }
  }
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<ConfigOperacional>(carregar())
  const erro = ref('')

  function salvar(parcial: Partial<ConfigOperacional>, operador: string): void {
    erro.value = ''
    if (!operador.trim()) {
      erro.value = 'Operador é obrigatório.'
      throw new Error(erro.value)
    }
    if (parcial.margemAlvoCarnes !== undefined && (parcial.margemAlvoCarnes < 0 || parcial.margemAlvoCarnes > 90)) {
      throw new Error('Margem alvo deve estar entre 0 e 90%.')
    }
    if (parcial.ufFiscal !== undefined && parcial.ufFiscal.trim().length !== 2) {
      throw new Error('UF deve ter 2 letras.')
    }
    config.value = { ...config.value, ...parcial }
    try {
      localStorage.setItem(CHAVE, JSON.stringify(config.value))
    } catch {
      // mantém em memória
    }
  }

  return { config, erro, salvar }
})
