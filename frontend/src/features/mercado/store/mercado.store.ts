// Estado operacional do Mercado em modo demonstração.
// Regras de cálculo vivem em `logica/mercado.ts`; aqui fica só orquestração.
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import {
  arredondar,
  bloqueioDeVenda,
  diasParaVencer,
  loteParaVenda,
  loteVencido,
  podeVenderFiado,
  promocaoDoItem,
  subtotalItem,
  sugestaoReposicao,
  type SugestaoReposicao,
} from '../logica/mercado'
import {
  CHAVE_CATALOGO,
  mesclarCatalogo,
  serializarCatalogo,
  validarCatalogoImportado,
} from '../logica/catalogoPersistido'
import { cadeiaDoLote, criarLancamento, type MovimentoLivro, type TipoMovimentoEstoque } from '../logica/livroMovimentos'
import { resolverGrupo } from '../logica/grupos'
import { criarBancoLocal } from '../servicos/bancoLocal'
import { interpretarCodigo, validarEAN13 } from '../logica/codigoBarras'
import { CLIENTES_FIADO_MOCK, FORNECEDORES_MOCK, PRODUTOS_MOCK, PROMOCOES_MOCK } from '../mock/mercado.mock'
import type {
  ContagemEstoque,
  Devolucao,
  DestinoDevolucao,
  Fornecedor,
  ItemCarrinho,
  ItemPedidoCompra,
  MotivoPerdaMercado,
  MovimentoCaixa,
  PagamentoVenda,
  PedidoCompra,
  PerdaMercado,
  ProdutoMercado,
  Promocao,
  RastroLote,
  RecebimentoMercado,
  StatusPedido,
  TipoMovimentoCaixa,
  TransferenciaEstoque,
  TurnoCaixa,
  Venda,
  VendaSuspensa,
} from '../tipos'
import { localDoLote } from '../tipos'

export const LIMITE_DIVERGENCIA_CAIXA = 10

export interface AlertaValidade {
  produtoId: string
  produto: string
  lote: string
  quantidade: number
  dias: number
  tipo: 'vencido' | 'proximo'
}

export interface ReposicaoSugerida extends SugestaoReposicao {
  produtoId: string
  produto: string
  unidade: string
}

export interface DadosNovoProduto {
  nome: string
  categoria: string
  grupo?: string
  subgrupo?: string
  unidade: 'KG' | 'UN'
  preco: number
  custoMedio: number
  codigoBarras?: string
  plu?: string
  estoqueMinimo: number
  estoqueAlvo: number
  fornecedor?: string
  validadeDias?: number
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T
}

