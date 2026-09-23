# Funções Administrativas — Point Steak House (açougue/mercado, sem salão)

> **Gate de execução:** este documento define o escopo administrativo futuro.
> Até existir `controle-producao/PAGOU.md`, telas e dados permanecem em mock e
> não se deve ampliar o backend real. A exceção é somente o bip local do Mercado,
> com foco automático e confirmação como `Enter`.

> Escopo fechado: **não existe salão, cozinha, mesas, garçom ou prato preparado**.
> O negócio é um **açougue com mercado de carnes e complementos de churrasco**.
> Toda receita operacional vem da **venda de produtos do Mercado/Açougue**.
> Desossa e maturação são **transformação de estoque e formação de custo**, não cozinha.
>
> Visão gerencial — não substitui contabilidade oficial, emissão fiscal ou orientação de contador/responsável técnico.

## 1. Mapa administrativo

```text
Finanças (Proprietário, Administrador)
├── Resumo
├── DRE gerencial
├── Desperdícios
├── Lucro por item vendido
├── Contas a pagar e receber
└── Fiado (aging e cobrança)

Mercado — Administração (Proprietário, Administrador)
├── Produtos e preços
├── Recebimento
├── Estoque e lotes
├── Reposição e compras
├── Promoções e markdown
├── Perdas
├── Fiscal (central simulada)
└── Auditoria e sincronização

Administração geral
├── Usuários e cargos
├── Parâmetros financeiros
├── Parâmetros de mercado/estoque
├── Parâmetros de caixa
├── Parâmetros sanitários
├── Câmaras e equipamentos
├── Terminais e periféricos
└── Configuração fiscal do estabelecimento
```

## 2. Finanças — abas

### 2.1 Resumo

- Receita do Mercado (único canal operacional).
- Receita recebida (competência × caixa: fiado só vira caixa ao receber).
- CMV, despesas, lucro bruto, lucro líquido, margem líquida.
- Fiado em aberto, desperdício do período.
- Filtros: Hoje / 14 dias / 90 dias · Competência / Caixa.
- Sem base de receita → exibir "sem base", nunca `NaN`.

### 2.2 DRE gerencial (operação do açougue/mercado)

```text
Receita bruta do Mercado
(−) descontos, devoluções e cancelamentos
= Receita líquida
(−) CMV (custo congelado no momento da venda)
= Lucro bruto
(−) mão de obra (açougue, caixa, administração)
(−) energia elétrica (kWh)
(−) água (m³)
(−) embalagens e insumos
(−) taxas de cartão/PIX
(−) perdas e desperdícios
(−) aluguel, manutenção, impostos e outros
= Lucro líquido gerencial
```

### 2.3 Desperdícios (aba nova — adicionar informações)

Cadastro de perda com:

- produto, lote, quantidade (kg/un), custo unitário, valor da perda
- motivo: validade, deterioração, quebra de cadeia fria, erro de produção,
  excesso, desossa, maturação, devolução, dano, outros
- área: câmara, balcão, estoque, transporte
- data, responsável, observação

Indicadores:

- perda em kg e em R$
- % das compras e % da receita
- ranking de motivos e de itens
- impacto no lucro (perda entra na DRE, **não** volta como CMV)

Regra: desperdício lançado dá baixa no estoque com auditoria e alimenta o Financeiro.

### 2.4 Lucro por item vendido (aba nova)

Para cada corte/produto:

- receita, quantidade vendida
- custo médio ponderado (compra + rateio de desossa + perda de maturação)
- CMV, margem de contribuição (R$ e %)
- preço mínimo recomendado = custo / (1 − margem alvo)
- alerta de margem em risco (custo de reposição > preço de venda)
- Curva ABC por receita, volume e margem

Custo usado na venda é **congelado no momento da venda**.

### 2.5 Contas a pagar e receber (aba nova — adicionar informações)

Lançamento com:

- descrição, categoria, centro de custo, valor, competência, vencimento, pagamento
- status: previsto, a vencer, vencido, pago, cancelado (estorno auditável)
- responsável, observação, anexo (simulado)

