# Finanças — Point Steak House

> **Fase:** a tela e os cálculos atuais são referência/mock. O financeiro real,
> persistido e alimentado por eventos do Mercado só será iniciado após a criação
> manual de `controle-producao/PAGOU.md`. Não existe canal Salão neste escopo.

## Objetivo

Disponibilizar ao Proprietário e ao Administrador uma visão financeira confiável da operação, separando competência de caixa e permitindo controlar cada custo do negócio.

> Esta é uma visão gerencial. Ela não substitui contabilidade oficial, emissão fiscal ou orientação de contador.

## Acesso

- **Proprietário:** acesso total, incluindo informações críticas, auditoria, configurações e permissões.
- **Administrador:** acesso à gestão financeira e operacional conforme permissões concedidas.
- **Açougueiro:** sem acesso a DRE, salários, lucro, margem ou custos financeiros.
- **Caixa:** sem acesso à área financeira estratégica; acessa apenas seus movimentos e fechamento de caixa.

Rota prevista: `/financeiro`.

## Filtros

- Hoje
- Últimos 7 dias
- Mês atual
- Mês anterior
- Trimestre
- Intervalo personalizado
- Canal: Mercado/Açougue
- Visão: competência ou caixa

## Indicadores principais

- Receita bruta
- Receita líquida
- Receita recebida
- CMV — custo da mercadoria vendida
- Lucro bruto
- Lucro líquido gerencial
- Margem bruta e líquida
- Saldo de caixa
- Fiado em aberto
- Despesas do período
- Perdas e desperdícios

Cada indicador deve informar o período, a fórmula e a origem dos dados.

## Gráficos

### Fluxo de caixa

Exibir por dia, semana ou mês:

- Entradas realizadas
- Saídas realizadas
- Saldo líquido
- Saldo acumulado

Uma venda fiada aumenta contas a receber, mas não aumenta o caixa até ser paga.

### Fiado × lucro

Comparar, por período:

- Saldo de fiado inicial
- Novos lançamentos em fiado
- Recebimentos de fiado
- Saldo de fiado final
- Lucro bruto
- Lucro líquido
- Percentual do faturamento vendido a prazo
- Percentual de recebimento

Usar barras agrupadas, linha de saldo e tabela com os valores exatos. A visualização deve permitir alternar entre valores absolutos e índice base 100. Não esconder unidades usando eixo duplo sem identificação clara.

### DRE gerencial

```text
Receita bruta
(-) descontos, devoluções e cancelamentos
= Receita líquida
(-) CMV
= Lucro bruto
(-) mão de obra
(-) energia elétrica
(-) água
(-) compras e insumos
(-) taxas financeiras
(-) perdas e desperdícios
(-) aluguel, manutenção, impostos e outros
= Lucro líquido gerencial
```

Permitir visualização por período, categoria, corte e centro de custo. Custos
compartilhados devem informar a regra de rateio utilizada.

## Custos controlados

### Trabalhadores

- Salário, diária, hora extra, encargos e benefícios
- Horas ou dias trabalhados
- Área ou canal de atuação
- Rateio por percentual ou horas apontadas
- Histórico dos valores usados em períodos já fechados

### Energia e água

- Competência da conta
- Vencimento e pagamento
- Consumo em kWh ou m³, quando disponível
- Valor da conta
- Rateio entre Mercado, desossa, maturação, câmaras e áreas administrativas
- Custo por R$ 1.000 de receita e por kg vendido

### Despesas gerais

- Compras e insumos
- Gás e combustível
- Taxas de cartão, PIX e antecipação
- Aluguel e condomínio
- Manutenção
- Impostos e taxas
- Marketing
- Outros

Cada lançamento terá categoria, tipo, valor, competência, vencimento, pagamento, canal, centro de custo, responsável, observação e auditoria.

### Desperdício

Registrar item, lote, quantidade, custo unitário, valor da perda, motivo, área, data e usuário.

Motivos mínimos: validade, material podre, quebra de cadeia fria, erro de produção, excesso, desossa, maturação, devolução, dano e outros.

Indicadores:

- Perda em kg
- Perda em reais
- Percentual das compras
- Percentual da receita
- Ranking de motivos
- Ranking de itens com maior perda

## Análises recomendadas

- Margem real por corte e prato
- CMV
- Margem de contribuição
- Ponto de equilíbrio
- Curva ABC por receita, volume e margem
- Custo médio ponderado por corte
- Preço mínimo recomendado
- Aging do fiado: a vencer, 1–7, 8–30, 31–60 e acima de 60 dias
- Comparativo por categoria, corte, fornecedor e período

## Entidades previstas

- `CategoriaFinanceira`
- `LancamentoFinanceiro`
- `ContaFinanceira`
- `MovimentoDeCaixa`
- `TrabalhadorCusto`
- `ApontamentoDeMaoDeObra`
- `ContaDeEnergia`
- `ContaDeAgua`
- `RegistroDeDesperdicio`
- `RegraDeRateio`
- `LancamentoContaCorrente`

Valores monetários devem ser persistidos em centavos ou `Decimal` com precisão definida. O frontend apenas formata em BRL.

## API prevista

```text
GET  /financeiro/resumo
GET  /financeiro/fluxo-de-caixa
GET  /financeiro/dre
GET  /financeiro/fiado-vs-lucro
GET  /financeiro/custos
POST /financeiro/lancamentos
PATCH /financeiro/lancamentos/:id
POST /financeiro/lancamentos/:id/pagar
POST /financeiro/contas-de-energia
POST /financeiro/contas-de-agua
POST /financeiro/trabalhadores
POST /financeiro/desperdicios
GET  /financeiro/analises/margem
GET  /financeiro/analises/abc
GET  /financeiro/analises/ponto-de-equilibrio
GET  /financeiro/exportar
```

## Regras de segurança

- Cancelamentos e estornos não apagam histórico.
- Correções em períodos fechados devem gerar estorno auditável.
- O custo usado em uma venda deve ser congelado no momento da venda.
- Divisão por zero retorna ausência de base, nunca `NaN`.
- Desperdício não pode ser contado novamente como CMV de uma venda inexistente.
- Toda escrita valida permissão, usuário, período, origem e auditoria.

## Critérios de aceite

- Proprietário e Administrador consultam dia, semana e mês.
- Fiado × lucro funciona nas três granularidades.
- Energia, água, trabalhadores, perdas e demais custos entram na DRE.
- Lançamentos podem ser criados, pagos, cancelados e auditados.
- Os gráficos possuem tabela alternativa acessível.
- Exportações respeitam os filtros aplicados.