export const useMercadoStore = defineStore('mercado', () => {
  const produtos = ref<ProdutoMercado[]>(clonar(PRODUTOS_MOCK))
  const clientes = ref(clonar(CLIENTES_FIADO_MOCK))
  const promocoes = ref(clonar(PROMOCOES_MOCK))
  const turno = ref<TurnoCaixa | null>(null)
  const movimentos = ref<MovimentoCaixa[]>([])
  const carrinho = ref<ItemCarrinho[]>([])
  const suspensas = ref<VendaSuspensa[]>([])
  const vendas = ref<Venda[]>([])
  const devolucoes = ref<Devolucao[]>([])
  const perdas = ref<PerdaMercado[]>([])
  const recebimentos = ref<RecebimentoMercado[]>([])
  const transferencias = ref<TransferenciaEstoque[]>([])
  const contagens = ref<ContagemEstoque[]>([])
  const fornecedores = ref<Fornecedor[]>(clonar(FORNECEDORES_MOCK))
  const pedidos = ref<PedidoCompra[]>([])
  const proximoPedido = ref(1)
  /** EAN bipado no caixa mas ainda não cadastrado — abre o cadastro assistido. */
  const eanParaCadastrar = ref<string | null>(null)
  const online = ref(true)
  const proximoNumero = ref(1)
  /** Quantidade já devolvida por venda e produto — impede devolver além do vendido. */
  const devolvidos = ref<Record<string, Record<string, number>>>({})
  /** Livro único de movimentos — auditoria operacional ponta a ponta. */
  const livro = ref<MovimentoLivro[]>([])
  /** Eventos operacionais (venda, desconto, preço, gaveta, reimpressão…). */
  const eventos = ref<Array<{ id: string; tipo: string; descricao: string; operador: string; online: boolean; criadaEm: string }>>([])
  /** Banco local (IndexedDB; memória onde não há): catálogo sobrevive ao reload. */
  const banco = criarBancoLocal()
  const catalogoPronto = ref(false)
  const origemCatalogo = ref<'demo' | 'local'>('demo')
  let persistenciaPendente: ReturnType<typeof setTimeout> | undefined

  async function persistirCatalogo(): Promise<void> {
    try {
      await banco.gravar(CHAVE_CATALOGO, serializarCatalogo(produtos.value))
    } catch {
      // demonstração segue em memória
    }
  }

  function agendarPersistencia(): void {
    if (persistenciaPendente) clearTimeout(persistenciaPendente)
    persistenciaPendente = setTimeout(() => {
      void persistirCatalogo()
    }, 300)
  }

  async function carregarCatalogo(): Promise<void> {
    try {
      const salvo = await banco.ler<ReturnType<typeof serializarCatalogo>>(CHAVE_CATALOGO)
      if (salvo) {
        produtos.value = mesclarCatalogo(PRODUTOS_MOCK, salvo)
        origemCatalogo.value = 'local'
      }
    } catch {
      produtos.value = clonar(PRODUTOS_MOCK)
    } finally {
      catalogoPronto.value = true
    }
  }

  void carregarCatalogo()
  watch(produtos, agendarPersistencia, { deep: true })

  /** Backup do catálogo em JSON (download). */
  function exportarCatalogo(): string {
    return JSON.stringify(serializarCatalogo(produtos.value), null, 2)
  }

  /** Restaura catálogo de um JSON previamente exportado. */
  function importarCatalogo(json: string, operador: string): number {
    if (!operador.trim()) throw new Error('Operador é obrigatório para auditoria.')
    let dados: unknown
    try {
      dados = JSON.parse(json) as unknown
    } catch {
      throw new Error('Arquivo inválido — não é um JSON.')
    }
    const lista = Array.isArray((dados as { produtos?: unknown }).produtos)
      ? (dados as { produtos: unknown }).produtos
      : dados
    const produtosValidos = validarCatalogoImportado(lista)
    produtos.value = produtosValidos
    origemCatalogo.value = 'local'
    void persistirCatalogo()
    return produtosValidos.length
  }

  /** Volta à base demo (útil após testes) e persiste. */
  function restaurarDemo(): void {
    produtos.value = clonar(PRODUTOS_MOCK)
    promocoes.value = clonar(PROMOCOES_MOCK)
    origemCatalogo.value = 'demo'
    void persistirCatalogo()
  }

  /** Lança movimento no livro único (base da rastreabilidade e auditoria). */
  function lancarNoLivro(
    tipo: TipoMovimentoEstoque,
    args: { produtoId: string; produto: string; lote: string; quantidade: number; custoUnitario?: number; motivo: string; operador: string; referencia?: string },
  ): MovimentoLivro {
    const mov = criarLancamento({
      tipo,
      produtoId: args.produtoId,
      produto: args.produto,
      lote: args.lote,
      quantidade: args.quantidade,
      custoUnitario: args.custoUnitario,
      motivo: args.motivo,
      operador: args.operador,
      terminal: turno.value?.terminal ?? 'Caixa 01',
      online: online.value,
      referencia: args.referencia,
    })
    livro.value.unshift(mov)
    return mov
  }

  function auditarEvento(tipo: string, descricao: string, operador: string): void {
    eventos.value.unshift({
      id: `evt-${crypto.randomUUID()}`,
      tipo,
      descricao,
      operador,
      online: online.value,
      criadaEm: new Date().toISOString(),
    })
  }

  /** Cadeia completa de um lote: livro + vendas afetadas (recall acionável). */
  function cadeiaCompletaDoLote(codigo: string) {
    const busca = codigo.trim()
    const movimentos = cadeiaDoLote(livro.value, busca)
    const base = rastroDoLote(busca)
    return { ...base, movimentos }
  }

  /** Recebe ordem de desossa e gera lotes vendáveis no estoque. */
  function aplicarDesossaAoEstoque(
    ordem: { pecaBruta: { id: string; fornecedor: string }; saidas: Array<{ nome: string; pesoKg: number; classificacao: string; destino: string | null }>; custoEfetivoPorKg: number },
    operador: string,
  ): number {
    let criados = 0
    for (const saida of ordem.saidas) {
      if (saida.classificacao !== 'CORTE' && saida.destino !== 'MOIDA') continue
      const id = saida.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      let produto = produtos.value.find((p) => p.id === id || p.nome.toLowerCase() === saida.nome.toLowerCase())
      if (!produto) {
        produto = {
          id: id || `corte-${crypto.randomUUID()}`,
          nome: saida.nome,
          categoria: 'Carnes',
          grupo: 'Carnes',
          subgrupo: 'Cortes bovinos',
          unidade: 'KG',
          preco: Math.round(ordem.custoEfetivoPorKg * 1.43 * 100) / 100,
          custoMedio: Math.round(ordem.custoEfetivoPorKg * 100) / 100,
          margemAlvo: 0.3,
          fornecedor: ordem.pecaBruta.fornecedor,
          ativo: true,
          estoqueMinimo: 5,
          estoqueAlvo: 15,
          lotes: [],
        }
        produtos.value.push(produto)
      }
      const codigoLote = `D-${ordem.pecaBruta.id.slice(-4).toUpperCase()}`
      const validade = new Date()
      validade.setDate(validade.getDate() + 3)
      produto.lotes.push({
        lote: codigoLote,
        validade: validade.toISOString().slice(0, 10),
        quantidade: Math.round(saida.pesoKg * 1000) / 1000,
        estado: 'LIBERADO',
        local: 'Câmara fria 1',
        custoUnitario: Math.round(ordem.custoEfetivoPorKg * 100) / 100,
        origem: { tipo: 'desossa', referencia: ordem.pecaBruta.id, fornecedor: ordem.pecaBruta.fornecedor, responsavel: operador },
      })
      produto.custoMedio = Math.round(ordem.custoEfetivoPorKg * 100) / 100
      lancarNoLivro('desossa_saida', {
        produtoId: produto.id,
        produto: produto.nome,
        lote: codigoLote,
        quantidade: Math.round(saida.pesoKg * 1000) / 1000,
        custoUnitario: Math.round(ordem.custoEfetivoPorKg * 100) / 100,
        motivo: `Desossa ${ordem.pecaBruta.id} → ${saida.pesoKg}kg`,
        operador,
        referencia: ordem.pecaBruta.id,
      })
      criados++
    }
    lancarNoLivro('desossa_entrada', {
      produtoId: `peca-${ordem.pecaBruta.id}`,
      produto: `Peça ${ordem.pecaBruta.id}`,
      lote: `D-${ordem.pecaBruta.id.slice(-4).toUpperCase()}`,
      quantidade: -ordem.saidas.reduce((s, x) => s + x.pesoKg, 0),
      motivo: `Peça consumida na desossa ${ordem.pecaBruta.id}`,
      operador,
      referencia: ordem.pecaBruta.id,
    })
    auditarEvento('desossa', `Desossa ${ordem.pecaBruta.id} gerou ${criados} lotes`, operador)
    void persistirCatalogo()
    return criados
  }

  /** Finalização de maturação vira lote vendável com custo recalculado. */
  function aplicarMaturacaoAoEstoque(
    peca: { id: string; nome: string; pesoAtualKg: number; custoInicialPorKg: number; pesoInicialKg: number },
    operador: string,
  ): void {
    const custoKg = peca.pesoAtualKg > 0 ? (peca.pesoInicialKg * peca.custoInicialPorKg) / peca.pesoAtualKg : peca.custoInicialPorKg
    const id = peca.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    let produto = produtos.value.find((p) => p.id === id || p.nome.toLowerCase() === peca.nome.toLowerCase())
    if (!produto) {
      produto = {
        id: id || `maturado-${crypto.randomUUID()}`,
        nome: `${peca.nome} maturado`,
        categoria: 'Carnes',
        grupo: 'Carnes',
        subgrupo: 'Maturados',
        unidade: 'KG',
        preco: Math.round(custoKg * 1.6 * 100) / 100,
        custoMedio: Math.round(custoKg * 100) / 100,
        margemAlvo: 0.35,
        fornecedor: 'Maturação própria',
        ativo: true,
        estoqueMinimo: 3,
        estoqueAlvo: 10,
        lotes: [],
      }
      produtos.value.push(produto)
    }
    const codigoLote = `M-${peca.id.slice(-4).toUpperCase()}`
    const validade = new Date()
    validade.setDate(validade.getDate() + 5)
    produto.lotes.push({
      lote: codigoLote,
      validade: validade.toISOString().slice(0, 10),
      quantidade: Math.round(peca.pesoAtualKg * 1000) / 1000,
      estado: 'LIBERADO',
      local: 'Balcão',
      custoUnitario: Math.round(custoKg * 100) / 100,
      origem: { tipo: 'maturacao', referencia: peca.id, responsavel: operador },
    })
    produto.custoMedio = Math.round(custoKg * 100) / 100
    lancarNoLivro('maturacao_saida', {
      produtoId: produto.id,
      produto: produto.nome,
      lote: codigoLote,
      quantidade: Math.round(peca.pesoAtualKg * 1000) / 1000,
      custoUnitario: Math.round(custoKg * 100) / 100,
      motivo: `Maturação ${peca.id} finalizada`,
      operador,
      referencia: peca.id,
    })
    auditarEvento('maturacao', `Maturação ${peca.nome} virou lote ${codigoLote}`, operador)
    void persistirCatalogo()
  }

  const turnoAberto = computed(() => turno.value?.estado === 'ABERTO')

  const subtotalCarrinho = computed(() =>
    arredondar(carrinho.value.reduce((soma, item) => soma + item.quantidade * item.precoUnitario, 0)),
  )
  const descontoCarrinho = computed(() =>
    arredondar(carrinho.value.reduce((soma, item) => soma + item.descontoPromo + item.descontoManual, 0)),
  )
  const totalCarrinho = computed(() => arredondar(subtotalCarrinho.value - descontoCarrinho.value))

  /** Vendas válidas para faturamento: cancelamento não apaga histórico, mas sai das contas. */
  const vendasValidas = computed(() => vendas.value.filter((v) => v.estado !== 'CANCELADA'))

  const devolucoesDinheiro = computed(() =>
    arredondar(
      devolucoes.value.reduce((soma, dev) => {
        const venda = vendas.value.find((v) => v.id === dev.vendaId)
        if (!venda || venda.estado === 'CANCELADA') return soma
        if (venda.pagamento.forma === 'DINHEIRO') return soma + dev.valorTotal
        // Dividido: reembolsa na proporção paga em dinheiro
        if (venda.pagamento.forma === 'DIVIDIDO' && venda.total > 0) {
          return soma + arredondar((dev.valorTotal * venda.valorDinheiro) / venda.total)
        }
        return soma
      }, 0),
    ),
  )

  const esperadoDinheiro = computed(() => {
    if (!turno.value) return 0
    const entradas = arredondar(vendasValidas.value.reduce((soma, v) => soma + v.valorDinheiro, 0))
    const sangrias = movimentos.value
      .filter((mov) => mov.tipo === 'SANGRIA')
      .reduce((soma, mov) => soma + mov.valor, 0)
    const suprimentos = movimentos.value
      .filter((mov) => mov.tipo === 'SUPRIMENTO')
      .reduce((soma, mov) => soma + mov.valor, 0)
    return arredondar(turno.value.valorInicial + entradas + suprimentos - sangrias - devolucoesDinheiro.value)
  })

  const vendasPendentesSinc = computed(() => vendas.value.filter((v) => !v.sincronizada).length)
  const faturamentoTurno = computed(() => arredondar(vendasValidas.value.reduce((soma, v) => soma + v.total, 0)))
  const ticketMedio = computed(() =>
    vendasValidas.value.length > 0 ? arredondar(faturamentoTurno.value / vendasValidas.value.length) : 0,
  )
  const fiadoTurno = computed(() => arredondar(vendasValidas.value.reduce((soma, v) => soma + v.valorFiado, 0)))
  const kgVendidosTurno = computed(() =>
    arredondar(
      vendasValidas.value
        .flatMap((v) => v.itens)
        .filter((item) => item.unidade === 'KG')
        .reduce((soma, item) => soma + item.quantidade, 0),
    ),
  )

  const alertasValidade = computed<AlertaValidade[]>(() => {
    const hoje = hojeISO()
    const alertas: AlertaValidade[] = []
    for (const produto of produtos.value) {
      for (const lote of produto.lotes) {
        if (lote.estado !== 'LIBERADO' || lote.quantidade <= 0) continue
        const dias = diasParaVencer(lote.validade, hoje)
        if (dias < 0 || loteVencido(lote, hoje)) {
          alertas.push({ produtoId: produto.id, produto: produto.nome, lote: lote.lote, quantidade: lote.quantidade, dias, tipo: 'vencido' })
        } else if (dias <= 3) {
          alertas.push({ produtoId: produto.id, produto: produto.nome, lote: lote.lote, quantidade: lote.quantidade, dias, tipo: 'proximo' })
        }
      }
    }
    return alertas.sort((a, b) => a.dias - b.dias)
  })

  const reposicoes = computed<ReposicaoSugerida[]>(() =>
    produtos.value
      .map((produto) => ({
        produtoId: produto.id,
        produto: produto.nome,
        unidade: produto.unidade === 'KG' ? 'kg' : 'un',
        ...sugestaoReposicao(produto),
      }))
      .filter((item) => item.atual <= item.minimo),
  )

  function abrirTurno(valorInicial: number, operador: string): void {
    turno.value = {
      id: `turno-${crypto.randomUUID()}`,
      operador,
      terminal: 'Caixa 01',
      abertoEm: new Date().toISOString(),
      valorInicial: arredondar(valorInicial),
      estado: 'ABERTO',
    }
  }

  function buscarProdutos(termo: string): ProdutoMercado[] {
    const busca = termo.trim().toLowerCase()
    if (!busca) return produtos.value
    return produtos.value.filter(
      (p) =>
        p.nome.toLowerCase().includes(busca) ||
        p.codigoBarras?.includes(busca) ||
        p.plu === busca ||
        p.categoria.toLowerCase().includes(busca),
    )
  }

  function encontrarLote(produto: ProdutoMercado, lote: string) {
    return produto.lotes.find((l) => l.lote === lote)
  }

  function adicionarProduto(produtoId: string, quantidade: number): void {
    if (!turnoAberto.value) throw new Error('Abra o turno antes de vender.')
    const produto = produtos.value.find((p) => p.id === produtoId)
    if (!produto) throw new Error('Produto não encontrado.')
    if (!(quantidade > 0)) throw new Error('Informe quantidade ou peso maior que zero.')
    const hoje = hojeISO()
    const lote = loteParaVenda(produto, hoje)
    if (!lote) throw new Error(bloqueioDeVenda(produto, hoje) ?? 'Produto indisponível.')
    if (quantidade > lote.quantidade) {
      throw new Error(`Estoque insuficiente no lote ${lote.lote} (disponível: ${lote.quantidade}).`)
    }

    const existente = carrinho.value.find((item) => item.produtoId === produtoId && item.lote === lote.lote)
    const quantidadeFinal = arredondar((existente?.quantidade ?? 0) + quantidade)
    if (quantidadeFinal > lote.quantidade + (existente?.quantidade ?? 0)) {
      throw new Error(`Estoque insuficiente no lote ${lote.lote}.`)
    }
    const promo = promocaoDoItem(produto, lote, quantidadeFinal, promocoes.value, hoje)
    const descontoPromo = promo ? arredondar(quantidadeFinal * produto.preco * (promo.percentual / 100)) : 0

    lote.quantidade = arredondar(lote.quantidade - quantidade)
    if (existente) {
      existente.quantidade = quantidadeFinal
      existente.descontoPromo = descontoPromo
      existente.descricaoPromo = promo?.descricao
    } else {
      const comercial = resolverGrupoComercial(produto)
      carrinho.value.push({
        produtoId: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        grupo: comercial.grupo,
        subgrupo: comercial.subgrupo,
        custoUnitario: produto.custoMedio,
        unidade: produto.unidade,
        quantidade,
        precoUnitario: produto.preco,
        descontoPromo,
        descontoManual: 0,
        descricaoPromo: promo?.descricao,
        lote: lote.lote,
        validade: lote.validade,
      })
    }
  }

  function removerItem(indice: number): void {
    const item = carrinho.value[indice]
    if (!item) return
    const produto = produtos.value.find((p) => p.id === item.produtoId)
    const lote = produto && encontrarLote(produto, item.lote)
    if (lote) lote.quantidade = arredondar(lote.quantidade + item.quantidade)
    carrinho.value.splice(indice, 1)
  }

  function aplicarDescontoManual(indice: number, percentual: number, motivo: string): void {
    const item = carrinho.value[indice]
    if (!item) return
    if (!(percentual > 0 && percentual <= 100)) throw new Error('Percentual deve estar entre 0 e 100.')
    if (!motivo.trim()) throw new Error('Desconto manual exige motivo.')
    const base = arredondar(item.quantidade * item.precoUnitario - item.descontoPromo)
    item.descontoManual = arredondar(base * (percentual / 100))
    item.motivoDesconto = motivo.trim()
  }

  function suspenderVenda(rotulo: string): void {
    if (carrinho.value.length === 0) throw new Error('Carrinho vazio — nada para suspender.')
    suspensas.value.unshift({
      id: `susp-${crypto.randomUUID()}`,
      rotulo: rotulo.trim() || `Venda ${suspensas.value.length + 1}`,
      itens: clonar(carrinho.value),
      criadaEm: new Date().toISOString(),
    })
    carrinho.value = []
  }

  function retomarSuspensa(id: string): void {
    const indice = suspensas.value.findIndex((s) => s.id === id)
    if (indice === -1) return
    if (carrinho.value.length > 0) throw new Error('Finalize ou suspenda o carrinho atual antes de retomar.')
    const [suspensa] = suspensas.value.splice(indice, 1)
    carrinho.value = suspensa.itens
  }

  /** Aplica a parte fiada (à vista ou em parcela) e retorna o valor fiado. */
  function aplicarFiado(clienteId: string | undefined, valor: number): { valorFiado: number; clienteNome: string } {
    const cliente = clientes.value.find((c) => c.id === clienteId)
    if (!cliente) throw new Error('Selecione o cliente do fiado.')
    if (!podeVenderFiado(cliente, valor)) {
      throw new Error(`${cliente.nome} não tem limite para esta venda.`)
    }
    cliente.saldo = arredondar(cliente.saldo + valor)
    return { valorFiado: valor, clienteNome: cliente.nome }
  }

  function finalizarVenda(pagamento: PagamentoVenda): Venda {
    if (!turnoAberto.value || !turno.value) throw new Error('Abra o turno antes de vender.')
    if (carrinho.value.length === 0) throw new Error('Carrinho vazio.')
    const total = totalCarrinho.value
    let valorDinheiro = 0
    let valorFiado = 0

    if (pagamento.forma === 'FIADO') {
      const aplicado = aplicarFiado(pagamento.clienteId, total)
      valorFiado = aplicado.valorFiado
      pagamento.clienteNome = aplicado.clienteNome
    } else if (pagamento.forma === 'DINHEIRO') {
      if ((pagamento.valorRecebido ?? 0) < total) throw new Error('Valor recebido menor que o total.')
      valorDinheiro = total
    } else if (pagamento.forma === 'DIVIDIDO') {
      const parcelas = pagamento.parcelas ?? []
      if (parcelas.length < 2) throw new Error('Pagamento dividido exige ao menos 2 parcelas.')
      const soma = arredondar(parcelas.reduce((acc, p) => acc + p.valor, 0))
      if (Math.abs(soma - total) > 0.005) throw new Error('Parcelas não somam o total da venda.')
      for (const parcela of parcelas) {
        if (!(parcela.valor > 0)) throw new Error('Toda parcela deve ter valor maior que zero.')
        if (parcela.forma === 'DINHEIRO') valorDinheiro = arredondar(valorDinheiro + parcela.valor)
        if (parcela.forma === 'FIADO') {
          const aplicado = aplicarFiado(parcela.clienteId ?? pagamento.clienteId, parcela.valor)
          valorFiado = arredondar(valorFiado + aplicado.valorFiado)
          parcela.clienteNome = aplicado.clienteNome
        }
      }
      if (pagamento.valorRecebido !== undefined && pagamento.valorRecebido < valorDinheiro) {
        throw new Error('Valor recebido em dinheiro menor que a parte em dinheiro.')
      }
    }

    const itensComSnapshot = clonar(carrinho.value).map((item) => {
      const produto = produtos.value.find((p) => p.id === item.produtoId)
      const comercial = produto ? resolverGrupo(produto) : null
      return {
        ...item,
        categoria: item.categoria ?? produto?.categoria,
        grupo: item.grupo ?? comercial?.grupo ?? 'Geral',
        subgrupo: item.subgrupo ?? comercial?.subgrupo ?? 'Geral',
        custoUnitario: item.custoUnitario ?? produto?.custoMedio ?? 0,
      }
    })

    const venda: Venda = {
      id: `venda-${crypto.randomUUID()}`,
      numero: proximoNumero.value++,
      itens: itensComSnapshot,
      subtotal: subtotalCarrinho.value,
      descontoTotal: descontoCarrinho.value,
      total,
      pagamento: { ...pagamento },
      valorDinheiro,
      valorFiado,
      operador: turno.value.operador,
      terminal: turno.value.terminal,
      criadaEm: new Date().toISOString(),
      sincronizada: online.value,
      estado: 'CONCLUIDA',
      reimpressoes: 0,
    }
    vendas.value.unshift(venda)
    for (const item of venda.itens) {
      const produto = produtos.value.find((p) => p.id === item.produtoId)
      lancarNoLivro('venda', {
        produtoId: item.produtoId,
        produto: item.nome,
        lote: item.lote,
        quantidade: -Math.round(item.quantidade * 1000) / 1000,
        custoUnitario: produto?.custoMedio,
        motivo: `Venda #${venda.numero} · ${venda.pagamento.forma}`,
        operador: venda.operador,
        referencia: `venda-${venda.numero}`,
      })
    }
    auditarEvento('venda', `Venda #${venda.numero} · ${venda.pagamento.forma} · ${venda.total}`, venda.operador)
    carrinho.value = []
    return venda
  }

  /**
   * Cancela venda concluída sem devolução: motivo obrigatório, estoque volta
   * ao lote original e fiado é estornado. Histórico preservado.
   */
  function cancelarVenda(vendaId: string, motivo: string, operador: string): Venda {
    const venda = vendas.value.find((v) => v.id === vendaId)
    if (!venda) throw new Error('Venda não encontrada.')
    if (venda.estado !== 'CONCLUIDA') throw new Error('Só é possível cancelar venda concluída sem devolução.')
    if (!motivo.trim()) throw new Error('Cancelamento exige motivo.')
    if (!operador.trim()) throw new Error('Operador é obrigatório para auditoria.')

    for (const item of venda.itens) {
      const produto = produtos.value.find((p) => p.id === item.produtoId)
      const lote = produto && encontrarLote(produto, item.lote)
      if (lote) lote.quantidade = arredondar(lote.quantidade + item.quantidade)
      lancarNoLivro('cancelamento', {
        produtoId: item.produtoId,
        produto: item.nome,
        lote: item.lote,
        quantidade: Math.round(item.quantidade * 1000) / 1000,
        motivo: `Cancelamento venda #${venda.numero}: ${motivo.trim()}`,
        operador: operador.trim(),
        referencia: `venda-${venda.numero}`,
      })
    }
    if (venda.valorFiado > 0) {
      const clienteId = venda.pagamento.clienteId ?? venda.pagamento.parcelas?.find((p) => p.forma === 'FIADO')?.clienteId
      const cliente = clientes.value.find((c) => c.id === clienteId)
      if (cliente) cliente.saldo = arredondar(Math.max(0, cliente.saldo - venda.valorFiado))
    }
    venda.estado = 'CANCELADA'
    venda.canceladaEm = new Date().toISOString()
    venda.motivoCancelamento = motivo.trim()
    venda.canceladaPor = operador.trim()
    auditarEvento('cancelamento', `Venda #${venda.numero} cancelada: ${motivo.trim()}`, operador.trim())
    return venda
  }

  /** Reimpressão do cupom — conta quantas vezes para auditoria. */
  function registrarReimpressao(vendaId: string): void {
    const venda = vendas.value.find((v) => v.id === vendaId)
    if (!venda) throw new Error('Venda não encontrada.')
    venda.reimpressoes = (venda.reimpressoes ?? 0) + 1
    auditarEvento('reimpressao', `Cupom venda #${venda.numero} reimpresso (${venda.reimpressoes}x)`, venda.operador)
  }

  // --- Estoque dedicado: transferências, inventário, fornecedores, pedidos ---

  function resolverGrupoComercial(produto: ProdutoMercado): { grupo: string; subgrupo: string } {
    return resolverGrupo(produto)
  }

  function linhaLote(produtoId: string, loteCodigo: string, local: string) {
    const produto = produtos.value.find((p) => p.id === produtoId)
    const linha = produto?.lotes.find((l) => l.lote === loteCodigo && localDoLote(l) === local)
    if (!produto || !linha) throw new Error('Linha de estoque (produto/lote/local) não encontrada.')
    return { produto, linha }
  }

  /**
   * Transfere quantidade entre locais (câmara → balcão, loja → depósito…).
   * Quantidade parcial divide a linha do lote; auditoria com motivo.
   */
  function transferirEstoque(
    produtoId: string,
    loteCodigo: string,
    origem: string,
    destino: string,
    quantidade: number,
    motivo: string,
    operador: string,
  ): TransferenciaEstoque {
    if (origem === destino) throw new Error('Origem e destino devem ser diferentes.')
    if (!(quantidade > 0)) throw new Error('Quantidade deve ser maior que zero.')
    if (!motivo.trim() || !operador.trim()) throw new Error('Motivo e operador são obrigatórios.')
    const { produto, linha } = linhaLote(produtoId, loteCodigo, origem)
    if (quantidade > linha.quantidade) throw new Error(`Saldo insuficiente em ${origem} (${linha.quantidade}).`)
    linha.quantidade = arredondar(linha.quantidade - quantidade)
    let destinoLinha = produto.lotes.find((l) => l.lote === loteCodigo && localDoLote(l) === destino)
    if (!destinoLinha) {
      destinoLinha = { lote: linha.lote, validade: linha.validade, quantidade: 0, estado: linha.estado, local: destino }
      produto.lotes.push(destinoLinha)
    }
    destinoLinha.quantidade = arredondar(destinoLinha.quantidade + quantidade)
    const transferencia: TransferenciaEstoque = {
      id: `tr-${crypto.randomUUID()}`,
      produtoId,
      produto: produto.nome,
      lote: loteCodigo,
      origem,
      destino,
      quantidade,
      motivo: motivo.trim(),
      operador: operador.trim(),
      criadaEm: new Date().toISOString(),
    }
    transferencias.value.unshift(transferencia)
    lancarNoLivro('transferencia', {
      produtoId,
      produto: produto.nome,
      lote: loteCodigo,
      quantidade: Math.round(quantidade * 1000) / 1000,
      motivo: `${origem} → ${destino}: ${motivo.trim()}`,
      operador: operador.trim(),
      referencia: transferencia.id,
    })
    auditarEvento('transferencia', `${produto.nome} ${origem} → ${destino}`, operador.trim())
    return transferencia
  }

  /** Contagem cega: registra o contado; divergência aguarda aprovação. */
  function registrarContagem(
    produtoId: string,
    loteCodigo: string,
    local: string,
    contado: number,
    motivo: string,
    operador: string,
  ): ContagemEstoque {
    if (!(contado >= 0)) throw new Error('Contado deve ser zero ou maior.')
    if (!operador.trim()) throw new Error('Operador é obrigatório.')
    const { produto, linha } = linhaLote(produtoId, loteCodigo, local)
    const sistema = linha.quantidade
    const diferenca = arredondar(contado - sistema)
    const contagem: ContagemEstoque = {
      id: `cg-${crypto.randomUUID()}`,
      produtoId,
      produto: produto.nome,
      lote: loteCodigo,
      local,
      contado,
      sistema,
      diferenca,
      motivo: motivo.trim() || 'Contagem cíclica',
      operador: operador.trim(),
      status: diferenca === 0 ? 'aprovada' : 'pendente',
      criadaEm: new Date().toISOString(),
    }
    contagens.value.unshift(contagem)
    auditarEvento('contagem', `Contagem ${produto.nome} lote ${loteCodigo}: sistema ${sistema} × contado ${contado}`, operador.trim())
    return contagem
  }

  /** Aprova divergência de contagem e ajusta o saldo (nunca abaixo de zero). */
  function aprovarContagem(contagemId: string, aprovador: string): ContagemEstoque {
    const contagem = contagens.value.find((c) => c.id === contagemId)
    if (!contagem) throw new Error('Contagem não encontrada.')
    if (contagem.status !== 'pendente') throw new Error('Contagem já aprovada.')
    if (!aprovador.trim()) throw new Error('Aprovador é obrigatório.')
    const { linha } = linhaLote(contagem.produtoId, contagem.lote, contagem.local)
    linha.quantidade = arredondar(Math.max(0, linha.quantidade + contagem.diferenca))
    contagem.status = 'aprovada'
    contagem.aprovador = aprovador.trim()
    lancarNoLivro('ajuste', {
      produtoId: contagem.produtoId,
      produto: contagem.produto,
      lote: contagem.lote,
      quantidade: Math.round(contagem.diferenca * 1000) / 1000,
      motivo: `Ajuste por contagem ${contagem.id}: ${contagem.motivo}`,
      operador: aprovador.trim(),
      referencia: contagem.id,
    })
    auditarEvento('ajuste', `Contagem ${contagem.id} aprovada (${contagem.diferenca})`, aprovador.trim())
    return contagem
  }

  function cadastrarFornecedor(dados: { nome: string; contato?: string; leadTimeDias?: number; pedidoMinimo?: number }): Fornecedor {
    const nome = dados.nome.trim()
    if (!nome) throw new Error('Nome do fornecedor é obrigatório.')
    if (fornecedores.value.some((f) => f.nome.toLowerCase() === nome.toLowerCase())) {
      throw new Error('Fornecedor já cadastrado.')
    }
    const fornecedor: Fornecedor = {
      id: `for-${crypto.randomUUID()}`,
      nome,
      contato: dados.contato?.trim() || undefined,
      leadTimeDias: dados.leadTimeDias,
      pedidoMinimo: dados.pedidoMinimo,
      criadoEm: new Date().toISOString(),
    }
    fornecedores.value.push(fornecedor)
    return fornecedor
  }

  function criarPedido(
    fornecedorId: string,
    itens: ItemPedidoCompra[],
    operador: string,
    entregaPrevista?: string,
  ): PedidoCompra {
    const fornecedor = fornecedores.value.find((f) => f.id === fornecedorId)
    if (!fornecedor) throw new Error('Fornecedor não encontrado.')
    const validos = itens.filter((i) => i.quantidade > 0)
    if (validos.length === 0) throw new Error('Pedido precisa de ao menos um item com quantidade.')
    for (const item of validos) {
      if (!produtos.value.some((p) => p.id === item.produtoId)) throw new Error(`Produto ${item.produto} não existe.`)
    }
    const pedido: PedidoCompra = {
      id: `ped-${crypto.randomUUID()}`,
      numero: proximoPedido.value++,
      fornecedorId,
      fornecedor: fornecedor.nome,
      itens: validos.map((i) => ({ ...i, quantidade: arredondar(i.quantidade) })),
      valorTotal: arredondar(validos.reduce((soma, i) => soma + i.quantidade * i.custoUnitario, 0)),
      status: 'aberto',
      entregaPrevista,
      operador,
      criadoEm: new Date().toISOString(),
    }
    pedidos.value.unshift(pedido)
    return pedido
  }

  function atualizarStatusPedido(pedidoId: string, status: StatusPedido): void {
    const pedido = pedidos.value.find((p) => p.id === pedidoId)
    if (!pedido) throw new Error('Pedido não encontrado.')
    pedido.status = status
  }

  /** Gera pedido a partir da sugestão de reposição (itens abaixo do mínimo). */
  function criarPedidoDeReposicao(fornecedorId: string, operador: string): PedidoCompra {
    const itens: ItemPedidoCompra[] = reposicoes.value
      .filter((r) => {
        const produto = produtos.value.find((p) => p.id === r.produtoId)
        const fornecedor = fornecedores.value.find((f) => f.id === fornecedorId)
        return produto && fornecedor && produto.fornecedor === fornecedor.nome && r.sugestao > 0
      })
      .map((r) => {
        const produto = produtos.value.find((p) => p.id === r.produtoId)
        return { produtoId: r.produtoId, produto: r.produto, quantidade: r.sugestao, custoUnitario: produto?.custoMedio ?? 0 }
      })
    if (itens.length === 0) throw new Error('Sem itens de reposição para este fornecedor.')
    return criarPedido(fornecedorId, itens, operador)
  }

  /** Recall por lote: estoque por local + vendas afetadas. */
  function rastroDoLote(codigo: string): RastroLote {
    const busca = codigo.trim()
    if (!busca) throw new Error('Informe o lote.')
    const achado = produtos.value
      .map((produto) => ({ produto, linhas: produto.lotes.filter((l) => l.lote === busca) }))
      .find((r) => r.linhas.length > 0)
    const vendasAfetadas = vendas.value
      .filter((v) => v.itens.some((item) => item.lote === busca))
      .map((v) => ({
        numero: v.numero,
        criadaEm: v.criadaEm,
        operador: v.operador,
        clienteNome: v.pagamento.clienteNome,
        quantidade: arredondar(v.itens.filter((item) => item.lote === busca).reduce((soma, i) => soma + i.quantidade, 0)),
      }))
    return {
      produto: achado?.produto.nome,
      validade: achado?.linhas[0]?.validade,
      estoquePorLocal: (achado?.linhas ?? []).map((l) => ({ local: localDoLote(l), quantidade: l.quantidade, estado: l.estado })),
      vendas: vendasAfetadas,
    }
  }

  function registrarMovimento(tipo: TipoMovimentoCaixa, valor: number, motivo: string): void {
    if (!turnoAberto.value) throw new Error('Abra o turno primeiro.')
    if (!(valor > 0)) throw new Error('Informe um valor maior que zero.')
    if (!motivo.trim()) throw new Error('Informe o motivo.')
    movimentos.value.unshift({
      id: `mov-${crypto.randomUUID()}`,
      tipo,
      valor: arredondar(valor),
      motivo: motivo.trim(),
      criadoEm: new Date().toISOString(),
    })
  }

  function devolver(
    vendaId: string,
    itens: Array<{ produtoId: string; quantidade: number }>,
    motivo: string,
    destino: DestinoDevolucao,
    operador: string,
  ): Devolucao {
    const venda = vendas.value.find((v) => v.id === vendaId)
    if (!venda) throw new Error('Venda não encontrada.')
    if (!motivo.trim()) throw new Error('Devolução exige motivo.')
    const mapa = (devolvidos.value[vendaId] ??= {})
    const itensDevolvidos: Devolucao['itens'] = []

    for (const pedido of itens) {
      if (!(pedido.quantidade > 0)) continue
      const original = venda.itens.find((item) => item.produtoId === pedido.produtoId)
      if (!original) throw new Error('Item não pertence a esta venda.')
      const jaDevolvido = mapa[pedido.produtoId] ?? 0
      if (jaDevolvido + pedido.quantidade > original.quantidade) {
        throw new Error(`Quantidade devolvida de ${original.nome} excede o vendido.`)
      }
      mapa[pedido.produtoId] = arredondar(jaDevolvido + pedido.quantidade)
      const valorUnitario = arredondar(subtotalItem(original.quantidade, original.precoUnitario, original.descontoPromo, original.descontoManual) / original.quantidade)
      itensDevolvidos.push({
        produtoId: original.produtoId,
        nome: original.nome,
        quantidade: pedido.quantidade,
        valor: arredondar(valorUnitario * pedido.quantidade),
        destino,
      })
      if (destino === 'VENDAVEL') {
        const produto = produtos.value.find((p) => p.id === original.produtoId)
        const lote = produto && (encontrarLote(produto, original.lote) ?? produto.lotes[0])
        if (lote) lote.quantidade = arredondar(lote.quantidade + pedido.quantidade)
        lancarNoLivro('devolucao', {
          produtoId: original.produtoId,
          produto: original.nome,
          lote: original.lote,
          quantidade: Math.round(pedido.quantidade * 1000) / 1000,
          motivo: `Devolução venda #${venda.numero} → ${destino}: ${motivo.trim()}`,
          operador,
          referencia: `venda-${venda.numero}`,
        })
      } else {
        auditarEvento('devolucao', `Devolução venda #${venda.numero} → ${destino}: ${motivo.trim()} (sem retorno ao saldo)`, operador)
      }
    }
    if (itensDevolvidos.length === 0) throw new Error('Informe ao menos um item para devolver.')

    const devolucao: Devolucao = {
      id: `dev-${crypto.randomUUID()}`,
      vendaId,
      numeroVenda: venda.numero,
      itens: itensDevolvidos,
      motivo: motivo.trim(),
      valorTotal: arredondar(itensDevolvidos.reduce((soma, item) => soma + item.valor, 0)),
      operador,
      criadaEm: new Date().toISOString(),
    }
    devolucoes.value.unshift(devolucao)

    const totalVendido = venda.itens.reduce((soma, item) => soma + item.quantidade, 0)
    const totalDevolvido = Object.values(mapa).reduce((soma, qtd) => soma + qtd, 0)
    venda.estado = totalDevolvido >= totalVendido ? 'DEVOLVIDA_TOTAL' : 'DEVOLVIDA_PARCIAL'
    auditarEvento('devolucao', `Devolução venda #${venda.numero}: ${motivo.trim()}`, operador)
    return devolucao
  }

  function alternarOnline(): void {
    online.value = !online.value
    if (online.value) {
      for (const venda of vendas.value) venda.sincronizada = true
    }
  }

  function fecharTurno(valorContado: number, aprovador?: string): TurnoCaixa {
    if (!turno.value || !turnoAberto.value) throw new Error('Nenhum turno aberto.')
    const esperado = esperadoDinheiro.value
    const diferenca = arredondar(valorContado - esperado)
    if (Math.abs(diferenca) > LIMITE_DIVERGENCIA_CAIXA && !aprovador) {
      throw new Error(`Divergência de ${diferenca} acima do limite — chame Proprietário ou Administrador.`)
    }
    turno.value.estado = 'FECHADO'
    turno.value.fechadoEm = new Date().toISOString()
    turno.value.valorContado = arredondar(valorContado)
    turno.value.diferenca = diferenca
    if (aprovador) turno.value.aprovadorDivergencia = aprovador
    return turno.value
  }

  function novoTurno(): void {
    turno.value = null
    movimentos.value = []
    carrinho.value = []
    suspensas.value = []
    vendas.value = []
    devolucoes.value = []
    devolvidos.value = {}
    proximoNumero.value = 1
    // Catálogo local persiste entre turnos; só zera saldos de fiado demo.
    clientes.value = clonar(CLIENTES_FIADO_MOCK)
  }

  // --- Administração (Proprietário/Administrador) ---

  /** Caixa bipou um EAN válido que não existe no catálogo: pede cadastro assistido. */
  function solicitarCadastroEan(codigo: string): void {
    eanParaCadastrar.value = codigo.trim()
  }

  /** Catálogo consome o pedido (abre o formulário pré-preenchido). */
  function consumirEanParaCadastrar(): string | null {
    const codigo = eanParaCadastrar.value
    eanParaCadastrar.value = null
    return codigo
  }

  function cadastrarProduto(dados: DadosNovoProduto, operador: string): ProdutoMercado {
    const nome = dados.nome.trim()
    if (!nome) throw new Error('Nome do produto é obrigatório.')
    if (!(dados.preco > 0)) throw new Error('Preço deve ser maior que zero.')
    if (!(dados.custoMedio >= 0)) throw new Error('Custo médio inválido.')
    if (!operador.trim()) throw new Error('Operador é obrigatório para auditoria.')

    const codigoBarras = dados.codigoBarras?.trim() || undefined
    if (codigoBarras) {
      const interpretado = interpretarCodigo(codigoBarras)
      if (!interpretado.valido) throw new Error(`Código inválido: ${interpretado.rotulo}.`)
      if (interpretado.classe !== 'gtin-brasil' && interpretado.classe !== 'gtin-externo') {
        throw new Error('Cadastro exige GTIN-13 (EAN-13) válido — etiqueta de balança e PLU entram nos campos próprios.')
      }
      if (!validarEAN13(codigoBarras)) throw new Error('Dígito verificador do EAN-13 não confere.')
      if (produtos.value.some((p) => p.codigoBarras === codigoBarras)) {
        throw new Error('Este código de barras já está cadastrado.')
      }
    }
    const plu = dados.plu?.trim() || undefined
    if (plu) {
      if (!/^\d{1,6}$/.test(plu)) throw new Error('PLU deve ter de 1 a 6 dígitos.')
      if (produtos.value.some((p) => p.plu === plu)) throw new Error('Este PLU já está cadastrado.')
    }
    if (!codigoBarras && !plu) throw new Error('Informe ao menos EAN-13 ou PLU para identificar o produto no caixa.')

    const id = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || `produto-${crypto.randomUUID()}`
    if (produtos.value.some((p) => p.id === id)) throw new Error('Já existe um produto com nome equivalente.')

    const categoria = dados.categoria.trim() || 'Geral'
    const comercial = resolverGrupo({
      id,
      nome,
      categoria,
      grupo: dados.grupo?.trim() || undefined,
      subgrupo: dados.subgrupo?.trim() || undefined,
    })
    const produto: ProdutoMercado = {
      id,
      nome,
      categoria,
      grupo: comercial.grupo,
      subgrupo: comercial.subgrupo,
      unidade: dados.unidade,
      preco: arredondar(dados.preco),
      custoMedio: arredondar(dados.custoMedio),
      margemAlvo: 0.3,
      fornecedor: dados.fornecedor?.trim() || 'A definir',
      ativo: true,
      codigoBarras,
      plu,
      estoqueMinimo: Math.max(0, dados.estoqueMinimo),
      estoqueAlvo: Math.max(0, dados.estoqueAlvo),
      lotes: [],
    }
    produtos.value.push(produto)
    return produto
  }

  function ajustarPreco(produtoId: string, novoPreco: number, operador: string): void {
    const produto = produtos.value.find((p) => p.id === produtoId)
    if (!produto) throw new Error('Produto não encontrado.')
    if (!(novoPreco > 0)) throw new Error('Preço deve ser maior que zero.')
    if (!operador.trim()) throw new Error('Operador é obrigatório para auditoria.')
    const antes = produto.preco
    produto.preco = arredondar(novoPreco)
    auditarEvento('preco', `${produto.nome}: ${antes} → ${produto.preco}`, operador.trim())
  }

  function alternarPromocao(promocaoId: string): void {
    const promocao = promocoes.value.find((p) => p.id === promocaoId)
    if (!promocao) throw new Error('Promoção não encontrada.')
    promocao.ativa = !promocao.ativa
  }

  function criarPromocao(dados: Omit<Promocao, 'id'>): Promocao {
    if (!(dados.percentual > 0 && dados.percentual <= 100)) throw new Error('Percentual deve estar entre 0 e 100.')
    if (!dados.descricao.trim()) throw new Error('Descrição é obrigatória.')
    const promocao: Promocao = { ...dados, id: `promo-${crypto.randomUUID()}` }
    promocoes.value.unshift(promocao)
    return promocao
  }

  function registrarPerda(
    produtoId: string,
    quantidade: number,
    motivo: MotivoPerdaMercado,
    responsavel: string,
  ): PerdaMercado {
    const produto = produtos.value.find((p) => p.id === produtoId)
    if (!produto) throw new Error('Produto não encontrado.')
    if (!(quantidade > 0)) throw new Error('Quantidade deve ser maior que zero.')
    const hoje = hojeISO()
    const lote = loteParaVenda(produto, hoje) ?? produto.lotes.find((l) => l.quantidade > 0)
    if (!lote) throw new Error('Sem lote com estoque para dar baixa.')
    if (quantidade > lote.quantidade) throw new Error(`Estoque insuficiente no lote ${lote.lote}.`)
    lote.quantidade = arredondar(lote.quantidade - quantidade)
    const perda: PerdaMercado = {
      id: `perda-${crypto.randomUUID()}`,
      produtoId,
      produto: produto.nome,
      lote: lote.lote,
      quantidade,
      valor: arredondar(quantidade * (produto.custoMedio || 0)),
      motivo,
      responsavel,
      criadaEm: new Date().toISOString(),
    }
    perdas.value.unshift(perda)
    lancarNoLivro('perda', {
      produtoId,
      produto: produto.nome,
      lote: lote.lote,
      quantidade: -Math.round(quantidade * 1000) / 1000,
      custoUnitario: produto.custoMedio,
      motivo: `Perda (${motivo}) — ${responsavel}`,
      operador: responsavel,
      referencia: perda.id,
    })
    auditarEvento('perda', `Perda ${produto.nome} lote ${lote.lote}: ${motivo}`, responsavel)
    return perda
  }

  function registrarRecebimento(dados: {
    fornecedor: string
    produtoId: string
    quantidade: number
    custoUnitario: number
    lote: string
    validade: string
    temperatura?: number
    divergencia?: string
    pedidoId?: string
    operador?: string
  }): RecebimentoMercado {
    const produto = produtos.value.find((p) => p.id === dados.produtoId)
    if (!produto) throw new Error('Produto não encontrado.')
    if (!(dados.quantidade > 0)) throw new Error('Quantidade deve ser maior que zero.')
    if (!dados.lote.trim() || !dados.validade) throw new Error('Lote e validade são obrigatórios.')
    if (dados.temperatura !== undefined && (dados.temperatura < -30 || dados.temperatura > 30)) {
      throw new Error('Temperatura de recebimento fora da faixa plausível (-30 a 30°C).')
    }
    const operador = dados.operador?.trim() || 'operador'
    produto.lotes.push({
      lote: dados.lote.trim(),
      validade: dados.validade,
      quantidade: arredondar(dados.quantidade),
      estado: dados.divergencia?.trim() ? 'QUARENTENA' : 'LIBERADO',
      motivoBloqueio: dados.divergencia?.trim() || undefined,
      custoUnitario: dados.custoUnitario,
      origem: { tipo: 'compra', referencia: dados.pedidoId, fornecedor: dados.fornecedor.trim() || produto.fornecedor, responsavel: operador },
    })
    // Custo médio ponderado: recalcula a partir do estoque anterior + entrada.
    const estoqueAnterior = produto.lotes.filter((l) => l.lote !== dados.lote.trim()).reduce((s, l) => s + l.quantidade, 0)
    if (dados.custoUnitario > 0 && estoqueAnterior + dados.quantidade > 0) {
      const valorAnterior = estoqueAnterior * produto.custoMedio
      produto.custoMedio = Math.round(((valorAnterior + dados.quantidade * dados.custoUnitario) / (estoqueAnterior + dados.quantidade)) * 100) / 100
    }
    if (dados.pedidoId) {
      const pedido = pedidos.value.find((p) => p.id === dados.pedidoId)
      if (pedido) {
        const aindaFalta = pedido.itens.some((i) => i.produtoId === dados.produtoId)
        if (aindaFalta) pedido.status = 'recebido-parcial'
      }
    }
    const recebimento: RecebimentoMercado = {
      id: `rec-${crypto.randomUUID()}`,
      fornecedor: dados.fornecedor.trim() || produto.fornecedor || 'Fornecedor',
      produto: produto.nome,
      quantidade: dados.quantidade,
      custoUnitario: dados.custoUnitario,
      lote: dados.lote.trim(),
      validade: dados.validade,
      temperatura: dados.temperatura,
      divergencia: dados.divergencia?.trim() || undefined,
      criadaEm: new Date().toISOString(),
    }
    recebimentos.value.unshift(recebimento)
    lancarNoLivro('recebimento', {
      produtoId: produto.id,
      produto: produto.nome,
      lote: recebimento.lote,
      quantidade: Math.round(recebimento.quantidade * 1000) / 1000,
      custoUnitario: recebimento.custoUnitario,
      motivo: recebimento.divergencia ? `Recebimento com divergência → quarentena: ${recebimento.divergencia}` : `Recebimento ${recebimento.fornecedor}`,
      operador,
      referencia: recebimento.id,
    })
    auditarEvento('recebimento', `Recebido ${produto.nome} lote ${recebimento.lote}`, operador)
    return recebimento
  }

  /** Libera lote em quarentena após conferência. */
  function liberarQuarentena(produtoId: string, loteCodigo: string, operador: string, motivo = 'Conferência aprovada'): void {
    const produto = produtos.value.find((p) => p.id === produtoId)
    const lote = produto?.lotes.find((l) => l.lote === loteCodigo)
    if (!produto || !lote) throw new Error('Lote não encontrado.')
    if (lote.estado !== 'QUARENTENA') throw new Error('Só é possível liberar lote em quarentena.')
    if (!operador.trim()) throw new Error('Operador é obrigatório.')
    lote.estado = 'LIBERADO'
    lote.motivoBloqueio = undefined
    lancarNoLivro('liberacao_quarentena', {
      produtoId,
      produto: produto.nome,
      lote: loteCodigo,
      quantidade: Math.round(lote.quantidade * 1000) / 1000,
      motivo,
      operador: operador.trim(),
      referencia: loteCodigo,
    })
    auditarEvento('lote', `Lote ${loteCodigo} liberado da quarentena`, operador.trim())
  }

  /** Resumo operacional real do turno (vendas + perdas da sessão). */
  const resumoOperacional = computed(() => {
    const validas = vendas.value.filter((v) => v.estado !== 'CANCELADA')
    const receita = arredondar(validas.reduce((s, v) => s + v.total, 0))
    let cmv = 0
    for (const v of validas) {
      for (const item of v.itens) {
        const produto = produtos.value.find((p) => p.id === item.produtoId)
        cmv += item.quantidade * (item.custoUnitario ?? produto?.custoMedio ?? 0)
      }
    }
    cmv = arredondar(cmv)
    const desperdicio = arredondar(perdas.value.reduce((s, p) => s + p.valor, 0))
    const fiado = arredondar(validas.reduce((s, v) => s + v.valorFiado, 0))
    return { receita, cmv, margem: arredondar(receita - cmv), desperdicio, fiado, vendas: validas.length }
  })

  /** Vendas de demonstração — popula turno, livro, fiado e resumo para visualizar os gráficos. Idempotente. */
  const demoVendasCarregadas = ref(false)

  function carregarVendasDemonstracao(operador = 'demo'): Venda[] {
    if (demoVendasCarregadas.value) return vendas.value.filter((v) => v.estado !== 'CANCELADA')
    if (!turnoAberto.value) abrirTurno(200, operador)
    const criadas: Venda[] = []
    // Roteiro distribuído em horários distintos para alimentar o relatório por hora.
    const roteiro: Array<{ produtoId: string; quantidade: number; pagamento: PagamentoVenda; hora: number }> = [
      { produtoId: 'picanha', quantidade: 1.2, pagamento: { forma: 'DINHEIRO', valorRecebido: 10000 }, hora: 9 },
      { produtoId: 'fraldinha', quantidade: 2, pagamento: { forma: 'PIX' }, hora: 12 },
      { produtoId: 'carvao', quantidade: 4, pagamento: { forma: 'CARTAO' }, hora: 15 },
      { produtoId: 'ancho', quantidade: 1, pagamento: { forma: 'FIADO', clienteId: 'cli-bruno' }, hora: 18 },
    ]
    for (const passo of roteiro) {
      adicionarProduto(passo.produtoId, passo.quantidade)
      const venda = finalizarVenda(passo.pagamento)
      const base = new Date()
      base.setHours(passo.hora, 12, 0, 0)
      venda.criadaEm = base.toISOString()
      criadas.push(venda)
    }
    demoVendasCarregadas.value = true
    return criadas
  }

  return {
    produtos,
    clientes,
    promocoes,
    turno,
    movimentos,
    livro,
    eventos,
    carrinho,
    suspensas,
    vendas,
    devolucoes,
    perdas,
    recebimentos,
    transferencias,
    contagens,
    fornecedores,
    pedidos,
    eanParaCadastrar,
    catalogoPronto,
    origemCatalogo,
    online,
    turnoAberto,
    subtotalCarrinho,
    descontoCarrinho,
    totalCarrinho,
    esperadoDinheiro,
    vendasPendentesSinc,
    faturamentoTurno,
    ticketMedio,
    fiadoTurno,
    kgVendidosTurno,
    alertasValidade,
    reposicoes,
    resumoOperacional,
    demoVendasCarregadas,
    carregarVendasDemonstracao,
    abrirTurno,
    buscarProdutos,
    adicionarProduto,
    removerItem,
    aplicarDescontoManual,
    suspenderVenda,
    retomarSuspensa,
    finalizarVenda,
    cancelarVenda,
    registrarReimpressao,
    registrarMovimento,
    devolver,
    alternarOnline,
    fecharTurno,
    novoTurno,
    solicitarCadastroEan,
    consumirEanParaCadastrar,
    cadastrarProduto,
    ajustarPreco,
    alternarPromocao,
    criarPromocao,
    registrarPerda,
    registrarRecebimento,
    transferirEstoque,
    registrarContagem,
    aprovarContagem,
    cadastrarFornecedor,
    criarPedido,
    atualizarStatusPedido,
    criarPedidoDeReposicao,
    rastroDoLote,
    cadeiaCompletaDoLote,
    aplicarDesossaAoEstoque,
    aplicarMaturacaoAoEstoque,
    liberarQuarentena,
    exportarCatalogo,
    importarCatalogo,
    restaurarDemo,
  }
})