Categorias mínimas: pessoal, energia, água, aluguel, compras de carne,
embalagens, gás/combustível, taxas financeiras, manutenção, impostos, marketing, outros.

Centros de custo do açougue: compra de carnes, desossa, maturação, embalagem,
equipamentos/câmaras, energia/água, pessoal, transporte, perdas, administração.

### 2.6 Fiado (aging e cobrança)

- Saldo inicial, novos lançamentos, recebimentos, saldo final.
- Aging: a vencer, 1–7, 8–30, 31–60, acima de 60 dias.
- % do faturamento a prazo, % de recebimento, inadimplência.
- Quitação parcial/total com extrato por cliente.
- Limite e bloqueio automático ao atingir o teto.

## 3. Parâmetros financeiros (adicionar/editar em Configurações)

| Parâmetro | Uso |
|---|---|
| Margem alvo por categoria (%) | preço mínimo e alerta de margem |
| Custos fixos mensais (R$) | ponto de equilíbrio |
| Índice de margem de contribuição | `PE = custos fixos / índice MC` |
| Regra de rateio (desossa, energia) | DRE e custo por item |
| Limite de desconto sem aprovação (%) | caixa |
| Tolerância de divergência de caixa (R$) | fechamento de turno |

## 4. Mercado — administração (evolução)

### 4.1 Produtos e preços

- nome, SKU, GTIN/EAN, PLU, categoria, marca, ativo/inativo
- unidade de compra/estoque/venda + fator de conversão
- venda por peso (kg, PLU, balança, tara) ou unidade
- preço vigente, promocional, histórico com autor e motivo
- custo médio, margem alvo (só Proprietário/Administrador com `financeiro.ver_margem`)
- estoque mínimo/máximo, validade padrão, fornecedor principal
- Caixa **nunca** edita preço na venda.

### 4.1.1 Produtos e Depósito — base de códigos brasileira

- Aba `Produtos e Depósito` no Mercado, acessível ao Caixa (consulta/bipagem);
  cadastro e preço restritos a Proprietário/Administrador.
- Catálogo: busca por nome, EAN, PLU ou fornecedor + filtro por categoria;
  detalhe por item (preço, custo/margem só com `financeiro.ver_margem`,
  padrão do código, fornecedor, estoque, lotes e validade).
- Depósito: SKUs, kg, unidades, valor em custo, valor em venda, itens abaixo
  do mínimo, lotes vencendo.
- Padrão GS1 Brasil validado localmente: EAN-13 com dígito módulo 10,
  prefixos 789/790 (registro GS1 Brasil), etiqueta de balança com prefixo 2
  (20 = preço embutido, 21–29 = peso embutido), PLU interno de 1–6 dígitos.
- Base oficial GS1 (CNP/Verified by GS1) exige associação e login — sem API
  pública gratuita. O cadastro usa a base aberta **Open Food Facts**
  (`api/v2/product/{ean}.json`, sem chave) para pré-preencher nome, marca e
  categoria de produtos embalados; carnes de balcão usam PLU. Sem rede ou sem
  resultado, o cadastro manual continua funcionando.
- **Cadastro assistido pelo leitor:** EAN válido bipado no caixa que não existe
  no catálogo mostra "Cadastrar EAN →" ao gestor; ao tocar, o app abre
  `Produtos e Depósito` com o formulário pré-preenchido e busca os dados
  externos automaticamente. Preço, custo, unidade e estoque mínimo continuam
  exigindo confirmação — nada é cadastrado silenciosamente.

### 4.2 Recebimento

- pedido esperado → bipar → conferir qtd/unidade/custo → lote/validade →
  temperatura (carnes) → avaria/divergência → quarentena → aceitar/aceitar parcial/recusar
- modo rápido e modo conferência
- divergência não altera o pedido silenciosamente

### 4.3 Estoque e lotes (livro de movimentos)

Movimentos: recebimento, venda, devolução, transferência, perda, vencimento,
ajuste, consumo interno, produção/desossa, maturação, reserva, liberação.

Lote: fornecedor, lote interno/externo, fabricação, recebimento, abertura,
validade, quantidade, custo, origem, temperatura, localização, responsável.

