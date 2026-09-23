# Mercado — planejamento profundo de UI e operação

> **Fase atual:** este é o desenho do produto-alvo. Até existir
> `controle-producao/PAGOU.md`, o Mercado permanece em mock e não deve receber
> backend real, banco, fiscal, pagamentos ou estoque persistido. A única entrega
> operacional antecipada é o bip local.

## Gate de produção

O arquivo `controle-producao/PAGOU.md` é criado manualmente após a confirmação
do pagamento. Remover a pasta `controle-producao/` bloqueia novamente a fase de
produção. O arquivo é uma trava de processo; credenciais e variáveis protegidas
da CI continuam obrigatórias.

## 1. Objetivo

Construir uma experiência de Mercado para o Point Steak House que seja rápida para o Caixa, clara para o Administrador, útil para o Açougueiro e suficientemente profunda para o Proprietário, sem reproduzir a complexidade confusa de softwares genéricos de varejo.

O Mercado deve controlar o ciclo completo:

```text
Produto → Compra → Recebimento → Lote/validade → Estoque → Exposição
→ Venda → Pagamento → Fiscal → Caixa → Reposição → Perda/retorno
```

O princípio central será:

> Cada tela deve ajudar uma pessoa a completar uma tarefa, não exibir todas as informações que o sistema conhece.

## 2. Resultado da pesquisa

### Fontes oficiais e normativas consideradas

- Portal Nacional da NF-e/NFC-e: manuais de orientação, DANFE, QR Code e contingência offline.
- Nota Técnica 2025.002-RTC e atualizações de leiaute NF-e/NFC-e para IBS, CBS e IS.
- Nota Técnica de validação de GTIN e Cadastro Centralizado de GTIN.
- ANVISA — RDC 216/2004 e Cartilha de Boas Práticas para Serviços de Alimentação.
- GS1 — GTIN, DataBar/DataMatrix e produtos de medida variável.
- PCI Security Standards Council — não armazenar dados de cartão sem necessidade e preferir terminal/provedor validado.
- LGPD/ANPD — minimização e proteção de dados pessoais.

### Fontes de prática de varejo e usabilidade

Foram consideradas pesquisas e documentação de operações de POS, inventário, perdas, caixa e usabilidade de checkout. Essas fontes servem para entender problemas operacionais; requisitos fiscais e sanitários devem sempre ser confirmados com a SEFAZ da UF e responsável técnico/contador.

## 3. O que softwares genéricos costumam fazer mal

### 3.1 Produto tratado como um simples nome e preço

Mercado precisa lidar com:

- unidade;
- caixa/fardo;
- kg, g, litro e ml;
- produto vendido por peso;
- kit e composição;
- conversão de unidade de compra para unidade de venda;
- preço por unidade e preço por medida;
- lote e validade;
- produto próprio vindo de desossa/maturação;
- produto comprado pronto.

**Decisão:** criar uma ficha de produto com unidade principal, unidades alternativas, fator de conversão, tipo de venda e regra de custo. O Caixa não deve escolher entre várias unidades técnicas durante uma venda normal.

### 3.2 Estoque teórico confundido com estoque físico

O sistema pode dizer que há produto disponível enquanto a prateleira está vazia. Isso é estoque fantasma e impede a reposição correta.

As principais causas são:

- recebimento com quantidade errada;
- venda não registrada;
- perda, roubo ou vencimento não lançado;
- contagem manual incorreta;
- transferência sem confirmação;
- devolução tratada como venda cancelada;
- unidade/caixa convertida incorretamente.

**Decisão:** estoque será um livro de movimentos. O saldo é derivado de entradas, vendas, retornos, transferências, ajustes, perdas e reservas. Ajuste direto de saldo exigirá motivo e auditoria.

### 3.3 Validade tratada como um alerta genérico

Produto perecível precisa de lote, validade, qualidade, localização e decisão operacional.

O sistema deve diferenciar:

- válido;
- próximo do vencimento;
- vencido;
- bloqueado para venda;
- em quarentena;
- descartado;
- devolvido ao fornecedor;
- liberado após conferência.

**Decisão:** usar FEFO — First Expired, First Out — para priorizar o lote que vence primeiro, sem ignorar bloqueios sanitários ou qualidade.

### 3.4 Recebimento simplificado demais

Receber uma compra não é apenas clicar em “entrada”. É conferir pedido, fornecedor, quantidade, unidade, preço, lote, validade, avaria, temperatura e divergências.

