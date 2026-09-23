# Arquitetura de Software — ERP Point Steakhouse

> **Gate de implementação:** até existir `controle-producao/PAGOU.md`, esta
> arquitetura serve como referência e o sistema permanece em modo amostra/mock.
> Não ampliar backend, banco, migrations, fiscal, pagamentos ou integrações reais
> antes desse arquivo. A única exceção é o bip local do Mercado.

> Documento de decisão arquitetural. Cobre backend, frontend, modelagem de domínio e o Modo Híbrido "Inquebrável". Serve como base antes de qualquer implementação — mudanças de decisão aqui exigem atualização deste arquivo com histórico.

---

## 1. Visão geral

**Sistema:** ERP para a Point Steakhouse — açougue/mercado de carnes com desossa,
maturação própria (dry/wet aged) e venda direta ao público, compartilhando o
mesmo estoque. Não existe salão, cozinha, mesa, garçom ou prato preparado.

**Stack definida:**
- **Frontend:** Vue 3 (Composition API) + Pinia (estado) + Vue Router
- **Backend:** NestJS (Node.js/TypeScript)
- **ORM:** Prisma
- **Banco de dados:** PostgreSQL

**Domínios já mapeados** (ver `[[point-steakhouse]]` no planejamento): Pedidos, Desossa & Subprodutos, Câmara de Maturação, Segurança Biológica, Estoque, Financeiro, Clientes (conta corrente/fiado), Usuários/Permissões.

---

## 2. Princípios arquiteturais

### 2.0 Fases de execução

- **Amostra:** mocks e dados locais são aceitáveis; o objetivo é validar fluxo e experiência visual.
- **Liberação:** ocorre somente quando `controle-producao/PAGOU.md` existir.
- **Produção:** depois da liberação, o backend real substitui os mocks por etapas, começando por catálogo, estoque, PDV, caixa, auditoria e fiscal.
- **Exceção pré-liberação:** o leitor do Mercado deve focar automaticamente o campo, processar a leitura como `Enter` e devolver o foco ao campo. Isso não cria persistência nem integração produtiva.

1. **Organização por domínio, não por tipo técnico.** Nada de uma pasta `controllers/` gigante com todos os controllers do sistema misturados. Cada domínio de negócio é um módulo autocontido, com suas próprias camadas internas.
2. **Sem god-classes / god-services.** Nenhuma classe deve concentrar múltiplas responsabilidades não relacionadas. Um `PedidosService` com 30 métodos fazendo cálculo de preço, envio de notificação, baixa de estoque e geração de relatório é uma falha de design — vira-se em **casos de uso** pequenos, um arquivo por ação de negócio.
3. **Separação de camadas dentro de cada módulo:**
   - **Domínio** (`domain/`): entidades e regras de negócio puras, sem dependência de framework, HTTP ou banco.
   - **Aplicação** (`use-cases/`): orquestra o domínio para realizar uma ação específica (ex.: `RegistrarDesossaUseCase`).
   - **Interface** (`controllers/`, `dtos/`): tradução entre HTTP e casos de uso, validação de entrada.
   - **Infraestrutura** (`repositories/`): implementação concreta de persistência (Prisma), isolada atrás de uma interface.
4. **Value Objects para conceitos de domínio com regras próprias** — em vez de primitivos soltos (`number`, `string`) espalhados pelo código: `Peso`, `Dinheiro`, `AtividadeDeAgua (Aw)`, `ZonaDePerigo` carregam suas próprias validações (ex.: `Peso` nunca é negativo).
5. **Injeção de dependência** via container do NestJS — módulos dependem de abstrações (interfaces de repositório), nunca de implementações concretas do Prisma diretamente na camada de domínio.
6. **DTOs + validação na borda** (`class-validator`/`class-transformer`) — o domínio nunca recebe dado não validado.
7. **Convenções de código** (herdadas do seu protocolo de desenvolvimento): nomes em português em todo o código (variáveis, classes, métodos, comentários didáticos), kebab-case PT-BR para arquivos/pastas, PascalCase para classes, camelCase para métodos/variáveis, constantes nomeadas em vez de números mágicos, WCAG AA no frontend.
8. **Fluxo de implementação:** análise → derivação de testes → implementação, conforme seu protocolo já estabelecido (REGRAS.md) — este documento é o ponto de partida da fase de análise para cada módulo.

