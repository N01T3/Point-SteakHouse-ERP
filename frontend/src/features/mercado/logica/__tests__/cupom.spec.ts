import { describe, expect, it } from 'vitest'
import type { Venda } from '../../tipos'
import { gerarHtmlCupom, gerarTextoCupom } from '../cupom'

function vendaBase(parcial: Partial<Venda> = {}): Venda {
  return {
    id: 'v1',
    numero: 7,
    itens: [
      {
        produtoId: 'picanha',
        nome: 'Picanha',
        unidade: 'KG',
        quantidade: 0.5,
        precoUnitario: 89.9,
        descontoPromo: 0,
        descontoManual: 0,
        lote: 'L2408',
        validade: '2026-09-24',
      },
    ],
    subtotal: 44.95,
    descontoTotal: 0,
    total: 44.95,
    pagamento: { forma: 'DINHEIRO', valorRecebido: 50, troco: 5.05 },
    valorDinheiro: 44.95,
    valorFiado: 0,
    operador: 'Marcos',
    criadaEm: '2026-09-22T10:00:00',
    sincronizada: true,
    estado: 'CONCLUIDA',
    ...parcial,
  }
}

describe('cupom de venda', () => {
  it('traz loja, número, itens com lote e total', () => {
    const texto = gerarTextoCupom(vendaBase())
    expect(texto).toContain('Point Steak House')
    expect(texto).toContain('Venda #7')
    expect(texto).toContain('Picanha')
    expect(texto).toContain('lote L2408')
    expect(texto).toContain('TOTAL:')
    expect(texto).toContain('Troco:')
  })

  it('detalha parcelas no pagamento dividido', () => {
    const texto = gerarTextoCupom(
      vendaBase({
        total: 100,
        pagamento: {
          forma: 'DIVIDIDO',
          parcelas: [
            { forma: 'CARTAO', valor: 60 },
            { forma: 'DINHEIRO', valor: 40 },
          ],
        },
        valorDinheiro: 40,
      }),
    )
    expect(texto).toContain('Cartão')
    expect(texto).toContain('Dinheiro')
  })

  it('marca cancelamento', () => {
    expect(gerarTextoCupom(vendaBase({ estado: 'CANCELADA' }))).toContain('CANCELADA')
  })

  it('gera HTML imprimível com número da venda', () => {
    const html = gerarHtmlCupom(vendaBase())
    expect(html).toContain('Cupom #7')
    expect(html).toContain('window.print()')
  })
})
