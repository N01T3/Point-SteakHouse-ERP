# Mercado — Point Steak House

> **Fase de entrega:** o Mercado permanece em mock até `controle-producao/PAGOU.md`. A única
> funcionalidade que pode sair do mock antes disso é o bip local: foco automático
> no campo, processamento automático como `Enter` e retorno do foco após cada
> operação. Nenhuma venda, estoque, pagamento ou fiscal será persistido antes da
> liberação.

## Objetivo

Criar a operação de mercado/balcão para venda de cortes, produtos e insumos, com bipagem, controle de estoque, pagamento, fiado e funcionamento offline.

Rota prevista: `/mercado`.

## Acesso por cargo

- **Proprietário:** acesso total e visão gerencial.
- **Administrador:** reposições, alertas, inventário, códigos de barras e visão de gestão.
- **Caixa:** operação de vendas, bipagem, pagamentos e fechamento do próprio turno.
- **Açougueiro:** consulta e confirmação dos fluxos de carne, sem operar o caixa.

O frontend deve esconder áreas não permitidas, mas toda autorização também deve existir no backend.

## Visão do Caixa

Cartões operacionais:

- Vendas do turno
- Kg vendidos
- Etiquetas pendentes
- Produtos com estoque baixo
- Pedidos aguardando separação
- Status online/offline
- Comandos pendentes de sincronização

O Caixa não verá lucro, margem, salários, custos internos, DRE ou saldo bancário global.

## Fluxo de venda

1. Abrir o turno com valor inicial.
2. Bipar código de barras ou buscar corte/produto.
3. Informar quantidade ou peso.
4. Calcular peso × preço/kg.
5. Aplicar desconto somente com permissão e motivo.
6. Escolher dinheiro, cartão, PIX ou `marcar na conta`.
7. Para fiado, identificar cliente e validar limite.
8. Confirmar a venda.
9. Baixar o estoque.
10. Registrar pedido no canal `MERCADO`.
11. Imprimir ou reimprimir etiqueta/cupom autorizado.
12. Registrar auditoria.

## Caixa de supermercado

O Caixa poderá:

- Abrir e fechar o próprio turno
- Registrar vendas
- Registrar sangria
- Registrar suprimento
- Conferir dinheiro, cartão e PIX
- Visualizar divergência do próprio fechamento
- Solicitar cancelamento, troca, devolução ou desconto

O Caixa não poderá aprovar o próprio estorno ou fechar divergência sem autorização.

## Catálogo e código de barras

Cada item poderá conter:

- Nome
- Código de barras
- Código interno
- Unidade
- Preço de venda
- Preço por kg
- Validade
- Lote
- Estoque disponível
- Estoque reservado
- Estoque mínimo
- Origem: compra, desossa ou maturação

O Administrador poderá cadastrar e corrigir códigos conforme permissão. O Caixa poderá bipar e consultar; cadastro pelo Caixa deve ser opcional e auditado.

## Estoque e validade

- Utilizar FIFO/FEFO conforme configuração.
- Alertar estoque mínimo.
- Alertar produto próximo do vencimento.
- Bloquear produto vencido.
- Registrar material podre, perda, devolução e transferência.
- Bloquear venda acima do saldo disponível, salvo permissão de ajuste.
- Permitir solicitação de reposição ao Administrador.

## Etiqueta e rastreabilidade

Etiqueta mínima:

- Nome do corte/produto
- Peso
- Preço por kg
- Total
- Data e validade
- Lote
- Pedido
- Informação sanitária configurada

Quando disponível, manter vínculo com fornecedor, peça bruta, lote de desossa e peça em maturação.

## Visão gerencial

Disponível para Proprietário e Administrador:

- Faturamento diário, semanal e mensal
- Kg vendidos
- Ticket médio
- Cortes mais vendidos
- Margem por corte, quando permitido
- Vendas fiadas do Mercado
- Estoque parado e giro
- Perdas e desperdícios
- Comparação por categoria, corte e período

## Operação offline — pós-liberação

- Registrar venda primeiro na fila local somente após `controle-producao/PAGOU.md`.
- Gerar `idempotencyKey` por operação.
- Permitir operação sem internet.
- Exibir `Offline · N pendentes`.
- Sincronizar sem duplicar venda ou baixa.
- Destacar conflitos de estoque.
- Nunca ocultar falhas de sincronização.

## Entidades previstas

- `ProdutoMercado`
- `CodigoDeBarras`
- `TurnoDeCaixa`
- `MovimentoDeCaixaOperacional`
- `Pedido`
- `ItemDePedido`
- `Lote`
- `EtiquetaDeVenda`
- `AjusteDeEstoque`
- `RegistroDeDesperdicio`

## API prevista

```text
GET  /mercado/resumo-operacional
GET  /mercado/catalogo
GET  /mercado/estoque-disponivel
POST /mercado/turnos
POST /mercado/vendas
POST /mercado/vendas/:id/finalizar
POST /mercado/vendas/:id/cancelar
POST /mercado/vendas/:id/etiqueta
POST /mercado/ajustes-estoque
GET  /mercado/historico
```

## Critérios de aceite

- Caixa consegue bipar, pesar, cobrar e finalizar venda.
- Venda finalizada baixa estoque e registra canal `MERCADO`.
- Fiado exige cliente e respeita limite.
- Produto vencido não pode ser vendido.
- Antes da liberação, o offline é apenas uma simulação visual. Depois da liberação,
  a venda offline deverá sincronizar sem duplicidade.
- Administrador recebe alertas de reposição e validade.
- Açougueiro acessa apenas dados de carne permitidos.
- Proprietário e Administrador conseguem consultar a visão gerencial.
