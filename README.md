# Point Steak House — ERP

ERP de gestão para **açougue e mercado de carnes**: desossa com custo real,
maturação própria (dry/wet aged), segurança biológica, estoque, caixa (PDV),
financeiro e clientes com conta corrente — operando **o mesmo estoque** nos dois
canais de venda (Salão e Mercado).

> **Repositório privado.** Não é um sistema de restaurante: não existe salão,
> cozinha, mesa, garçom ou prato preparado.

---

## Fase atual: modo amostra visual

Este repositório está em **modo amostra visual**. Frontend, regras e dados podem
usar mocks; **não** se deve ampliar o backend real, persistência, fiscal,
pagamentos ou integrações de hardware antes da liberação formal da produção.

O gatilho de liberação é a criação manual de `controle-producao/PAGOU.md`,
somente depois da confirmação do pagamento. **A ausência desse arquivo significa
`AMOSTRA`.** Para bloquear novamente, remova a pasta `controle-producao/`.

### Única exceção pré-liberação

O **bip do Mercado** (leitor de código de barras) pode ser desenvolvido e
validado no mock. Ao abrir o caixa, o campo de bipagem recebe foco
automaticamente, o código é processado como se `Enter` tivesse sido pressionado
e o foco retorna ao campo após a operação — cobrindo leitores USB/Bluetooth que
funcionam como teclado, leitores que já enviam `Enter` e leitores sem sufixo.
O bip **não** libera banco, API, fiscal, estoque persistido ou qualquer outro
módulo de produção.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vue 3 (Composition API) · Pinia · Vue Router · TypeScript · Vite |
| Backend | NestJS (Node.js / TypeScript) |
| ORM | Prisma 7 |
| Banco | PostgreSQL 16 |
| Testes | Vitest (unit + e2e) · Supertest · Vue Test Utils · jsdom |
| Lint / Formato | oxlint (backend) · Prettier · `vue-tsc` (frontend) |
| Infra | Docker Compose · GitHub Actions CI |

## Estrutura do repositório

```
.
├── backend/                  API NestJS + Prisma
│   ├── prisma/               schema.prisma, seed.ts, migrations/
│   └── src/
│       ├── config/           validação e leitura do .env
│       ├── infra/            PrismaModule (adapters de persistência)
│       ├── shared/           guards, decorators, filtros globais
│       └── modules/          domínios autocontidos (ver abaixo)
├── frontend/                 SPA Vue 3
│   └── src/
│       ├── app/router/       rotas + guarda por papel
│       ├── design-system/    tokens (cores, tipografia, espaçamento)
│       ├── shared/           componentes base, composables, tipos
│       └── features/         uma pasta por domínio de negócio
├── android/                  APK WebView para TV box legado (Android 7.1)
├── vendor/                   runtime do mockup de design
├── Main.dc.html              artboard de referência (design canvas)
├── Main.tvbox.html           mesma tela, com polyfills ES5
├── docker-compose.yml        PostgreSQL 16
└── *.md                      documentos de produto e arquitetura
```

### Módulos do backend (`backend/src/modules/`)

Organização **por domínio, não por tipo técnico** — cada módulo é autocontido e
separa camadas internamente:

| Camada | Pasta | Papel |
|---|---|---|
| Domínio | `domain/` | entidades e regras puras, sem framework/HTTP/banco |
| Aplicação | `use-cases/` | um arquivo por ação de negócio |
| Interface | `controllers/`, `dtos/` | tradução HTTP ↔ casos de uso, validação na borda |
| Infra | `repositories/` | persistência concreta (Prisma) atrás de interface |

Domínios mapeados: `usuarios` (auth + papéis), `dashboard`, `pedidos`,
`estoque`, `maturacao`, `clientes`.

> `app.module.ts` registra apenas `UsuariosModule` e `DashboardModule` por
> enquanto — os demais módulos existem mas ficam fora do grafo até a liberação.

### Features do frontend (`frontend/src/features/`)