**Decisão:** o recebimento terá modo rápido e modo conferência:

- modo rápido: leitura, quantidade e confirmação;
- modo conferência: lote, validade, temperatura, divergência, foto/comprovante e quarentena.

### 3.5 Caixa sem reconciliação real

Um saldo corrente não responde:

- quem estava no turno;
- quanto iniciou;
- quanto deveria haver;
- quanto foi contado;
- onde ocorreu a diferença;
- quem autorizou a exceção.

**Decisão:** cada turno será uma sessão de caixa com abertura, movimentos, vendas, sangrias, suprimentos, estornos e fechamento imutável.

### 3.6 Fiscal tratado como uma etapa invisível

A NFC-e pode depender de autorização online, QR Code, certificado, CSC/configuração por UF, rejeições, cancelamento e contingência offline.

**Decisão:** o Caixa verá um status simples; o Administrador/Proprietário terá uma central de documentos fiscais para resolver pendências. A venda não pode desaparecer quando a SEFAZ estiver indisponível.

### 3.7 Promoção como alteração manual de preço

Descontos manuais causam inconsistência, perda de margem e conflito entre etiqueta e caixa.

**Decisão:** promoções terão regra, período, prioridade, público, produtos, limite, motivo e histórico. O Caixa não calcula promoção manualmente.

### 3.8 Devolução como cancelamento

Uma devolução pode alterar estoque, caixa, fiado, fiscal, custo, lote e motivo. Cancelar a venda inteira não resolve uma devolução parcial.

**Decisão:** devolução deve referenciar a venda original, permitir itens/quantidades parciais, definir destino do produto e usar o mesmo método de pagamento quando possível.

### 3.9 Offline sem reconciliação

“Tem offline” não basta. É necessário definir catálogo local, validade dos preços, estoque máximo permitido, fila, idempotência e conflito.

**Decisão:** o checkout será offline-first, com fila local, chave idempotente, recibo pendente e painel de conflitos.

### 3.10 Informação demais no Caixa

Pesquisas de checkout mostram aumento de carga cognitiva quando há excesso de opções, textos, equipamentos e hierarquia visual fraca.

**Decisão:** o Caixa verá apenas a próxima ação, a cesta atual, o total e o pagamento. Administração, relatórios e exceções ficam fora do fluxo principal.

## 4. Princípios de UX do Mercado

1. **Venda em primeiro lugar:** a venda normal nunca deve parecer um formulário administrativo.
2. **Uma decisão por vez:** não exibir todos os campos de estoque e fiscal no checkout.
3. **Progressive disclosure:** detalhes aparecem quando a tarefa exige.
4. **Exceções têm fluxo próprio:** devolução, desconto, fiado, produto vencido e offline não serão gambiarras na venda normal.
5. **Texto operacional:** “Produto vencido — retirar da venda”, não “status de validade inválido”.
6. **Feedback imediato:** leitura, erro, pagamento e sincronização devem ter resposta visual clara.
7. **Teclado e toque:** scanner de código funciona como teclado; telas também funcionam com toque.
8. **Nenhum dado crítico somente por cor:** usar texto, ícone e estado.
9. **Fonte única da verdade:** saldo, caixa e fiscal devem ser derivados de movimentos auditáveis.
10. **A interface acompanha o cargo:** Caixa, Administrador, Açougueiro e Proprietário não usam o mesmo painel.

## 5. Arquitetura de áreas

### Caixa

```text
Mercado
├── Nova venda
├── Vendas suspensas
├── Histórico do turno
├── Fechamento do caixa
└── Ajuda operacional
```

### Administrador

```text
Mercado
├── Operação
├── Produtos e preços
├── Recebimento
├── Estoque e validade
├── Reposição e compras
├── Promoções
├── Perdas e devoluções
├── Caixa e documentos fiscais
└── Relatórios operacionais
```

### Açougueiro

```text
Mercado / Carnes
├── Recebimento de carnes
├── Pesagem e etiquetas
├── Lotes e validade
├── Desossa e rendimento
├── Maturação
├── Descarte e perdas
└── Solicitar reposição
```

### Proprietário

Recebe as áreas anteriores e o modo detalhado:

- margens;
- custo médio;
- perdas financeiras;
- auditoria;
- desempenho por operador;
- análise de promoções;
- risco de estoque;
- regras e permissões.