---

## 3. Visão de alto nível (camadas)

```
┌─────────────────────────────────────────────┐
│  Cliente (Vue 3 SPA/PWA)                     │
│  Service Worker + IndexedDB (fila offline)   │
└───────────────────┬───────────────────────────┘
                    │ HTTP/REST (JSON)
┌───────────────────▼───────────────────────────┐
│  NestJS — Camada de Interface                 │
│  Controllers · DTOs · Guards · Interceptors   │
├─────────────────────────────────────────────────┤
│  NestJS — Camada de Aplicação                 │
│  Casos de Uso (1 classe = 1 ação de negócio)  │
├─────────────────────────────────────────────────┤
│  NestJS — Camada de Domínio                    │
│  Entidades · Value Objects · Regras puras     │
├─────────────────────────────────────────────────┤
│  NestJS — Camada de Infraestrutura             │
│  Repositórios (Prisma) · Fila de Sincronização │
└───────────────────┬───────────────────────────┘
                    │
┌───────────────────▼───────────────────────────┐
│  PostgreSQL                                   │
└─────────────────────────────────────────────────┘
```

A camada de domínio nunca importa Prisma, Express ou qualquer coisa do NestJS além de decorators leves de DI — isso é o que permite testar regra de negócio sem subir banco nem servidor HTTP.

---

## 4. Organização de pastas — Backend (NestJS)

Estrutura modular por domínio (bounded context), padrão consolidado em times NestJS de médio/grande porte:

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/                          # variáveis de ambiente, configuração tipada
│   │
│   ├── shared/                          # transversal a todos os domínios — nunca regra de negócio
│   │   ├── filtros/                     # exception filters
│   │   ├── guards/                      # autenticação/autorização genérica
│   │   ├── interceptors/
│   │   ├── decorators/
│   │   ├── pipes/
│   │   └── tipos/                       # tipos utilitários compartilhados
│   │
│   ├── infra/                           # infraestrutura técnica, sem regra de negócio
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── sincronizacao/               # suporte ao Modo Híbrido "Inquebrável"
│   │   │   ├── fila-de-comandos.service.ts
│   │   │   └── resolucao-de-conflito.service.ts
│   │   └── logger/
│   │
│   └── modules/                         # UM MÓDULO POR DOMÍNIO DE NEGÓCIO
│       │
│       ├── pedidos/
│       │   ├── pedidos.module.ts
│       │   ├── controllers/
│       │   │   └── pedidos.controller.ts
│       │   ├── use-cases/               # 1 arquivo = 1 ação de negócio
│       │   │   ├── criar-pedido.use-case.ts
│       │   │   ├── concluir-pedido.use-case.ts
│       │   │   └── cancelar-item.use-case.ts
│       │   ├── domain/
│       │   │   ├── pedido.entity.ts
│       │   │   └── item-de-pedido.entity.ts
│       │   ├── dtos/
│       │   ├── repositories/
│       │   │   ├── pedido.repository.ts          # interface
│       │   │   └── pedido.prisma.repository.ts   # implementação
│       │   └── __tests__/
│       │
│       ├── desossa-subprodutos/
│       │   ├── domain/
│       │   │   ├── peca-bruta.entity.ts
│       │   │   ├── corte.entity.ts
│       │   │   ├── subproduto.entity.ts           # osso/sebo/apara + destino
│       │   │   └── value-objects/
│       │   │       └── peso.vo.ts
│       │   ├── use-cases/
│       │   │   ├── registrar-desossa.use-case.ts
│       │   │   ├── calcular-custo-efetivo.use-case.ts
│       │   │   └── direcionar-subproduto.use-case.ts
│       │   └── ...
│       │
│       ├── maturacao/
│       │   ├── domain/
│       │   │   ├── peca-em-maturacao.entity.ts
│       │   │   └── value-objects/
│       │   │       ├── atividade-de-agua.vo.ts    # Aw, 0–1, valida limiar
│       │   │       └── curva-de-perda.vo.ts
│       │   ├── use-cases/
│       │   │   ├── iniciar-maturacao.use-case.ts
│       │   │   ├── projetar-perda-por-evaporacao.use-case.ts
│       │   │   └── finalizar-maturacao.use-case.ts
│       │   └── ...
│       │
│       ├── seguranca-biologica/
│       │   ├── domain/
│       │   │   ├── ponto-critico-de-controle.entity.ts
│       │   │   ├── indicador-microbiologico.entity.ts
│       │   │   └── value-objects/
│       │   │       └── zona-de-perigo.vo.ts       # valida limite de 240 min
│       │   ├── use-cases/
│       │   │   ├── registrar-verificacao-ccp.use-case.ts
│       │   │   ├── registrar-coleta-microbiologica.use-case.ts
│       │   │   └── alertar-zona-de-perigo.use-case.ts
│       │   └── ...
│       │
│       ├── estoque/
│       │   ├── domain/
│       │   │   └── item-de-estoque.entity.ts      # peça bruta, corte ou insumo
│       │   ├── use-cases/
│       │   │   ├── dar-baixa-por-ficha-tecnica.use-case.ts
│       │   │   └── dar-baixa-por-venda-direta.use-case.ts   # canal "mercado"
│       │   └── ...
│       │
│       ├── financeiro/
│       │   ├── domain/
│       │   │   └── value-objects/dinheiro.vo.ts
│       │   ├── use-cases/
│       │   │   ├── calcular-custo-medio-ponderado.use-case.ts
│       │   │   └── gerar-dre-setorial.use-case.ts
│       │   └── ...
│       │
│       ├── clientes/
│       │   ├── domain/
│       │   │   └── conta-corrente.entity.ts       # saldo de fiado
│       │   ├── use-cases/
│       │   │   ├── lancar-na-conta.use-case.ts
│       │   │   └── quitar-saldo.use-case.ts
│       │   └── ...
│       │
│       └── usuarios/
│           ├── domain/
│           ├── use-cases/
│           └── ...
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

