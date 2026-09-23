import { describe, expect, it } from 'vitest'
import type { LoteProduto, ProdutoMercado, Promocao } from '../../tipos'
import {
  bloqueioDeVenda,
  calcularTroco,
  esperadoDinheiro,
  estoqueTotal,
  fiadoDisponivel,
  loteParaVenda,
  podeVenderFiado,
  promocaoDoItem,
  subtotalItem,
  sugestaoReposicao,
} from '../mercado'

const HOJE = '2026-09-22'

function lote(parcial: Partial<LoteProduto> & { lote: string }): LoteProduto {
  return { validade: '2026-10-01', quantidade: 10, estado: 'LIBERADO', ...parcial }
}

function produto(parcial: Partial<ProdutoMercado> = {}): ProdutoMercado {
  return {
    id: 'p1',
    nome: 'Picanha',
    categoria: 'Carnes',
    unidade: 'KG',
    preco: 89.9,
    custoMedio: 55,
    estoqueMinimo: 10,
    estoqueAlvo: 30,
    lotes: [lote({ lote: 'L1' })],
    ...parcial,
  }
}

describe('FEFO e validade', () => {
  it('escolhe o lote que vence primeiro', () => {
    const p = produto({
      lotes: [lote({ lote: 'L2', validade: '2026-10-10' }), lote({ lote: 'L1', validade: '2026-09-25' })],
    })
    expect(loteParaVenda(p, HOJE)?.lote).toBe('L1')
  })

  it('pula lote vencido e quarentena, usando o próximo válido', () => {
    const p = produto({
      lotes: [
        lote({ lote: 'VENC', validade: '2026-09-20' }),
        lote({ lote: 'QUAR', validade: '2026-09-23', estado: 'QUARENTENA' }),
        lote({ lote: 'OK', validade: '2026-09-30' }),
      ],
    })
    expect(loteParaVenda(p, HOJE)?.lote).toBe('OK')
  })

  it('bloqueia produto totalmente vencido', () => {
    const p = produto({ lotes: [lote({ lote: 'V', validade: '2026-09-20' })] })
    expect(loteParaVenda(p, HOJE)).toBeNull()
    expect(bloqueioDeVenda(p, HOJE)).toContain('Vencido')
  })

  it('soma o estoque ignorando descarte', () => {
    const p = produto({
      lotes: [lote({ lote: 'A', quantidade: 5 }), lote({ lote: 'B', quantidade: 2, estado: 'DESCARTADO' })],
    })
    expect(estoqueTotal(p)).toBe(5)
  })
})

describe('promoções', () => {
  const promos: Promocao[] = [
    { id: 'm', descricao: 'Markdown', tipo: 'markdown_validade', percentual: 15, diasLimite: 2, ativa: true },
    {
      id: 'q',
      descricao: 'Qtd',
      tipo: 'quantidade',
      produtoId: 'p1',
      percentual: 10,
      quantidadeMinima: 3,
      ativa: true,
    },
  ]

  it('aplica markdown quando vence em até o limite', () => {
    const p = produto()
    const l = lote({ lote: 'L', validade: '2026-09-23' })
    expect(promocaoDoItem(p, l, 1, promos, HOJE)?.percentual).toBe(15)
  })

  it('aplica promoção por quantidade fora do markdown', () => {
    const p = produto()
    const l = lote({ lote: 'L', validade: '2026-10-20' })
    expect(promocaoDoItem(p, l, 3, promos, HOJE)?.percentual).toBe(10)
    expect(promocaoDoItem(p, l, 2, promos, HOJE)).toBeNull()
  })

  it('markdown tem prioridade sobre quantidade', () => {
    const p = produto()
    const l = lote({ lote: 'L', validade: '2026-09-23' })
    expect(promocaoDoItem(p, l, 5, promos, HOJE)?.percentual).toBe(15)
  })
})

describe('valores', () => {
  it('calcula subtotal com descontos e arredonda', () => {
    expect(subtotalItem(0.5, 89.9, 6.74, 0)).toBe(38.21)
  })

  it('troco exige valor suficiente', () => {
    expect(calcularTroco(50, 100)).toBe(50)
    expect(calcularTroco(50, 30)).toBeNull()
  })

  it('fiado respeita limite disponível', () => {
    const cliente = { id: 'c', nome: 'Ana', limite: 500, saldo: 320.5 }
    expect(fiadoDisponivel(cliente)).toBe(179.5)
    expect(podeVenderFiado(cliente, 179.5)).toBe(true)
    expect(podeVenderFiado(cliente, 180)).toBe(false)
  })
})

describe('turno e reposição', () => {
  it('dinheiro esperado considera vendas, sangria e devolução', () => {
    expect(
      esperadoDinheiro({
        valorInicial: 200,
        vendas: [
          { total: 100, forma: 'DINHEIRO' },
          { total: 80, forma: 'CARTAO' },
        ],
        movimentos: [{ tipo: 'SANGRIA', valor: 50 }],
        devolucoesDinheiro: 20,
      }),
    ).toBe(230)
  })

  it('sugere reposição até o alvo e marca crítica', () => {
    const p = produto({ estoqueMinimo: 10, estoqueAlvo: 30, lotes: [lote({ lote: 'L', quantidade: 3.2 })] })
    const s = sugestaoReposicao(p)
    expect(s.atual).toBe(3.2)
    expect(s.sugestao).toBe(26.8)
    expect(s.critica).toBe(true)
  })
})