## 6. UI principal do Mercado

### 6.1 Tela inicial do Caixa

Mostrar somente:

- status do turno;
- botão grande `Nova venda`;
- total vendido no turno;
- quantidade de vendas;
- pendências de sincronização;
- alerta operacional importante;
- `Fechar caixa`.

Não mostrar gráficos ou tabelas de estoque nessa tela.

### 6.2 Tela de venda

#### Desktop/terminal

```text
┌──────────────────────────────────────────────┐
│ Buscar/bipar produto              Status     │
├─────────────────────────┬────────────────────┤
│ Produtos encontrados    │ Carrinho            │
│                         │ Itens               │
│                         │ Subtotal            │
│                         │ Descontos aprovados │
│                         │ TOTAL               │
├─────────────────────────┴────────────────────┤
│ [Suspender] [Cliente/Fiado] [Pagamento]       │
└──────────────────────────────────────────────┘
```

#### Celular/tablet

- busca fixa no topo;
- carrinho recolhível;
- total fixo na parte inferior;
- botão `Finalizar venda` sempre visível;
- pagamento em tela cheia;
- sem tabelas horizontais.

### 6.3 Scanner de código

O fluxo visual/mock deve receber foco automaticamente quando o caixa abrir. A
leitura deve disparar o mesmo caminho do `Enter` sem exigir clique do operador.
Depois de adicionar o produto, selecionar peso, fechar pagamento ou exibir erro,
o foco retorna ao campo de leitura. Deve aceitar leitor que envia `Enter` e
leitor que apenas envia a sequência rápida do código.

O sistema deve aceitar:

- leitor USB/Bluetooth que envia teclas;
- câmera do celular/tablet, quando disponível;
- digitação manual como fallback;
- código EAN/GTIN;
- PLU;
- código interno;
- código de produto de peso variável;
- GS1 DataBar/DataMatrix quando configurado.

Ao ler um código:

1. identificar o produto;
2. interpretar peso/preço/lote quando codificado;
3. validar lote e validade;
4. aplicar preço vigente;
5. adicionar ao carrinho;
6. emitir confirmação visual e opcionalmente sonora.

O sistema não deve abrir uma tela de cadastro quando a leitura falhar. Deve mostrar busca rápida e uma ação separada `Cadastrar código`, permitida ao Administrador.

### 6.4 Produtos de peso variável

Produtos como carnes, queijos, frios e hortifruti podem ser vendidos por peso.

A ficha deve suportar:

- PLU;
- preço por kg;
- peso lido da balança;
- quantidade de casas decimais;
- tara;
- peso líquido;
- lote;
- validade;
- etiqueta gerada no estabelecimento;
- código com GTIN + atributos variáveis.

O preço final deve ser calculado pelo sistema, não digitado manualmente pelo Caixa sem permissão.

### 6.5 Carrinho

Cada linha deve permitir, conforme permissão:

- alterar quantidade/peso;
- remover item;
- consultar origem/lote sem expor custo ao Caixa;
- informar motivo de alteração;
- aplicar promoção automática;
- marcar item para devolução posterior.

Mostrar sempre:

- nome curto;
- quantidade/peso;
- preço unitário;
- desconto aplicado;
- subtotal;
- indicador de preço promocional.

## 7. Pagamento

### Fluxo simples

1. Conferir total.
2. Escolher forma de pagamento.
3. Confirmar valor recebido ou aguardar terminal.
4. Calcular troco quando aplicável.
5. Confirmar pagamento.
6. Emitir comprovante/fiscal.

### Formas

- dinheiro;
- cartão de débito;
- cartão de crédito;
- PIX;
- vale/gift card, se habilitado;
- crédito de cliente;
- fiado;
- pagamento dividido, em fase posterior.

### Segurança de cartão

- Não armazenar PAN, CVV, trilha magnética ou PIN.
- Preferir terminal integrado ou provedor de pagamento validado.
- O sistema guarda somente identificadores, status, valor, método e referência da transação.
- Estorno deve usar o fluxo do provedor e registrar retorno.

### Fiado

Exigir:

- cliente identificado;
- limite de crédito;
- saldo atual;
- valor disponível;
- aprovação quando exceder regra;
- lançamento no extrato.

O Caixa não deve ver a situação financeira global do cliente além do necessário para concluir a venda.

## 8. Turno e fechamento de caixa