**Por que essa forma evita god-classes na prática:** cada `use-case` tem um único método público (`executar()`), uma única responsabilidade, e pode ser testado isoladamente injetando repositórios falsos — nada de um serviço central que "sabe" fazer tudo sobre pedidos.

---

## 5. Organização de pastas — Frontend (Vue 3)

Estrutura por *feature* (domínio), espelhando os módulos do backend — facilita achar tudo que é relacionado a "maturação" em um único lugar:

```
frontend/
├── src/
│   ├── main.ts
│   │
│   ├── app/                             # bootstrap da aplicação
│   │   ├── router/
│   │   │   └── index.ts                 # rotas agregadas por feature
│   │   └── plugins/
│   │
│   ├── shared/                          # reutilizável entre domínios, sem regra de negócio
│   │   ├── components/                  # Botao.vue, Cartao.vue, GraficoBarras.vue
│   │   ├── composables/                  # useTema(), useFormatador()
│   │   └── utils/
│   │
│   ├── design-system/                   # tokens (cores, tipografia, espaçamento)
│   │   └── tokens.ts
│   │
│   └── features/                        # UM DIRETÓRIO POR DOMÍNIO/FUNCIONALIDADE
│       │
│       ├── dashboard/
│       │   ├── views/
│       │   │   └── DashboardView.vue
│       │   ├── components/
│       │   └── composables/
│       │       └── useResumoGerencial.ts
│       │
│       ├── maturacao/
│       │   ├── views/
│       │   │   ├── CamaraDeMaturacaoView.vue
│       │   │   └── DetalheDaPecaView.vue
│       │   ├── components/
│       │   │   ├── GaugeDeAtividadeDeAgua.vue
│       │   │   └── CartaoDePeca.vue
│       │   ├── composables/
│       │   │   └── useProjecaoDePerda.ts       # Inteligência Preditiva de Evaporação
│       │   └── store/
│       │       └── maturacao.store.ts           # Pinia
│       │
│       ├── seguranca-biologica/
│       │   ├── views/
│       │   ├── components/
│       │   │   ├── GaugeZonaDePerigo.vue
│       │   │   └── PainelDeIndicadores.vue
│       │   └── store/
│       │
│       ├── desossa-subprodutos/
│       │   ├── views/
│       │   ├── components/
│       │   └── store/
│       │
│       ├── pdv/
│       │   ├── views/
│       │   ├── components/
│       │   ├── offline/                          # fila local do Modo Híbrido "Inquebrável"
│       │   │   ├── fila-local.ts                  # IndexedDB
│       │   │   └── sincronizador.ts
│       │   └── store/
│       │
│       ├── financeiro/
│       ├── clientes/
│       └── auth/
```

