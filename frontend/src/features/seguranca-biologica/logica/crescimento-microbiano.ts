// Simulação preditiva de crescimento microbiano — não substitui a coleta e
// análise laboratorial real; é uma estimativa baseada em modelos publicados,
// usada para ilustrar o efeito de tempo/temperatura antes de qualquer amostragem.
//
// Modelo primário (curva de crescimento no tempo): Baranyi, J. & Roberts, T.A.
// (1994). "A dynamic approach to predicting bacterial growth in food."
// International Journal of Food Microbiology, 23(3-4), 277–294. Solução
// analítica (forma fechada) do artigo original, reproduzida abaixo.
//
// Modelo secundário (efeito da temperatura na taxa máxima de crescimento):
// Ratkowsky, D.A., Olley, J., McMeekin, T.A. & Ball, A. (1982). "Relationship
// between temperature and growth rate of bacterial cultures." Journal of
// Bacteriology, 149(1), 1–5 (faixa sub-ótima). Acima da temperatura ótima, o
// declínio é aproximado de forma simplificada (o modelo completo de faixa
// assimétrica está em Ratkowsky et al. 1983, J. Bacteriol. 154(3), 1222–1226).
//
// Parâmetros cardeais por organismo — ver a referência específica em cada
// entrada de PARAMETROS_POR_ORGANISMO. São valores representativos da
// literatura, não uma calibração feita a partir de amostras desta operação.

export type OrganismoIndicador = 'LISTERIA' | 'SALMONELLA' | 'E_COLI' | 'MESOFILOS'

interface ParametrosCardinais {
  /** Temperatura mínima notional de crescimento (°C), modelo de Ratkowsky. */
  tMinC: number
  /** Temperatura ótima (°C). */
  tOptC: number
  /** Temperatura máxima notional de crescimento (°C). */
  tMaxC: number
  /** Coeficiente b do modelo de Ratkowsky (√h⁻¹·°C⁻¹). */
  b: number
  referencia: string
}

export const PARAMETROS_POR_ORGANISMO: Record<OrganismoIndicador, ParametrosCardinais> = {
  LISTERIA: {
    tMinC: -1.27,
    tOptC: 37.26,
    tMaxC: 45,
    b: 0.0225,
    referencia:
      'Cardeais (Tmin, Topt) de meta-regressão de crescimento de L. monocytogenes em alimentos; ' +
      'b representativo de Ratkowsky et al. (1982) ajustado a L. monocytogenes em patê de salmão (b≈0,021–0,024).',
  },
  SALMONELLA: {
    tMinC: 5.61,
    tOptC: 37,
    tMaxC: 45.6,
    b: 0.026,
    referencia:
      'Ratkowsky et al. ajustado a Salmonella spp. em melão fresco: √µmáx = 0,026×(T−5,613), R²=0,978.',
  },
  E_COLI: {
    tMinC: 3.36,
    tOptC: 43.16,
    tMaxC: 46.87,
    b: 0.0296,
    referencia:
      'Cardeais de E. coli O157:H7 (Tmin=3,36°C, Topt=43,16°C, Tmax=46,87°C, µótimo=1,385 h⁻¹) via modelo de Ratkowsky.',
  },
  MESOFILOS: {
    tMinC: 5,
    tOptC: 30,
    tMaxC: 45,
    b: 0.025,
    referencia:
      'Aproximação genérica para contagem de mesófilos aeróbios totais (indicador de população mista, ' +
      'não uma espécie única) — faixa cardeal típica de literatura de microbiologia de alimentos.',
  },
}

export const NOMES_ORGANISMO: Record<OrganismoIndicador, string> = {
  LISTERIA: 'Listeria monocytogenes',
  SALMONELLA: 'Salmonella spp.',
  E_COLI: 'E. coli O157:H7',
  MESOFILOS: 'Mesófilos aeróbios (indicador)',
}

