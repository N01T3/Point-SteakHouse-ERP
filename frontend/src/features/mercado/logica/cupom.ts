// Cupom de venda — texto puro (testável) para exibir, imprimir ou reimprimir.
// A impressão usa o HTML gerado em janela própria; a reimpressão é auditada
// no store (contador `reimpressoes` da venda).
import type { Venda } from '../tipos'

const ROTULO_FORMA: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão',
  PIX: 'PIX',
  FIADO: 'Fiado',
  DIVIDIDO: 'Dividido',
}

function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function linhasPagamento(venda: Venda): string[] {
  const linhas: string[] = []
  if (venda.pagamento.forma === 'DIVIDIDO' && venda.pagamento.parcelas) {
    for (const parcela of venda.pagamento.parcelas) {
      const extra = parcela.clienteNome ? ` (${parcela.clienteNome})` : ''
      linhas.push(`${ROTULO_FORMA[parcela.forma]}${extra}: ${moeda(parcela.valor)}`)
    }
  } else {
    const extra = venda.pagamento.clienteNome ? ` (${venda.pagamento.clienteNome})` : ''
    linhas.push(`${ROTULO_FORMA[venda.pagamento.forma]}${extra}: ${moeda(venda.total)}`)
  }
  if (venda.pagamento.troco !== undefined && venda.pagamento.troco > 0) {
    linhas.push(`Troco: ${moeda(venda.pagamento.troco)}`)
  }
  return linhas
}

export function gerarTextoCupom(venda: Venda, loja = 'Point Steak House'): string {
  const linhas: string[] = [
    loja,
    `Venda #${venda.numero} · ${dataHora(venda.criadaEm)}`,
    `Operador: ${venda.operador}`,
    '--------------------------------',
  ]
  for (const item of venda.itens) {
    const qtd = item.unidade === 'KG' ? `${item.quantidade.toFixed(3)} kg` : `${item.quantidade} un`
    const subtotal = item.quantidade * item.precoUnitario - item.descontoPromo - item.descontoManual
    linhas.push(`${item.nome} — ${qtd} x ${moeda(item.precoUnitario)} = ${moeda(subtotal)}`)
    linhas.push(`  lote ${item.lote} · val. ${item.validade}`)
  }
  linhas.push('--------------------------------')
  linhas.push(`Subtotal: ${moeda(venda.subtotal)}`)
  if (venda.descontoTotal > 0) linhas.push(`Descontos: -${moeda(venda.descontoTotal)}`)
  linhas.push(`TOTAL: ${moeda(venda.total)}`)
  linhas.push(...linhasPagamento(venda))
  if (venda.estado === 'CANCELADA') linhas.push('*** VENDA CANCELADA ***')
  return linhas.join('\n')
}

/** HTML simples para a janela de impressão (sem dependências). */
export function gerarHtmlCupom(venda: Venda, loja = 'Point Steak House'): string {
  const texto = gerarTextoCupom(venda, loja)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '<br>')
  return (
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cupom #${venda.numero}</title><style>body{font-family:monospace;font-size:14px;max-width:300px;margin:16px auto}</style></head><body>${texto}<script>window.onload=()=>window.print();window.onafterprint=()=>window.close()</` +
    `script></body></html>`
  )
}