---

## 6. Modo Híbrido "Inquebrável" — decisão pós-liberação

**Problema:** o PDV não pode parar quando a internet cai.

**Decisão para implementar somente após `controle-producao/PAGOU.md`:**
- **Frontend:** PWA com Service Worker; toda escrita (nova venda, item do pedido) grava primeiro em **IndexedDB local** e só depois tenta sincronizar — a UI nunca espera a rede para responder.
- **Fila de comandos:** cada ação offline vira um "comando" com `idempotencyKey` único (UUID gerado no cliente), guardado na fila até confirmação do servidor.
- **Backend:** endpoint de sincronização idempotente — reenviar o mesmo comando não duplica o efeito (usa a `idempotencyKey` para deduplicar).
- **Resolução de conflito:** preferências e dados não críticos podem usar *last-write-wins*. Estoque, caixa, pagamentos, vendas e fiscal devem usar comandos idempotentes, livro append-only e conflitos explícitos; nunca apagar silenciosamente um movimento financeiro ou de estoque.
- **Indicador visual:** badge de status "Online · sincronizado" / "Offline · N pendentes" — já presente no protótipo visual, alimentado pelo estado da fila local.

Antes da liberação, o estado offline e a fila são apenas simulações visuais.

---

## 7. Modelagem de domínio — decisões que evitam god-classes

- **Peça bruta, Corte e Peça em Maturação são entidades distintas**, cada uma com seu próprio ciclo de vida — não existe uma classe `Produto` genérica tentando representar as três coisas com flags (`ehMaturada`, `ehCorte`, etc.).
- **Casos de uso pequenos**: `RegistrarDesossaUseCase` só registra a desossa; `CalcularCustoEfetivoUseCase` só calcula custo. Nenhum dos dois sabe como enviar notificação ou gerar relatório — isso é responsabilidade de outro caso de uso, que pode reaproveitar os dois via composição.
- **Value Objects para regras que se repetem**: `Peso` garante que nunca existe peso negativo em nenhum lugar do sistema; `AtividadeDeAgua` valida que o valor está entre 0 e 1 e sabe comparar-se com o limiar de segurança (0,85); `Dinheiro` evita erro de ponto flutuante ao representar valores em centavos.
- **Subproduto com destino explícito**: em vez de o osso/sebo/apara "sumir" do estoque na desossa, cada subproduto é uma entidade com um campo `destino` (`Descarte | Caldo | Sebo/Banha | Moída/Hambúrguer | Petiscos`) — isso é o que viabiliza a Gestão de Subprodutos em Cascata sem gambiarra.

---

## 8. Testes

Seguindo seu protocolo (análise → testes → implementação):

- **Unitários**: um teste por caso de uso, domínio isolado (repositórios substituídos por dublês/fakes) — não sobem banco nem HTTP.
- **De integração**: um conjunto por módulo, rodando contra um banco de teste dedicado (schema Prisma aplicado em banco efêmero).
- **Casos de fronteira obrigatórios** nos módulos de Segurança Biológica e Maturação, por serem regras de segurança: exatamente 240 minutos acumulados em zona de perigo, exatamente Aw = 0,85, peça com `diasAtual > diasTotal` (maturação além do previsto).

---

## 9. Ainda em aberto

Pontos que precisam de uma decisão explícita antes da implementação começar (próxima rodada de planejamento):

- Estilo de API: REST puro ou REST + eventos (para atualização em tempo real do dashboard)?
- Estratégia de autenticação (JWT simples vs. sessão + refresh token) e modelo de permissões por papel (dono, caixa, açougueiro)
- Onde hospedar (nuvem gerenciada vs. servidor próprio no restaurante, dado o requisito de operação offline)
- Estratégia de deploy e ambientes (dev/staging/produção)