### Abertura

- Caixa autenticado;
- terminal/caixa identificado;
- valor inicial contado;
- confirmação do operador;
- início registrado.

### Durante o turno

Registrar como movimentos separados:

- venda em dinheiro;
- venda em cartão;
- venda em PIX;
- sangria;
- suprimento;
- despesa autorizada;
- estorno;
- devolução;
- ajuste aprovado.

### Fechamento

1. Encerrar novas vendas.
2. Mostrar total esperado por forma de pagamento.
3. Caixa informa valores contados.
4. Sistema calcula diferença.
5. Operador informa motivo se houver divergência.
6. Pequena divergência pode seguir regra automática.
7. Divergência acima do limite exige Administrador/Proprietário.
8. Congelar o fechamento e gerar resumo.

```text
dinheiroEsperado = valorInicial + entradasEmDinheiro - saídasEmDinheiro
diferença = dinheiroContado - dinheiroEsperado
```

O fechamento deve guardar um snapshot dos valores esperados. Correções posteriores não podem alterar silenciosamente o que foi conferido.

## 9. Vendas suspensas e recuperação

O Caixa pode suspender uma cesta quando o cliente precisa buscar outro produto ou resolver pagamento.

- nome/identificador opcional;
- horário;
- operador;
- itens;
- preço reservado conforme regra;
- validade da suspensão;
- retomada, cancelamento ou expiração;
- auditoria.

Suspender não deve reservar estoque indefinidamente.

## 10. Devoluções, trocas e cancelamentos

### Venda cancelada

Usar antes do fechamento/fiscalização final, conforme situação fiscal.

### Devolução

- procurar venda original por QR, número, cliente ou período;
- selecionar itens e quantidades;
- usar preço originalmente pago;
- registrar motivo;
- decidir destino: vendável, quarentena, danificado ou descarte;
- devolver pelo método original quando possível;
- exigir aprovação por valor ou condição;
- gerar documento/comprovante;
- ajustar estoque e caixa.

### Troca

Representar como devolução do item original mais nova venda, com diferença de valor explícita.

Não permitir que uma devolução altere a receita usando o preço atual do produto.

## 11. Produtos, catálogo e preço

### Cadastro mínimo

- nome comercial;
- descrição curta;
- SKU/código interno;
- GTIN/EAN;
- PLU;
- categoria;
- marca;
- unidade de compra;
- unidade de estoque;
- unidade de venda;
- fatores de conversão;
- venda por unidade/peso/volume;
- preço de venda;
- preço por medida;
- custo atual e histórico;
- margem alvo, somente para perfis autorizados;
- estoque mínimo e máximo;
- prazo de validade padrão;
- fornecedor principal;
- status ativo/inativo.

### Preços

Manter:

- preço vigente;
- preço futuro agendado;
- preço promocional;
- preço por canal;
- preço por cliente/grupo, se necessário;
- histórico de alteração;
- autor e motivo.

O Caixa nunca deve editar preço diretamente no fluxo de venda.

## 12. Promoções e markdown

### Tipos previstos

- desconto percentual;
- desconto fixo;
- preço especial;
- quantidade progressiva;
- leve X, pague Y;
- combo;
- preço por canal;
- preço para cliente/grupo;
- markdown por proximidade do vencimento.

### Regra de prioridade

```text
preço obrigatório/legal
→ preço específico do produto
→ promoção vigente
→ desconto autorizado
→ preço final
```

A regra deve evitar combinar promoções incompatíveis sem explicar ao Caixa.

Para markdown de perecíveis:

- prazo de antecedência configurável;
- percentual sugerido;
- aprovação opcional;
- etiqueta atualizada;
- impacto de margem visível ao Administrador/Proprietário;
- retirada automática quando vencer.

## 13. Compras, recebimento e fornecedores

### Compra

- fornecedor;
- itens;
- unidade de compra;
- quantidade;
- custo negociado;
- prazo;
- imposto/frete;
- data prevista;
- status;
- aprovação.

### Recebimento

Fluxo recomendado:

1. Selecionar pedido esperado.
2. Bipar ou buscar item.
3. Conferir quantidade e unidade.
4. Conferir custo.
5. Informar lote/validade.
6. Registrar avaria e divergência.
7. Medir temperatura quando aplicável.
8. Separar quarentena.
9. Aceitar, aceitar parcialmente ou recusar.
10. Atualizar estoque somente após confirmação.