`dashboard` · `mercado` (PDV) · `acougue` · `desossa-subprodutos` ·
`maturacao` · `seguranca-biologica` · `estoque` · `financeiro` · `clientes` ·
`acesso` · `administrador` · `configuracoes` · `auth`

---

## Cargos e permissões

Quatro papéis, com permissões declaradas em
[`frontend/src/shared/tipos/papel.ts`](frontend/src/shared/tipos/papel.ts) e
refletidos na guard de roles do backend (`@Papeis(...)` + `RolesGuard`).

| Papel | Rota inicial | Escopo |
|---|---|---|
| `PROPRIETARIO` | `/dashboard` | acesso total; não pode ser removido |
| `ADMINISTRADOR` | `/administrador` | gestão operacional e financeira |
| `ACOUGUEIRO` | `/acougueiro` | produção: desossa, maturação, subprodutos |
| `CAIXA` | `/mercado` | venda, caixa, fiado |

As rotas do router declaram `meta.papeisPermitidos`; o guard redireciona para
`/acesso-negado`. Detalhamento completo em
[`cargos-e-permissoes-point-steakhouse.md`](cargos-e-permissoes-point-steakhouse.md).

---

## Começando

### Pré-requisitos

- Node.js 20+
- Docker (para o PostgreSQL) — ou uma instância própria de PostgreSQL 16

### 1. Banco de dados

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # edite os segredos JWT
npm install
npx prisma migrate dev     # aplica o schema
npx prisma db seed         # dados de demonstração
npm run start:dev          # http://localhost:3000
```

Gere segredos JWT fortes antes de sair do `.env.example`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:3000
npm install
npm run dev                # http://localhost:5173
```

### Variáveis de ambiente

**Backend** ([`backend/.env.example`](backend/.env.example))

| Variável | Descrição |
|---|---|
| `NODE_ENV` | `development` \| `production` |
| `PORT` | porta da API (padrão `3000`) |
| `DATABASE_URL` | connection string do PostgreSQL |
| `FRONTEND_URL` | origem liberada no CORS |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRACAO` | token de acesso (ex.: `15m`) |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRACAO` | token de renovação (ex.: `30d`) |

**Frontend** ([`frontend/.env.example`](frontend/.env.example))

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | base URL da API (padrão `http://localhost:3000`) |

> Os arquivos `.env` são ignorados pelo git — apenas `.env.example` é versionado.

---

## API

Autenticação JWT com **access token** no corpo da resposta e **refresh token**
em cookie `httpOnly` (`SameSite=Strict`, escopo `/auth`).

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | público | retorna `tokenDeAcesso` + `usuario` e define o cookie de renovação |
| `POST` | `/auth/renovar` | cookie | renova o access token |
| `POST` | `/usuarios` | `PROPRIETARIO` | registra um usuário |
| `GET` | `/dashboard/resumo` | `PROPRIETARIO` | resumo gerencial |
| `GET` | `/dashboard/faturamento-semanal` | `PROPRIETARIO` | faturamento dos últimos 7 dias |
| `GET` | `/dashboard/distribuicao-canal` | `PROPRIETARIO` | Salão × Mercado |
| `GET` | `/dashboard/top-cortes?limite=` | `PROPRIETARIO` | ranking de cortes |
| `GET` | `/dashboard/camara-maturacao` | `PROPRIETARIO` | peças em maturação |
| `GET` | `/dashboard/alertas-estoque` | `PROPRIETARIO` | estoque abaixo do mínimo |

---

## Testes

```bash
# backend — 9 testes unitários (Vitest)
cd backend
npm run test          # unit
npm run test:watch
npm run test:cov      # cobertura
npm run test:e2e      # e2e (requer banco)

# frontend — 184 testes (Vitest + jsdom)
cd frontend
npm run test
```

```bash
# qualidade
cd backend  && npm run lint      # oxlint
cd frontend && npx vue-tsc -b    # type-check
```

## Integração contínua

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em `push` e
`pull_request` para `main`:

| Job | O que faz |
|---|---|
| `lint-backend` | `oxlint` |
| `lint-frontend` | `vue-tsc -b` |
| `test-backend` | sobe PostgreSQL 16 como service, `prisma migrate deploy`, `vitest run` |
| `test-frontend` | `vitest run` |
| `build-backend` | `nest build` (depende de lint + test) |
| `build-frontend` | `vue-tsc -b && vite build` (depende de lint + test) |

---

## Protótipo de design (mockup)

`Main.dc.html` é um **artboard de referência** exportado de uma ferramenta de
design — não é código de produção. Os valores a replicar (cores, tamanhos de
fonte, espaçamentos, raios, sombras, layout) estão nos atributos `style="…"` e
no bloco `<helmet><style>`; o objetivo é reproduzi-los fielmente no sistema de
estilos, não copiar o markup.

Para visualizar:

```bash
python3 -m http.server       # depois abra Main.dc.html
```

alguns navegadores bloqueiam os scripts via `file://`.

### TV box (Android legado)

`support.js` usa sintaxe ES2020+ e Custom Elements v1, que falham em silêncio
(tela preta, sem console) nos navegadores de TV boxes Android 7.1 baratos
(Chrome < 80). Nesse hardware, sirva a mesma pasta e abra **`Main.tvbox.html`**,
que carrega `vendor/polyfills.legacy.js` e `support.legacy.js` (transpilação
Babel para ES5).

`support.legacy.js` e `vendor/polyfills.legacy.js` são **gerados**, não editados
à mão. Para regerar após mudar `support.js`:

```bash
npm install --no-save @babel/core @babel/cli @babel/preset-env core-js-bundle whatwg-fetch @webcomponents/custom-elements
npx babel support.js --presets=@babel/preset-env --out-file support.legacy.js
cat node_modules/core-js-bundle/minified.js \
    node_modules/whatwg-fetch/dist/fetch.umd.js \
    node_modules/@webcomponents/custom-elements/custom-elements.min.js > vendor/polyfills.legacy.js
```

(com `targets: "ie 11"` no `@babel/preset-env`, via `babel.json`); depois
re-transpile o bloco `<script data-dc-script>` dentro de `Main.tvbox.html` — ele
é inline, não carregado de arquivo, porque o runtime DC lê da própria página.

O APK em [`android/`](android/) (`com.pointsteakhouse.dashboard`,
`minSdk`/`targetSdk` 25) é um wrapper WebView que abre `Main.tvbox.html` com os
assets offline — assinado em debug, ideal para sideloading. Ver
[`android/README.md`](android/README.md).

---

## Documentos do produto

| Arquivo | Conteúdo |
|---|---|
| [`funcionalidades-point-steakhouse.md`](funcionalidades-point-steakhouse.md) | especificação funcional, aba a aba |
| [`arquitetura-point-steakhouse.md`](arquitetura-point-steakhouse.md) | decisões arquiteturais (DDD, camadas, Modo Híbrido "Inquebrável") |
| [`cargos-e-permissoes-point-steakhouse.md`](cargos-e-permissoes-point-steakhouse.md) | papéis, permissões e identidade do app |
| [`funcoes-administrativas-point-steakhouse.md`](funcoes-administrativas-point-steakhouse.md) | funções administrativas |
| [`financas-point-steakhouse.md`](financas-point-steakhouse.md) | financeiro e relatórios |
| [`mercado-point-steakhouse.md`](mercado-point-steakhouse.md) · [`-profundo.md`](mercado-point-steakhouse-profundo.md) | operação do Mercado/PDV |
| [`ui-por-cargo-e-credencial-point-steakhouse.md`](ui-por-cargo-e-credencial-point-steakhouse.md) | UI por cargo |
| [`simplificacao-ui-experiencia-point-steakhouse.md`](simplificacao-ui-experiencia-point-steakhouse.md) | simplificação de UI/experiência |
| [`Point-SteakHouse-Apresentacao-Comercial.pdf`](Point-SteakHouse-Apresentacao-Comercial.pdf) | apresentação comercial |

---

## Licença

Privada — todos os direitos reservados. Não é um software de código aberto.
