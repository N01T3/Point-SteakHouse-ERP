# UI por cargo e credencial — Point Steak House

> **Fase:** a experiência por cargo permanece mock até `controle-producao/PAGOU.md`. O backend real
> de autenticação e autorização não será ampliado antes desse gatilho. A exceção
> é somente o bip do Mercado, que deve focar e confirmar automaticamente a leitura.

## Objetivo

A interface exibida no aplicativo será determinada pelo usuário autenticado, seu cargo e suas permissões.

Cada cargo terá uma experiência própria, com menu, página inicial, ferramentas e dados adequados às suas responsabilidades.

O usuário não deverá receber uma interface cheia de áreas que não pode utilizar.

## Fluxo de autenticação

1. O usuário informa usuário e senha.
2. O backend valida a credencial.
3. O backend retorna o usuário, cargo e permissões.
4. O frontend salva o estado autenticado.
5. O menu é montado conforme cargo e permissões.
6. O usuário é redirecionado para sua área inicial.

Exemplo:

```text
Usuário: acougueiro
Senha: 123
Cargo: ACOUGUEIRO
Rota inicial: /acougueiro
```

O cargo deve vir do backend. O frontend nunca deve decidir o cargo apenas pelo nome digitado no login.

## Resposta esperada do login

```json
{
  "tokenDeAcesso": "token",
  "usuario": {
    "id": "usuario-1",
    "nome": "Rita",
    "papel": "ACOUGUEIRO",
    "permissoes": [
      "carne.visualizar",
      "carne.confirmar_desossa",
      "carne.confirmar_maturacao"
    ]
  },
  "rotaInicial": "/acougueiro"
}
```

## Áreas por cargo

### Proprietário

Rota inicial: `/dashboard`.

Menu e áreas:

- Dashboard completo
- Finanças
- Mercado
- Estoque
- Desossa e Subprodutos
- Câmara de Maturação
- Segurança Biológica
- Clientes e Fiado
- Administração
- Usuários, cargos e permissões
- Auditoria

O Proprietário poderá alternar entre o modo simples e o modo detalhado.

### Administrador

Rota inicial: `/administrador`.

Menu e áreas:

- Resumo administrativo
- Finanças autorizadas
- Contas a pagar
- Reposições
- Estoque
- Alertas de estoque crítico
- Materiais vencidos ou próximos do vencimento
- Perdas e desperdícios
- Código de barras
- Visão gerencial do Mercado
- Relatórios permitidos

Não terá acesso à senha do Proprietário, aos segredos de autenticação ou à gestão de cargos por padrão.

### Açougueiro

Rota inicial: `/acougueiro`.

A interface do Açougueiro deverá mostrar somente páginas e utilitários relacionados às carnes.

#### Dashboard do Açougueiro

Mostrar:

- próxima tarefa;
- carnes aguardando recebimento;
- desossas pendentes;
- peças em maturação;
- alertas de validade;
- alertas sanitários;
- estoque de carnes;
- perdas recentes;
- solicitações de reposição.

#### Utilitários do Açougueiro

- Recebimento de peça bruta
- Pesagem
- Registro de fornecedor e lote
- Desossa
- Registro de cortes
- Registro de subprodutos
- Câmara de maturação
- Confirmação de temperatura e umidade
- Rastreamento de lote
- Registro de validade
- Registro de descarte e material podre
- Solicitação de reposição
- Consulta de rendimento

#### O Açougueiro não verá

- Finanças
- DRE
- Lucro
- Margem
- Salários
- Contas bancárias
- Caixa
- Pagamentos
- Usuários
- Cargos e permissões

### Caixa

Rota inicial: `/mercado`.

Menu e áreas:

- Nova venda
- Bipagem
- Busca de produto ou corte
- Carrinho
- Pagamento
- Fiado autorizado
- Etiquetas
- Histórico do próprio turno
- Sangria
- Suprimento
- Fechamento de caixa

O Caixa não verá DRE, lucro, margem, salários, custos internos ou saldo bancário global.

## Menu dinâmico

O menu não deve ser uma lista fixa. Os itens devem ser filtrados por cargo e permissão:

```ts
interface ItemDeMenu {
  rota: string
  titulo: string
  icone: string
  papeisPermitidos?: PapelUsuario[]
  permissaoNecessaria?: string
}
```

Exemplo:

```ts
{
  rota: 'acougueiro',
  titulo: 'Açougue',
  icone: 'carne',
  papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'],
  permissaoNecessaria: 'carne.visualizar'
}
```

## Rotas protegidas

Cada rota deverá declarar os cargos e permissões permitidos:

```ts
{
  path: '/acougueiro',
  name: 'acougueiro',
  component: AcougueiroView,
  meta: {
    papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'],
    permissao: 'carne.visualizar'
  }
}
```

O guard de rota deverá:

- verificar autenticação;
- verificar cargo;
- verificar permissão;
- redirecionar para a área correta quando necessário;
- exibir acesso negado sem revelar dados protegidos.

## Segurança no backend

Esconder um item no menu não é suficiente.

O backend deverá:

- proteger controllers com autenticação;
- validar cargo e permissão em cada endpoint;
- retornar `403 Forbidden` quando o acesso for indevido;
- filtrar os dados conforme o escopo do usuário;
- não enviar custos ou informações financeiras ao Açougueiro e Caixa;
- registrar tentativas de acesso negado;
- invalidar ou atualizar a sessão quando o cargo for alterado.

## Sessão e troca de cargo

- O cargo será carregado novamente ao renovar o token.
- Alteração de permissões deverá refletir na próxima atualização da sessão.
- Usuário bloqueado deverá perder acesso imediatamente ou após expiração curta do token.
- Logout deve limpar token, usuário, menu e dados temporários.
- O frontend não deve persistir senha.

## Credenciais temporárias de desenvolvimento

Credencial atual do Proprietário:

```text
Usuário: dono
Senha: 123
```

Credencial opcional para testar a interface do Açougueiro:

```text
Usuário: acougueiro
Senha: 123
```

Essas credenciais são apenas para desenvolvimento/mock.

Regras:

- Não usar em produção.
- Armazenar senha somente como hash.
- Exigir troca da senha no primeiro login real.
- Não exibir senha em logs ou no frontend.
- Não confiar no cargo enviado pelo navegador.
- Produção deve falhar se a senha padrão estiver ativa.

## Critérios de aceite

- Login de `dono` abre o Dashboard do Proprietário.
- Login de `acougueiro` abre `/acougueiro`.
- O Açougueiro vê somente suas páginas e utilitários.
- Login de `caixa` abre `/mercado`.
- O Caixa vê somente operação de vendas e caixa.
- O Administrador vê gestão, reposições e alertas autorizados.
- O menu muda conforme cargo e permissões.
- Acesso direto a uma URL proibida retorna `403` ou redireciona.
- Informações financeiras não são enviadas para cargos sem permissão.
- Mudança de cargo atualiza a interface e as permissões.
- O Proprietário mantém acesso a todas as áreas.