O recebimento deve permitir divergência sem obrigar o operador a alterar silenciosamente o pedido de compra.

### Fornecedor

- contatos;
- condições de pagamento;
- lead time;
- dias de entrega;
- pedido mínimo;
- embalagem/fator de conversão;
- histórico de preço;
- histórico de atraso;
- divergências de quantidade;
- devoluções;
- avaliação de qualidade.

## 14. Reposição e compras assistidas

### Reposição simples

Para cada produto mostrar:

- estoque disponível;
- estoque reservado;
- vendas recentes;
- dias de cobertura;
- ponto de reposição;
- estoque alvo;
- pedido em aberto;
- validade mais próxima;
- sugestão de quantidade.

Fórmula inicial:

```text
quantidadeSugerida = estoqueAlvo - estoqueDisponivel - comprasEmAberto
```

Depois evoluir para:

```text
estoqueAlvo = demandaDuranteLeadTime + estoqueDeSegurança
```

O sistema deve explicar a sugestão, não simplesmente apresentar um número sem contexto.

### Separar três problemas

- **Stockout:** falta produto para vender.
- **Overstock:** produto demais e capital parado.
- **Aging/expiry:** produto disponível, mas perto de perder validade.

Um único alerta de “estoque baixo” não é suficiente.

## 15. Estoque físico e inventário

### Livro de movimentos

Movimentos mínimos:

- recebimento;
- venda;
- devolução;
- transferência enviada;
- transferência recebida;
- perda;
- vencimento;
- ajuste;
- consumo interno;
- produção/desossa;
- maturação;
- reserva;
- liberação de reserva.

### Contagem cíclica

Não esperar somente um inventário anual.

- itens de alto valor/risco: contar com maior frequência;
- perecíveis: contagem por lote e validade;
- divergência: abrir investigação;
- contagem cega quando apropriado;
- aprovação para ajustes acima de limite;
- histórico antes/depois.

### Localização

Permitir estoque por:

- loja;
- câmara;
- freezer;
- depósito;
- corredor;
- prateleira;
- balcão;
- quarentena;
- descarte.

O Caixa precisa apenas saber se pode vender. O Administrador precisa saber onde está. O Açougueiro precisa saber a origem e o lote da carne.

## 16. Lotes, validade e segurança alimentar

### Dados por lote

- produto;
- lote do fornecedor;
- lote interno;
- data de fabricação;
- data de recebimento;
- data de abertura;
- validade;
- quantidade;
- custo;
- origem;
- temperatura de recebimento;
- status de qualidade;
- localização;
- responsável.

### Estados de lote

```text
RECEBIDO
EM_CONFERENCIA
LIBERADO
QUARENTENA
PROXIMO_DO_VENCIMENTO
BLOQUEADO
VENCIDO
DESCARTADO
DEVOLVIDO
```

### Alertas e ações

O alerta deve responder:

- qual produto;
- qual lote;
- quanto há;
- onde está;
- quando vence;
- quem deve agir;
- qual ação recomendada.

Exemplo:

```text
Picanha — lote L2408
8,4 kg vencem em 2 dias
Câmara fria 2
Ação: revisar qualidade e criar markdown ou retirar da venda
```

### Carne e segurança

Para carnes, integrar com os controles já previstos:

- rastreabilidade da peça;
- desossa;
- rendimento;
- maturação;
- temperatura e umidade;
- atividade de água quando aplicável;
- descarte;
- fornecedor e origem;
- recall por lote.

O sistema deve apoiar a operação, mas não substituir a avaliação do responsável técnico.

## 17. Fiscal brasileiro

### Escopo inicial

O sistema deverá prever uma camada fiscal configurável por estabelecimento e UF:

- NFC-e modelo 65 para venda ao consumidor, quando aplicável;
- NF-e modelo 55 para operações que exigirem esse documento;
- ambiente de homologação e produção;
- certificado digital;
- CSC/token quando exigido pelo leiaute/UF;
- série e numeração;
- QR Code;
- cancelamento;
- inutilização;
- carta/eventos quando aplicável;
- consulta de status;
- XML e DANFE;
- contingência offline;
- fila de transmissão;
- rejeições e reprocessamento.

### UI do Caixa

Não mostrar XML e regras tributárias no fluxo normal. Mostrar apenas:

- `Emitindo documento`;
- `Documento autorizado`;
- `Venda em contingência`;
- `Documento pendente de transmissão`;
- `Não foi possível concluir — chamar Administrador`.

### Central fiscal

Para Administrador/Proprietário:

- documentos autorizados;
- pendentes;
- rejeitados;
- em contingência;
- prazo de transmissão;
- motivo da rejeição;
- ação recomendada;
- reprocessar;
- consultar situação;
- exportar XML;
- relatório por série/período.

### Cuidado com mudanças legais

As regras de NF-e/NFC-e, GTIN, QR Code, tributos e contingência variam por versão, UF e cronograma. Não fixar regras fiscais no frontend. Usar adaptadores, configuração por estabelecimento e testes de homologação.

## 18. Offline-first — pós-liberação

### O que fica local

- catálogo mínimo;
- preços vigentes com validade;
- promoções vigentes;
- clientes autorizados para operação;
- carrinho;
- turno;
- fila de vendas;
- fila de pagamentos;
- fila de documentos fiscais;
- impressão/recibo pendente;
- estado de sincronização.

### Regras de segurança offline

- não vender produto com estoque local muito desatualizado sem regra configurada;
- bloquear venda de produto cujo preço perdeu validade;
- bloquear fiado se o limite local estiver desatualizado além do limite;
- não permitir nova venda offline com usuário bloqueado;
- cada comando recebe `idempotencyKey`;
- retry não pode duplicar venda, pagamento ou baixa;
- conflito de preço/estoque vira tarefa de resolução;
- nunca apagar fila sem confirmação ou retenção de auditoria.

### Estados visíveis

```text
Online · sincronizado
Online · sincronizando
Offline · operação local
Offline · 3 vendas pendentes
Conflito · ação necessária
Fiscal pendente
```

## 19. Auditoria e prevenção de perdas

Auditar:

- venda;
- cancelamento;
- desconto;
- alteração de preço;
- abertura de gaveta;
- reimpressão;
- devolução;
- estorno;
- sangria;
- suprimento;
- ajuste de estoque;
- contagem;
- recebimento;
- descarte;
- mudança de lote;
- alteração de permissão.

Cada evento deve registrar operador, data/hora, terminal, origem online/offline, motivo e referência.

### Alertas de exceção

- muitos cancelamentos por operador;
- muitos descontos manuais;
- reimpressões repetidas;
- gaveta aberta sem venda;
- devoluções sem comprovante;
- estoque negativo;
- venda com preço abaixo do permitido;
- discrepância repetida no caixa;
- descarte acima do padrão;
- recebimento com custo divergente;
- tentativas de vender lote bloqueado.

O alerta deve levar para a evidência, não acusar automaticamente fraude.

## 20. UI de alertas operacional

Cada alerta deve usar o formato:

```text
[Nível] O que ocorreu
Impacto
Próxima ação
Responsável
Prazo
[Resolver] [Ver detalhes]
```

Exemplos:

- `Crítico` — 3 produtos vencidos no freezer 1 — bloquear venda e retirar.
- `Atenção` — Filé mignon com 2 dias de cobertura — revisar reposição.
- `Atenção` — fechamento do Caixa com diferença de R$ 42 — solicitar conferência.
- `Informativo` — 2 documentos fiscais em contingência aguardando transmissão.

## 21. Responsividade

### Caixa no terminal/tablet

- botões grandes;
- leitura com teclado/scanner;
- atalhos de teclado;
- total sempre visível;
- pouca rolagem;
- recuperação rápida de erro.

### Administrador no tablet/celular

- listas de tarefas;
- filtros recolhidos;
- cards de lote/validade;
- câmera para código;
- contagem por leitura;
- aprovação por toque.

### Proprietário no desktop

- modo detalhado;
- relatórios e comparativos;
- auditoria;
- múltiplas colunas;
- exportações.

## 22. Componentes de UI previstos

```text
MercadoShell
CabecalhoOperacional
IndicadorDeConexao
BuscaDeProduto
LeitorDeCodigo
LinhaDoCarrinho
ResumoDoTotal
ModalDePagamento
SeletorDeClienteFiado
StatusFiscal
CartaoDeTarefa
AlertaDeValidade
CartaoDeLote
TabelaDeMovimentos
LeitorDeContagem
FormularioDeRecebimento
ConferidorDeDivergencia
SeletorDePromocao
ModalDeAprovacao
PainelDeTurno
ResumoDeFechamento
PainelDeSincronizacao
PainelDeConflitos
```

