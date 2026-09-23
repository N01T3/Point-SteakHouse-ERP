// Códigos de barras do varejo brasileiro — padrão GS1.
// - EAN-13/GTIN-13: 13 dígitos + dígito verificador módulo 10.
//   Prefixos 789/790 = registro na GS1 Brasil (origem do registro, não do produto).
// - Peso variável interno (etiqueta de balança): prefixo 2 (20–29).
//   Convenção usada aqui (configurável no PDV real):
//   20 P P P P P V V V V V C → valor embutido = PREÇO em centavos
//   21–29 ...                → valor embutido = PESO em gramas
// Fontes: GS1 Brasil (blog.gs1br.org), norma GS1 de peso variável.
export type ClasseCodigo =
  | 'gtin-brasil'
  | 'gtin-externo'
  | 'peso-variavel-preco'
  | 'peso-variavel-peso'
  | 'interno'
  | 'invalido'

export interface CodigoInterpretado {
  codigo: string
  valido: boolean
  classe: ClasseCodigo
  rotulo: string
  /** Código do produto embutido (peso variável) ou o próprio GTIN. */
  produtoCodigo?: string
  /** Preço embutido em R$ (peso variável tipo preço). */
  precoEmbutido?: number
  /** Peso embutido em kg (peso variável tipo peso). */
  pesoEmbutidoKg?: number
}

/** Dígito verificador EAN-13 (módulo 10, pesos 1/3 da esquerda). */
export function digitoVerificadorEAN(base12: string): string | null {
  if (!/^\d{12}$/.test(base12)) return null
  const soma = [...base12].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  return String((10 - (soma % 10)) % 10)
}

export function validarEAN13(codigo: string): boolean {
  if (!/^\d{13}$/.test(codigo)) return false
  return digitoVerificadorEAN(codigo.slice(0, 12)) === codigo[12]
}

function interpretarPesoVariavel(codigo: string): CodigoInterpretado {
  const prefixo = codigo.slice(0, 2)
  const produtoCodigo = codigo.slice(2, 7)
  const valor = Number(codigo.slice(7, 12))
  const base: CodigoInterpretado = { codigo, valido: validarEAN13(codigo), classe: 'peso-variavel-preco', rotulo: '' }
  if (prefixo === '20') {
    return {
      ...base,
      classe: 'peso-variavel-preco',
      rotulo: 'Etiqueta de balança — preço embutido',
      produtoCodigo,
      precoEmbutido: Math.round(valor) / 100,
    }
  }
  return {
    ...base,
    classe: 'peso-variavel-peso',
    rotulo: 'Etiqueta de balança — peso embutido',
    produtoCodigo,
    pesoEmbutidoKg: Math.round((valor / 1000) * 1000) / 1000,
  }
}

/** Classifica e interpreta qualquer código digitado/bipado no caixa. */
export function interpretarCodigo(entrada: string): CodigoInterpretado {
  const codigo = entrada.trim()
  if (/^\d{13}$/.test(codigo)) {
    const valido = validarEAN13(codigo)
    if (codigo.startsWith('2') && codigo[0] === '2') {
      const pv = interpretarPesoVariavel(codigo)
      return { ...pv, rotulo: valido ? pv.rotulo : 'Etiqueta de balança — dígito inválido' }
    }
    if (codigo.startsWith('789') || codigo.startsWith('790')) {
      return {
        codigo,
        valido,
        classe: valido ? 'gtin-brasil' : 'invalido',
        rotulo: valido ? 'GTIN-13 registrado na GS1 Brasil (789/790)' : 'EAN-13 com dígito inválido',
      }
    }
    return {
      codigo,
      valido,
      classe: valido ? 'gtin-externo' : 'invalido',
      rotulo: valido ? 'GTIN-13 externo (registro fora da GS1 Brasil)' : 'EAN-13 com dígito inválido',
    }
  }
  // PLU ou código interno curto (só dígitos, até 6 posições)
  if (/^\d{1,6}$/.test(codigo)) {
    return { codigo, valido: true, classe: 'interno', rotulo: 'PLU / código interno', produtoCodigo: codigo }
  }
  return { codigo, valido: false, classe: 'invalido', rotulo: 'Código não reconhecido' }
}
