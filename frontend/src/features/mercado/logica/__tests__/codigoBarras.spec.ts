import { describe, expect, it } from 'vitest'
import {
  digitoVerificadorEAN,
  interpretarCodigo,
  validarEAN13,
} from '../codigoBarras'

describe('EAN-13 / GTIN', () => {
  it('calcula o dígito verificador (módulo 10)', () => {
    expect(digitoVerificadorEAN('789123400001')).toBe('9')
    expect(digitoVerificadorEAN('789123400015')).toBe('6')
    expect(digitoVerificadorEAN('abc')).toBeNull()
  })

  it('valida códigos com dígito correto e rejeita erro de digitação', () => {
    expect(validarEAN13('7891234000019')).toBe(true)
    expect(validarEAN13('7891234000011')).toBe(false)
    expect(validarEAN13('123')).toBe(false)
  })

  it('reconhece GTIN registrado na GS1 Brasil (789/790)', () => {
    const r = interpretarCodigo('7891234000019')
    expect(r.valido).toBe(true)
    expect(r.classe).toBe('gtin-brasil')
  })

  it('reconhece GTIN externo válido', () => {
    // 8414533041041 é um EAN-13 estruturalmente válido (prefixo 841 = Espanha)
    expect(interpretarCodigo('8414533041041').classe).toBe('gtin-externo')
  })

  it('marca EAN com dígito errado como inválido', () => {
    const r = interpretarCodigo('7891234000011')
    expect(r.valido).toBe(false)
    expect(r.classe).toBe('invalido')
  })
})

describe('peso variável (etiqueta de balança, prefixo 2)', () => {
  it('prefixo 20 = preço embutido em centavos', () => {
    // 20 + produto 00101 + valor 00450 (= R$ 4,50) + DV
    const base = '200010100450'
    const dv = digitoVerificadorEAN(base)
    const r = interpretarCodigo(base + dv)
    expect(r.classe).toBe('peso-variavel-preco')
    expect(r.produtoCodigo).toBe('00101')
    expect(r.precoEmbutido).toBeCloseTo(4.5)
    expect(r.valido).toBe(true)
  })

  it('prefixo 21 = peso embutido em gramas', () => {
    // 21 + produto 00102 + 01250 g (= 1,250 kg) + DV
    const base = '210010201250'
    const dv = digitoVerificadorEAN(base)
    const r = interpretarCodigo(base + dv)
    expect(r.classe).toBe('peso-variavel-peso')
    expect(r.pesoEmbutidoKg).toBeCloseTo(1.25)
  })
})

describe('PLU / código interno', () => {
  it('aceita PLU numérico curto', () => {
    const r = interpretarCodigo('101')
    expect(r.valido).toBe(true)
    expect(r.classe).toBe('interno')
  })

  it('rejeita texto livre', () => {
    expect(interpretarCodigo('picanha').classe).toBe('invalido')
  })
})