## 23. Modelo de dados essencial

```text
Produto
- id, nome, SKU, categoria, marca, ativo
- unidadeCompra, unidadeEstoque, unidadeVenda
- conversoes, vendePorPeso, vendePorQuantidade
- GTIN, PLU, codigoInterno

Preco
- produtoId, canal, valor, unidade, vigenciaInicio, vigenciaFim
- origem, motivo, criadoPorId

Lote
- produtoId, fornecedorId, numero, validade, fabricacao
- quantidade, custo, status, localizacao

MovimentoEstoque
- produtoId, loteId, tipo, quantidade, unidade
- origemId, terminalId, usuarioId, motivo, criadoEm

PedidoCompra
- fornecedorId, status, itens, custoPrevisto, entregaPrevista

Recebimento
- pedidoCompraId, itens, lotes, divergencias, temperatura, status

Promocao
- nome, regras, produtos, periodo, prioridade, limite, ativa

Venda
- terminalId, turnoId, operadorId, clienteId opcional
- status, total, formaPagamento, idempotencyKey

Pagamento
- vendaId, tipo, valor, provedor, referencia, status

TurnoCaixa
- operadorId, terminalId, abertura, fechamento
- valorInicial, esperado, contado, diferenca, aprovadorId

Devolucao
- vendaOriginalId, itens, motivo, destino, pagamento, aprovadorId

DocumentoFiscal
- vendaId, modelo, serie, numero, chave, status, XML
- modoEmissao, protocolo, rejeicao, tentativas
```

## 24. API de Mercado

### Operação

```text
GET  /mercado/catalogo
GET  /mercado/precos-vigentes
GET  /mercado/estoque-venda
POST /mercado/turnos/abrir
GET  /mercado/turnos/atual
POST /mercado/vendas
POST /mercado/vendas/:id/finalizar
POST /mercado/vendas/:id/suspender
POST /mercado/vendas/:id/cancelar
POST /mercado/vendas/:id/devolver
POST /mercado/vendas/:id/etiqueta
POST /mercado/turnos/:id/fechar
```

### Administração

```text
GET  /mercado/produtos
POST /mercado/produtos
PATCH /mercado/produtos/:id
POST /mercado/produtos/:id/codigos
GET  /mercado/lotes
GET  /mercado/alertas/validade
POST /mercado/compras
POST /mercado/compras/:id/receber
POST /mercado/reposicoes/sugerir
POST /mercado/inventarios/contagem
POST /mercado/estoque/ajustes
POST /mercado/promocoes
GET  /mercado/auditoria
```

### Fiscal e sincronização

```text
GET  /fiscal/documentos
POST /fiscal/documentos/:id/reprocessar
POST /fiscal/documentos/:id/cancelar
GET  /fiscal/documentos/:id/xml
POST /sincronizacao/comandos
GET  /sincronizacao/pendencias
POST /sincronizacao/conflitos/:id/resolver
```

## 25. Fases de entrega

### Fase 0 — Amostra visual

- validar navegação e linguagem por cargo;
- validar fluxo visual do Mercado;
- validar bip com foco automático e confirmação automática;
- manter dados, pagamentos, fiscal, estoque e backend em mock;
- não ampliar esforço de produção antes de `controle-producao/PAGOU.md`.

### Fase 1 — Caixa simples pós-liberação

- catálogo;
- scanner/busca;
- carrinho;
- peso;
- pagamentos básicos;
- recibo;
- turno e fechamento simples;
- estoque baixado por venda.

### Fase 2 — Segurança operacional

- cancelamento;
- desconto com aprovação;
- devolução;
- sangria e suprimento;
- auditoria;
- vendas suspensas;
- offline com idempotência.

### Fase 3 — Estoque de verdade

- lotes;
- validade;
- FEFO;
- recebimento;
- perdas;
- inventário cíclico;
- reposição.

### Fase 4 — Fiscal e hardware

- NFC-e/NF-e por adaptador;
- contingência;
- QR Code;
- impressora térmica;
- etiqueta;
- balança;
- terminais de pagamento.

### Fase 5 — Gestão avançada

- promoções;
- markdown;
- margem;
- fornecedor;
- compras assistidas;
- shrinkage;
- análises do Proprietário;
- multi-terminal/multi-loja.