Estados: recebido, em conferência, liberado, quarentena, próximo do vencimento,
bloqueado, vencido, descartado, devolvido. Venda usa **FEFO** e bloqueia vencido.

### 4.4 Reposição e compras

- estoque disponível, vendas recentes, dias de cobertura, ponto de reposição,
  estoque alvo, pedido em aberto, validade mais próxima
- `sugestão = estoqueAlvo − disponível − comprasEmAberto` (evoluir para
  demanda no lead time + segurança), sempre com explicação
- separar ruptura × excesso × vencimento próximo
- fornecedor: contato, prazo, lead time, pedido mínimo, histórico de preço/atraso/qualidade

### 4.5 Promoções e markdown

Tipos: % , valor fixo, preço especial, quantidade progressiva, combo,
markdown de validade. Prioridade: preço legal → específico → promoção →
desconto autorizado → final. Markdown com antecedência configurável,
etiqueta atualizada e retirada automática ao vencer.

### 4.6 Perdas (liga Mercado × Finanças)

Registro no Mercado gera baixa de estoque + lançamento de desperdício no
Financeiro com o mesmo motivo e valor.

### 4.7 Fiscal — central simulada (sem salão)

- NFC-e modelo 65 / NF-e modelo 55 por adaptador configurável por UF
- status simples no caixa: emitindo, autorizado, contingência, pendente, chamar administrador
- central admin: autorizados, pendentes, rejeitados, contingência, motivo, reprocessar, exportar XML (simulado)
- regras fiscais **configuráveis por estabelecimento**, nunca fixas no frontend

### 4.8 Auditoria e sincronização

Eventos: venda, cancelamento, desconto, preço, gaveta, reimpressão, devolução,
estorno, sangria, suprimento, ajuste, contagem, recebimento, descarte, lote,
permissão. Cada evento: operador, data/hora, terminal, online/offline, motivo,
referência. Offline-first com fila, idempotência e painel de conflitos (simulado).

## 5. Administração geral — opções

- **Usuários:** criar, bloquear, reativar; troca de senha; logs de login.
- **Cargos e permissões:** granulares, negadas por padrão; Administrador solicita,
  Proprietário aprova com reautenticação; versionamento e auditoria.
- **Limites:** desconto, estorno, divergência de caixa, fiado.
- **Categorias financeiras e centros de custo:** criar, editar, desativar.
- **Câmaras/equipamentos:** faixa ideal de temperatura/umidade, responsável.
- **Terminais e periféricos:** caixa, balança, impressora, leitor (simulado).
- **Fiscal do estabelecimento:** UF, ambiente (homologação/produção), série,
  certificado, CSC (referência, sem segredo no frontend).
- **LGPD:** dados pessoais mínimos (nome, telefone, limite); sem PAN/CVV;
  trilha de quem acessou o quê.

## 6. Entidades (mock → backend após liberação)

```text
CategoriaFinanceira, LancamentoFinanceiro, ContaFinanceira, MovimentoDeCaixa,
TrabalhadorCusto, ContaDeEnergia, ContaDeAgua, RegistroDeDesperdicio,
RegraDeRateio, ParametroFinanceiro, ParametroMercado,
Produto, Preco, Lote, MovimentoEstoque, PedidoCompra, Recebimento,
Fornecedor, Promocao, Venda, Pagamento, TurnoCaixa, Devolucao,
DocumentoFiscal, EventoAuditoria
```

Valores monetários em centavos/`Decimal` no backend; frontend só formata BRL.

## 7. API prevista (somente após `controle-producao/PAGOU.md`)

```text
GET  /financeiro/resumo
GET  /financeiro/dre
GET  /financeiro/desperdicios
GET  /financeiro/margem-por-item
GET  /financeiro/contas
POST /financeiro/contas
POST /financeiro/contas/:id/pagar
POST /financeiro/desperdicios
GET  /financeiro/fiado-aging
GET  /financeiro/exportar
GET  /mercado/produtos  POST /mercado/produtos  PATCH /mercado/produtos/:id
POST /mercado/produtos/:id/preco
GET  /mercado/lotes  GET /mercado/alertas/validade
POST /mercado/compras  POST /mercado/compras/:id/receber
POST /mercado/perdas  POST /mercado/inventarios/contagem
POST /mercado/promocoes  PATCH /mercado/promocoes/:id
GET  /mercado/auditoria
GET  /admin/usuarios  PATCH /admin/usuarios/:id/papel
GET  /admin/cargos  POST /admin/cargos/solicitacoes
POST /admin/cargos/:id/aprovar
GET  /admin/parametros  PATCH /admin/parametros
```

