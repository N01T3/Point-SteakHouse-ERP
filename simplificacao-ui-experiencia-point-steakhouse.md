# Simplificação da UI e experiência do usuário — Point Steak House

> **Fase de amostra:** esta especificação orienta a experiência visual. Até
> `controle-producao/PAGOU.md`, dados e ações permanecem mockados, com exceção do bip do Mercado,
> que deve focar o campo e confirmar automaticamente por `Enter`.

## Objetivo

Simplificar a interface do Point Steak House para que cada usuário veja apenas as informações necessárias para executar suas tarefas e tomar decisões.

O sistema deverá utilizar **divulgação progressiva**: informações básicas aparecem primeiro; detalhes, gráficos complexos e análises avançadas ficam disponíveis somente quando solicitados.

## Princípios

- Uma ação principal por tela.
- Poucos elementos visuais por seção.
- Menus filtrados pelo cargo.
- Informações complexas ocultas por padrão.
- Alertas priorizados por criticidade.
- Textos simples, sem excesso de termos técnicos.
- Nenhuma tela operacional deve parecer uma planilha.
- O usuário deve entender rapidamente o que está acontecendo e o que precisa fazer.

## Modos de visualização

### Modo simples

Será o modo padrão para todos os usuários:

- resumo curto;
- status atual;
- alertas importantes;
- próxima ação recomendada;
- botão principal;
- últimas atividades.

### Modo detalhado

Disponível somente para o **Proprietário**. Deve incluir:

- gráficos completos;
- DRE detalhada;
- filtros avançados;
- custos e margens;
- comparações históricas;
- auditoria;
- permissões;
- configurações avançadas;
- detalhamento por canal, categoria e período.

O Proprietário poderá alternar entre **Modo simples** e **Modo detalhado**. A preferência poderá ser salva por usuário e dispositivo.

## Estrutura padrão das telas

Toda seção deverá seguir a mesma estrutura:

1. Título curto.
2. Resumo do estado atual.
3. Uma ação principal.
4. Até três indicadores importantes.
5. Alertas prioritários.
6. Tarefas pendentes.
7. Área recolhida `Ver detalhes`.

Informações que não ajudarem o usuário a entender o estado ou executar a próxima ação devem ficar ocultas ou ser removidas.

## Experiência por cargo

### Proprietário

Modo simples:

- faturamento atual;
- lucro;
- fiado;
- alertas críticos;
- atividade recente;
- botão para ativar o modo detalhado.

Modo detalhado:

- DRE completa;
- fluxo de caixa;
- comparador Fiado × Lucro;
- custos;
- margem;
- auditoria;
- permissões;
- análises avançadas.

### Administrador

Mostrar primeiro:

- tarefas pendentes;
- reposições;
- estoque crítico;
- materiais vencidos;
- materiais próximos do vencimento;
- perdas e desperdícios;
- contas a pagar;
- alertas que exigem ação.

Não mostrar análises complexas por padrão.

### Açougueiro

Mostrar somente informações relativas às carnes:

- próxima tarefa;
- recebimentos aguardando confirmação;
- desossas pendentes;
- peças em maturação;
- alertas de validade;
- alertas sanitários;
- estoque de carnes;
- botão `Confirmar etapa`.

Não exibir finanças, lucro, margem, salários ou custos administrativos.

### Caixa

Mostrar uma tela de operação rápida:

- botão grande `Nova venda`;
- bipagem;
- busca de produto/corte;
- turno atual;
- total vendido no turno;
- pagamentos pendentes;
- atalhos para sangria e fechamento.

Não exibir DRE, margem, salários, custos internos ou saldo bancário global.

## Navegação

- Mostrar somente rotas permitidas pelo cargo.
- Desktop: menu lateral simples.
- Tablet: menu lateral recolhível.
- Celular: drawer ou navegação inferior.
- Exibir no máximo quatro a seis opções principais.
- Organizar as rotas em `Operação`, `Gestão` e `Administração`.
- Colocar configurações avançadas dentro de `Administração`.
- Fechar o menu móvel após a seleção de uma rota.
- Levar o foco para o conteúdo principal após trocar de tela.
- Não exibir menus bloqueados para usuários sem permissão.

## Modelo de conteúdo das seções

Cada seção deverá priorizar:

```text
Estado atual
↓
Problema ou alerta
↓
Próxima ação
↓
Detalhes opcionais
```

Exemplo para estoque:

```text
3 itens precisam de reposição
[Ver itens críticos]

Detalhes: níveis, lotes, fornecedores e histórico
```

## Alertas

Utilizar somente três níveis:

- **Crítico:** exige ação imediata.
- **Atenção:** deve ser resolvido em breve.
- **Informativo:** serve para acompanhamento.

Regras:

- Mostrar no máximo cinco alertas na tela inicial.
- Ordenar por criticidade e prazo.
- Usar texto e ícone, não somente cor.
- Permitir abrir o item diretamente a partir do alerta.
- Agrupar alertas semelhantes.
- Exibir `Ver todos` para a lista completa.

## Finanças simplificadas

No modo simples, mostrar somente:

- receita;
- lucro líquido;
- fiado em aberto;
- despesas principais;
- fluxo de caixa resumido;
- alerta financeiro mais importante.

Os gráficos completos, DRE por categoria, custos detalhados e comparações devem ficar em `Ver detalhes` ou no modo detalhado do Proprietário.

## Gráficos

- Usar um gráfico principal por tela.
- Oferecer somente os períodos `Hoje`, `Semana` e `Mês` inicialmente.
- Esconder filtros avançados dentro de `Mais filtros`.
- Exibir tabela alternativa para cada gráfico.
- Não usar gráficos decorativos sem valor operacional.
- Explicar termos como CMV, margem e fiado com tooltip ou texto curto.
- Manter legendas legíveis em celular.
- Usar o comparador Fiado × Lucro completo apenas no modo detalhado.

## Mercado e Caixa

O fluxo de venda deve ser rápido e linear:

1. Bipar ou buscar item.
2. Informar peso ou quantidade.
3. Conferir subtotal.
4. Escolher pagamento.
5. Confirmar venda.
6. Imprimir ou exibir etiqueta/cupom.

Regras de UX:

- Carrinho sempre acessível.
- Botão `Finalizar venda` fixado na parte inferior em telas pequenas.
- Teclado numérico para peso, quantidade e dinheiro.
- Modal de pagamento simples.
- Confirmação clara após concluir.
- Impedir duplo toque que registre duas vendas.
- Mostrar o estado offline como simulação durante a amostra. Comandos pendentes
  reais só entram após `controle-producao/PAGOU.md`.

## Formulários

- Mostrar somente campos necessários para a tarefa atual.
- Campos avançados ficam em `Mais opções`.
- Usar uma coluna no celular e duas no tablet/desktop.
- Exibir erros próximos ao campo e em um resumo no topo.
- Usar `inputmode="decimal"` ou `inputmode="numeric"` quando apropriado.
- Não esconder erro apenas pela cor.
- Confirmar ações destrutivas com texto claro.

## Responsividade

### Celular

- Uma coluna.
- Drawer ou menu inferior.
- Ação principal fixa na parte inferior.
- Cards empilhados.
- Tabelas convertidas em cartões ou listas expansíveis.

### Tablet

- Menu recolhível.
- Duas colunas quando houver espaço.
- Suporte a retrato, paisagem e Split View no iPad.

### Desktop

- Menu lateral expandido.
- Grades de cards e gráficos.
- Tabelas completas.
- Modo detalhado do Proprietário disponível.

Nenhuma ação deve depender de hover ou mouse.

## Acessibilidade

- Contraste WCAG AA.
- Foco visível.
- Navegação por teclado.
- Áreas de toque mínimas de 44 × 44 px.
- Suporte a texto ampliado em 200%.
- Suporte a `prefers-reduced-motion`.
- Gráficos com descrição e tabela alternativa.
- Alertas anunciados para leitores de tela.
- Não depender somente de vermelho, amarelo ou verde.

## Estados da interface

Toda tela deverá possuir estados claros para:

- carregando;
- vazio;
- erro;
- offline;
- sincronização pendente;
- acesso negado;
- sucesso da ação.

Mensagens devem explicar o que aconteceu e, quando possível, apresentar uma ação de recuperação.

## Critérios de aceite

- O Caixa inicia uma venda em poucos toques.
- O Açougueiro encontra sua próxima tarefa imediatamente.
- O Administrador visualiza primeiro os problemas prioritários.
- O Proprietário vê um resumo simples e pode ativar o modo detalhado.
- Dados financeiros e críticos não aparecem para cargos sem permissão.
- Cada tela possui uma ação principal clara.
- Informações secundárias ficam em detalhes expansíveis.
- Nenhuma tela operacional parece uma planilha.
- A UI funciona em celular, tablet e desktop.
- Gráficos continuam compreensíveis em telas pequenas.
- Menu, conteúdo e ações respeitam o cargo autenticado.

## Ordem de implementação

1. Criar o conceito de modo simples/detalhado.
2. Implementar menu filtrado por cargo.
3. Redesenhar o Dashboard com foco em alertas e próxima ação.
4. Simplificar Mercado e Caixa.
5. Simplificar fluxos do Açougueiro.
6. Simplificar Administração.
7. Criar a experiência detalhada do Proprietário.
8. Validar responsividade em Android, iOS, tablets e desktop.
9. Executar testes de acessibilidade e usabilidade.
