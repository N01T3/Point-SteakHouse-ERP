# Cargos e permissões — Point Steak House

> **Fase:** cargos, permissões e autenticação apresentados na amostra podem usar
> mocks. A autorização real no backend só deve ser expandida após
> `controle-producao/PAGOU.md`.
> O bip do Mercado é a única exceção funcional pré-liberação e não concede
> qualquer permissão de produção.

## Identidade do aplicativo

O nome exibido no início do aplicativo será somente:

**Point Steak House**

O texto **Painel de Gestão** não deve aparecer no menu ou cabeçalho. A logo ficará antes do nome, seguindo o estilo visual existente: marca compacta, nome em tipografia serifada e textos operacionais em tipografia sem serifa.

## Cargos padrão

### Proprietário

Nível máximo do aplicativo.

- Acesso a todas as áreas e informações críticas.
- Acesso completo a finanças, auditoria, estoque, mercado e configurações.
- Cria, edita, bloqueia e reativa usuários.
- Atribui cargos e permissões individuais.
- Cria e aprova cargos personalizados.
- Altera permissões do Administrador.
- Consulta logs de login, estornos, cancelamentos, ajustes e sincronizações.
- Pode exigir aprovação adicional para ações sensíveis.

O Proprietário não pode ser removido por outro usuário.

### Administrador

Perfil de gerente operacional e administrativo.

- Finanças e DRE gerencial conforme permissão.
- Contas a pagar, compras e reposições.
- Alertas de estoque crítico.
- Materiais próximos do vencimento e vencidos.
- Registro de material podre, perdas e desperdícios.
- Cadastro e consulta de códigos de barras.
- Inventário e ajustes autorizados.
- Visão gerencial do Mercado.
- Relatórios operacionais.

Não acessa senha, tokens, segredos, criação de cargos ou troca do Proprietário por padrão.

### Açougueiro

Perfil voltado às carnes e à produção.

- Peças brutas, cortes, lotes e origem.
- Peso, rendimento, desossa e subprodutos.
- Câmara de maturação.
- Segurança biológica das carnes.
- Validade, rastreabilidade e alertas sanitários.
- Confirmação de recebimento, pesagem, desossa, maturação, descarte e transferência.
- Consulta de estoque de carnes e solicitação de reposição.

Não acessa salários, despesas, lucro, margem, DRE, caixa, pagamentos ou estornos financeiros.

### Caixa

Perfil de operação de supermercado.

- Bipagem e busca por código de barras.
- Registro de venda, peso, preço e pagamento.
- Dinheiro, cartão, PIX e fiado conforme limites.
- Consulta de cliente para `marcar na conta`.
- Emissão de cupom/etiqueta autorizada.
- Abertura, pausa e fechamento do próprio turno.
- Sangria, suprimento e ocorrência de caixa.
- Consulta dos próprios movimentos.
- Solicitação de cancelamento, troca, devolução ou desconto.

Não acessa DRE, lucro, margem, salários, custos internos ou saldo bancário global. Não aprova o próprio estorno ou divergência.

## Permissões granulares

As permissões devem ser independentes e negadas por padrão.

Exemplos:

```text
financeiro.visualizar
financeiro.lancar
financeiro.pagar
financeiro.exportar
financeiro.ver_margem
estoque.visualizar
estoque.ajustar
estoque.repor
estoque.descartar
mercado.vender
mercado.ver_gestao
mercado.alterar_preco
mercado.aplicar_desconto
caixa.abrir_turno
caixa.fechar_turno
caixa.sangria
caixa.estornar
carne.visualizar
carne.confirmar_recebimento
carne.confirmar_desossa
carne.confirmar_maturacao
clientes.marcar_fiado
clientes.quitar_fiado
usuarios.gerenciar
cargos.solicitar
cargos.gerenciar
auditoria.visualizar
auditoria.total
```

## Matriz inicial

| Área | Proprietário | Administrador | Açougueiro | Caixa |
|---|:---:|:---:|:---:|:---:|
| Dashboard completo | ✓ | ✓ | — | — |
| Finanças/DRE | ✓ | ✓ | — | — |
| Custos e margem | ✓ | configurável | — | — |
| Reposição | ✓ | ✓ | solicitar | — |
| Alertas de validade | ✓ | ✓ | carnes | limitado |
| Código de barras | ✓ | ✓ | consulta | bipar |
| Carnes e maturação | ✓ | ✓ | ✓ | consulta mínima |
| Mercado | ✓ | visão | — | operação |
| Caixa | ✓ | ✓ | — | próprio turno |
| Usuários | ✓ | limitado | — | — |
| Cargos/permissões | ✓ | — | — | — |
| Auditoria completa | ✓ | operacional | própria ação | própria ação |

## Cargos personalizados

O painel administrativo terá criação de cargos personalizados:

1. Administrador ou Proprietário monta o cargo e seleciona permissões.
2. Administrador apenas envia uma solicitação.
3. Proprietário aprova ou recusa.
4. A aprovação exige reautenticação ou senha atual do Proprietário.
5. O cargo recebe nome, descrição, permissões, usuários e versão.
6. Toda alteração mantém permissões antigas, novas, autor, data e motivo.
7. Cargo desativado não apaga histórico.

Nenhum usuário pode criar um cargo com mais permissões do que possui. Permissões de gerenciamento de cargos, auditoria total e segredos são exclusivas do Proprietário.

## Variáveis temporárias de desenvolvimento

Durante o desenvolvimento, o primeiro Proprietário poderá ser provisionado pelo `.env`:

```env
PROPRIETARIO_CARGO=PROPRIETARIO
PROPRIETARIO_USUARIO=dono
PROPRIETARIO_SENHA=123
```

Credencial temporária de acesso:

```text
Usuário: dono
Senha: 123
```

Regras:

- `.env` não deve ser versionado.
- A senha deve ser armazenada apenas como hash.
- `123` é exclusivamente uma senha de desenvolvimento.
- `dono` é apenas o identificador simples temporário do Proprietário.
- O primeiro login deve exigir troca da senha.
- Produção deve falhar se a senha padrão permanecer ativa.
- A senha nunca aparece no frontend, logs, seed ou mensagens de erro.
- A confirmação de cargo deve validar a senha no servidor, nunca confiar no cargo enviado pelo navegador.

## APIs administrativas previstas

```text
GET   /admin/usuarios
PATCH /admin/usuarios/:id/papel
GET   /admin/cargos
POST  /admin/cargos/solicitacoes
POST  /admin/cargos/:id/aprovar
PATCH /admin/cargos/:id/permissoes
POST  /admin/cargos/:id/desativar
GET   /admin/auditoria/permissoes
POST  /admin/confirmar-proprietario
```

## Critérios de aceite

- Cada cargo vê somente o menu permitido.
- A proteção existe no frontend e no backend.
- Caixa não acessa Finanças.
- Açougueiro não acessa caixa ou DRE.
- Administrador não gerencia cargos sem autorização do Proprietário.
- Proprietário acessa todas as áreas.
- Criação de cargo personalizado exige confirmação do Proprietário.
- Alterações de permissão são versionadas e auditadas.