/** Doença causada em humanos por infecção — referência geral (ANVISA/FDA Bad Bug Book). */
export const DOENCA_CAUSADA: Record<OrganismoIndicador, string> = {
  LISTERIA: 'Listeriose',
  SALMONELLA: 'Salmonelose',
  E_COLI: 'Colite hemorrágica; em casos graves, Síndrome Hemolítico-Urêmica (SHU)',
  MESOFILOS: 'Não é um patógeno específico — indicador geral de higiene/qualidade',
}

/** Teto prático de densidade populacional em alimentos (~9 log10 CFU/g), comumente usado em microbiologia preditiva. */
export const CAPACIDADE_MAXIMA_LOG10_CFU = 9

/**
 * Taxa máxima de crescimento específica (h⁻¹, base natural) na temperatura dada,
 * pelo modelo de Ratkowsky. Fora da faixa [Tmin, Tmax] o crescimento é nulo.
 */
export function taxaMaximaDeCrescimento(temperaturaC: number, organismo: OrganismoIndicador): number {
  const { tMinC, tOptC, tMaxC, b } = PARAMETROS_POR_ORGANISMO[organismo]
  if (temperaturaC <= tMinC || temperaturaC >= tMaxC) return 0

  if (temperaturaC <= tOptC) {
    const raiz = b * (temperaturaC - tMinC)
    return raiz * raiz
  }

  // Acima da temperatura ótima: declínio linear simplificado até Tmax. O modelo
  // de faixa completa de Ratkowsky et al. (1983) tem queda mais abrupta e
  // assimétrica — a aproximação linear aqui é conservadora (superestima a
  // taxa perto de Tmax) e serve apenas de ilustração.
  const raizNoOtimo = b * (tOptC - tMinC)
  const µOtimo = raizNoOtimo * raizNoOtimo
  const fracaoRestante = (tMaxC - temperaturaC) / (tMaxC - tOptC)
  return Math.max(0, µOtimo * fracaoRestante)
}

export interface PontoDeCrescimento {
  horas: number
  logCfuPorGrama: number
}

function calcularFuncaoDeAjusteA(t: number, µmax: number, h0: number): number {
  if (µmax <= 0) return t
  return t + (1 / µmax) * Math.log(Math.exp(-µmax * t) + Math.exp(-h0) - Math.exp(-µmax * t - h0))
}

/**
 * Simula a contagem esperada (log10 CFU/g) ao longo do tempo, para uma peça
 * mantida continuamente na temperatura informada — solução analítica de
 * Baranyi & Roberts (1994). `duracaoLagHoras` assume 0 (sem fase lag) por
 * padrão, a convenção conservadora de "pior caso" usada em avaliações de
 * risco quando o histórico térmico anterior da peça não é conhecido.
 */
export function simularCrescimento(
  organismo: OrganismoIndicador,
  temperaturaC: number,
  contagemInicialLog10Cfu: number,
  duracaoHoras: number,
  passoHoras = 0.5,
  duracaoLagHoras = 0,
): PontoDeCrescimento[] {
  const µmax = taxaMaximaDeCrescimento(temperaturaC, organismo)
  const lnY0 = contagemInicialLog10Cfu * Math.LN10
  const lnK = CAPACIDADE_MAXIMA_LOG10_CFU * Math.LN10
  const h0 = µmax * duracaoLagHoras

  const pontos: PontoDeCrescimento[] = []
  for (let t = 0; t <= duracaoHoras + 1e-9; t += passoHoras) {
    if (µmax <= 0) {
      pontos.push({ horas: t, logCfuPorGrama: contagemInicialLog10Cfu })
      continue
    }
    const a = calcularFuncaoDeAjusteA(t, µmax, h0)
    const lnY = lnY0 + µmax * a - Math.log(1 + (Math.exp(µmax * a) - 1) / Math.exp(lnK - lnY0))
    pontos.push({ horas: t, logCfuPorGrama: lnY / Math.LN10 })
  }
  return pontos
}