## 26. Testes de aceitação

### Checkout

- scanner USB/Bluetooth;
- câmera;
- busca manual;
- venda por unidade;
- venda por peso;
- etiqueta de peso variável;
- dinheiro e troco;
- cartão/PIX via provedor;
- fiado com limite;
- venda suspensa;
- cancelamento;
- devolução parcial;
- reimpressão auditada.

### Estoque

- recebimento parcial;
- unidade/caixa convertida;
- três lotes com FEFO;
- produto vencido bloqueado;
- quarentena;
- markdown;
- perda por motivo;
- contagem divergente;
- transferência com despacho e recebimento;
- estoque fantasma identificado.

### Caixa

- abertura;
- sangria;
- suprimento;
- fechamento sem diferença;
- diferença dentro do limite;
- diferença exigindo aprovação;
- reabertura somente autorizada;
- snapshot do fechamento.

### Fiscal/offline

- NFC-e online;
- rejeição;
- contingência offline;
- QR Code;
- fila de transmissão;
- reconexão;
- retry idempotente;
- conflito de preço;
- conflito de estoque;
- documento pendente.

### UI

- Caixa conclui venda sem mouse;
- primeira venda sem treinamento longo;
- mensagem de erro explica a correção;
- no máximo uma decisão importante por etapa;
- tela não depende de hover;
- funciona em celular, tablet e terminal;
- leitor de tela e teclado funcionam nos fluxos críticos.

## 27. Indicadores de sucesso

- tempo médio do checkout;
- vendas por hora/terminal;
- taxa de erro de leitura;
- taxa de cancelamento;
- taxa de devolução;
- divergência de caixa por turno;
- percentual de vendas offline;
- tempo de sincronização;
- documentos fiscais pendentes;
- ruptura de estoque;
- estoque fantasma;
- perda por validade;
- perda por categoria;
- acuracidade de inventário;
- tempo de recebimento;
- tempo de reposição;
- margem perdida por desconto/markdown.

## 28. Decisões pendentes

- UF inicial da NFC-e e regras fiscais aplicáveis.
- Modelo de balança e protocolo de integração.
- Modelo de impressora térmica e etiqueta.
- Provedor de pagamento/TEF/PIX.
- Venda dividida no MVP ou fase posterior.
- Necessidade de multi-loja no primeiro lançamento.
- Política de devolução de alimentos perecíveis.
- Limites de desconto, estorno e divergência de caixa.
- Prazo máximo para operação offline.
- Responsável técnico pela validação sanitária.
- Regras de markdown de produtos próximos do vencimento.

## 29. Referências consultadas

- Portal Nacional NF-e: https://www.nfe.fazenda.gov.br/portal/
- Contingência offline NFC-e: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=fMhAfsQfE+M%3D
- DANFE NFC-e e QR Code: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=ndIjl+iEFdE%3D
- NT 2025.002-RTC: https://www.cgibs.gov.br/upload/arquivos/202606/17141803-nt-2025-002-v1-40-rtc-nf-e-ibs-cbs-is-final.pdf
- Validação GTIN/SPED: https://portal.fazenda.sp.gov.br/servicos/nfe/Paginas/validacao-GTIN-NT2021.003V1.40-G4.aspx
- GS1 Barcodes: https://www.gs1.org/standards/barcodes
- GS1 2D at Retail POS: https://ref.gs1.org/guidelines/2d-in-retail
- ANVISA — Cartilha de Boas Práticas: https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/alimentos/manuais-guias-e-orientacoes/cartilha-boas-praticas-para-servicos-de-alimentacao.pdf
- PCI SSC — outsourcing e responsabilidade: https://www.pcisecuritystandards.org/faqs/does-pci-dss-apply-to-merchants-who-outsource-all-payment-processing-operations-and-never-store-process-or-transmit-cardholder-data
- PCI SSC — armazenamento de dados de cartão: https://www.pcisecuritystandards.org/pdfs/pci_fs_data_storage.pdf
- LGPD/ANPD: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/outros-documentos-e-publicacoes-institucionais/lgpd-en-lei-no-13-709-capa.pdf/@@display-file/file
- Pesquisa sobre inventário impreciso em varejo alimentar: https://arxiv.org/pdf/2506.05357
- Pesquisa sobre carga cognitiva em self-checkout: https://sage.cnpereading.com/doi/10.1177/21582440251404195