## 8. Permissões por aba

| Aba | Proprietário | Administrador | Açougueiro | Caixa |
|---|---|---|---|---|
| Finanças Resumo/DRE | ✓ | ✓ | — | — |
| Desperdícios (lançar) | ✓ | ✓ | registrar perda | — |
| Lucro por item/margem | ✓ | com `financeiro.ver_margem` | — | — |
| Contas (criar/pagar) | ✓ | ✓ | — | — |
| Mercado operação | ✓ | visão | carnes | vender |
| Mercado admin | ✓ | ✓ | — | — |
| Cancelamento de venda (`caixa.estornar`) | ✓ | — | — | solicitar* |
| Usuários/cargos/parâmetros críticos | ✓ | solicitar | — | — |
| Acesso e auditoria (`/acesso`) | ✓ | solicitar/aprovar** | — | — |

\*Caixa solicita; só quem tem `caixa.estornar` confirma no histórico.
\**Administrador solicita cargos; aprovação com reautenticação é do Proprietário.

## 9. Critérios de aceite

- Nenhuma tela menciona salão, cozinha, mesa ou garçom.
- Finanças abre em abas: Resumo, DRE, Desperdícios, Lucro por item, Contas, Fiado.
- É possível adicionar: conta, desperdício, preço, promoção, perda, recebimento, parâmetro.
- Desperdício do Mercado aparece no Financeiro.
- Lucro por item mostra margem e alerta de margem em risco.
- Mercado tem área administrativa separada do caixa.
- Estoque dedicado: saldo por local, transferência auditada, contagem cíclica
  com aprovação, fornecedores, pedidos (inclusive da reposição) e recall por lote.
- Pagamento dividido soma o total; dinheiro e fiado alimentam turno e contas.
- Cancelamento exige motivo, volta estoque, estorna fiado e preserva histórico.
- Cupom exibe lote/validade, imprime e conta reimpressões.
- Modo simples (padrão) × detalhado (Proprietário, com preferência salva):
  Dashboard e Finanças mostram estado + alerta + próxima ação; detalhes por botão.
- Menu mobile em drawer, foco levado ao conteúdo a cada troca de tela.
- Tabelas rolam no celular; foco visível; `prefers-reduced-motion` respeitado;
  ações principais com toque mínimo de 44px.
- Banco local de produtos (IndexedDB com fallback em memória): catálogo
  sobrevive ao reload, persiste entre turnos, com exportar/importar JSON e
  restauração da demo. Mesclagem por versão sem apagar alterações locais.
- Testes de lógica e build de produção passam após a liberação formal.

## 10. Fontes pesquisadas

- ANVISA — RDC 216/2004 e cartilha de Boas Práticas para Serviços de Alimentação:
  higiene, armazenamento, validade, rastreabilidade e responsabilidade técnica.
- Portal Nacional da NF-e/NFC-e — manuais, DANFE, QR Code e contingência offline
  (incl. NT 2026.002 e DANFE Simplificado Tipo 2, Ajustes SINIEF 13 e 14/2026).
- SPED/EFD ICMS-IPI — escrituração de entradas/saídas (modelos 55/65) e Guia Prático.
- GS1 Brasil — GTIN/EAN, produtos de medida variável e códigos 2D no varejo.
- ANPD/LGPD — finalidade, necessidade, minimização e segurança (arts. 6º, 7º, 10, 46).
- eSocial — unificação de obrigações trabalhistas, folha e eventos por trabalhador.
- Sebrae — CMV, mark-up, margem de contribuição e ponto de equilíbrio no varejo alimentar.
- Planalto — base legal (leis ordinárias, códigos, decretos).
