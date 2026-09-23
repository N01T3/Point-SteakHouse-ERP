import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDesossaStore } from '../desossa.store'
import { useMaturacaoStore } from '../../../maturacao/store/maturacao.store'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('desossa completa', () => {
  it('cadastra peça, valida soma e impede envio duplicado', () => {
    const s = useDesossaStore()
    const peca = s.registrarPecaBruta({ fornecedor: 'F', tipoDePeca: 'Traseiro', pesoKg: 100, custoPorKg: 20 })
    expect(() => s.concluirDesossa(peca.id, [], 0.5)).toThrow()
    expect(() =>
      s.concluirDesossa(peca.id, [{ id: 'x', nome: 'Picanha', pesoKg: 120, classificacao: 'CORTE', destino: null }], 0.5),
    ).toThrow(/ultrapassa/)
    const ordem = s.concluirDesossa(
      peca.id,
      [
        { id: 'a', nome: 'Picanha', pesoKg: 6, classificacao: 'CORTE', destino: null },
        { id: 'b', nome: 'Osso', pesoKg: 10, classificacao: 'OSSO', destino: 'CALDO' },
      ],
      0.3,
    )
    expect(ordem.custoPorCorte?.length).toBe(1)
    s.marcarEnviada(ordem.id)
    expect(() => s.marcarEnviada(ordem.id)).toThrow(/já enviada/)
  })

  it('cancela ordem não enviada e devolve peça', () => {
    const s = useDesossaStore()
    const peca = s.registrarPecaBruta({ fornecedor: 'F', tipoDePeca: 'Dianteiro', pesoKg: 50, custoPorKg: 15 })
    const ordem = s.concluirDesossa(peca.id, [{ id: 'a', nome: 'Acém', pesoKg: 9, classificacao: 'CORTE', destino: null }], 0.3)
    s.cancelarOrdem(ordem.id)
    expect(s.pecasBrutasPendentes.some((p) => p.id === peca.id)).toBe(true)
  })
})

describe('maturação iniciada pelo estoque', () => {
  it('inicia, pesa e impede finalização duplicada', () => {
    const m = useMaturacaoStore()
    const p = m.iniciarMaturacao({ nome: 'Ancho', tecnica: 'dry_aged', camaraId: 'camara-1', pesoInicialKg: 5, diasTotal: 30, custoInicialPorKg: 50, loteOrigem: 'L1' })
    expect(p.pesoAtualKg).toBe(5)
    m.registrarPesagem(p.id, 4.5)
    expect(() => m.registrarPesagem(p.id, 9)).toThrow()
    m.finalizarMaturacao(p.id)
    expect(() => m.finalizarMaturacao(p.id)).toThrow(/já finalizada/)
  })
})
