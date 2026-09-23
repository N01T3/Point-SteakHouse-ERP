# Especificação Funcional — ERP Point Steakhouse

> **Fase de entrega:** este documento descreve o produto-alvo. Até existir o
> arquivo `controle-producao/PAGOU.md`, a implementação permanece em modo amostra visual,
> usando mocks. A única exceção autorizada é o bip do Mercado, com foco e
> processamento automático por `Enter`.

> Lista de tudo que o sistema deve cobrir, organizada exatamente pelas abas da navegação lateral do protótipo. Cada seção abaixo é o que aquela aba vai conter. Status indica se já existe protótipo visual ou se é só planejamento até aqui.

---

## Mapa da navegação lateral

| # | Aba | Status |
|---|-----|--------|
| 1 | Dashboard | 🟡 Mock visual |
| 2 | PDV | 🟡 Mock visual + bip local |
| 3 | Desossa & Subprodutos | 🟡 Mock visual |
| 4 | Câmara de Maturação | 🟡 Mock visual |
| 5 | Segurança Biológica | 🟡 Mock visual |
| 6 | Estoque | 🟡 Mock visual |
| 7 | Financeiro & Relatórios | 🟡 Mock visual |
| 8 | Clientes | 🟡 Mock visual |
| 9 | Configurações | 🟡 Mock visual |

---

## 1. Dashboard

Visão de entrada do sistema — o que o dono vê primeiro ao logar.

- Faturamento do dia, com comparação percentual em relação a ontem
- Ticket médio da operação do Mercado/Açougue
- Saldo total em conta corrente (fiado) e número de clientes com saldo em aberto
- Contagem de peças em maturação ativas e quantas ficam prontas na semana
- Gráfico de faturamento dos últimos 7 dias
- Gráfico de faturamento por categoria, corte e período
- Ranking dos cortes mais vendidos na semana (kg e receita)
- Resumo compacto da Câmara de Maturação, com atalho para a aba completa
- Alertas de estoque baixo (atalho para o item afetado)
- Indicador de status de sincronização (Modo Híbrido "Inquebrável")
- Alternância de tema claro/escuro

---

## 2. PDV

Venda direta de carne no balcão, por peso — o ponto de venda do açougue/mercado.

- Integração com balança para venda por peso
- Geração de etiqueta de venda (peso, preço, validade, lote) — conforme exigências sanitárias
- Baixa no estoque de cortes disponíveis, vindos da Desossa e da Câmara de Maturação
- Cancelamento de item com motivo obrigatório (auditoria)
- Formas de pagamento: dinheiro, cartão, PIX, "marcar na conta"
- Emissão de cupom fiscal (NFC-e) na finalização
- Operação offline real somente após `controle-producao/PAGOU.md`; antes disso, apenas o fluxo visual é simulado

---

## 3. Desossa & Subprodutos

O diferencial técnico do sistema — transforma peça bruta em cortes vendáveis com custo real calculado.

**Desossa**
- Registro de entrada de peça bruta: fornecedor, peso, custo/kg, data de recebimento
- Ordem de desossa: uma peça bruta vira N cortes, com peso real registrado por corte
- Templates de corte configuráveis por tipo de peça (ex.: traseiro, dianteiro, ponta de agulha), reaproveitáveis a cada nova desossa
- Cálculo automático de rendimento realizado vs. esperado, com alerta quando o desvio é grande
- Cálculo automático de custo efetivo por corte (custo da peça ratado sobre o peso aproveitável + mão de obra + margem)

**Subprodutos em cascata**
- Classificação de cada saída da desossa: corte de venda, osso, sebo/gordura, apara, perda
- Destino configurável por subproduto: Caldo/Fundo, Sebo/Banha, Carne Moída/Hambúrguer, Petiscos, Descarte
- Rastreamento de rendimento e receita gerada por cada linha secundária (nada sai do sistema sem destino registrado)

---

## 4. Câmara de Maturação

- Cadastro de peça em maturação: peça de origem, técnica (dry aged / wet aged), câmara, data de entrada
- Acompanhamento por peça: peso inicial, peso atual, % de perda, dias decorridos / dias previstos, barra de progresso
- **Inteligência Preditiva para Quebra por Evaporação**: projeção da curva de peso esperado com base em técnica, temperatura, umidade e tempo decorrido; comparação peso projetado × peso real; alerta quando a peça desvia do modelo (possível falha de câmara ou variável fora do padrão)
- Recálculo automático do custo/kg da peça conforme o peso é perdido ao longo da maturação
- Monitoramento de temperatura e umidade por câmara, com indicação de "dentro da faixa ideal"
- Alerta de "peça pronta" quando atinge o tempo mínimo ou ideal de maturação
- Finalização da maturação: a peça sai da câmara e vira corte(s) disponível(is) para venda no Mercado

---

## 5. Segurança Biológica

Controle sanitário em tempo real, com visualizações gráficas — não é papelada, é operação.

- Painel de Pontos Críticos de Controle (PCCs): recebimento de matéria-prima, câmaras frias, câmara de maturação, cocção, higienização, coleta de amostras — cada um com status, responsável e horário da última verificação
- Monitoramento do tempo acumulado em zona de perigo (5°C–60°C) por dia, com limite operacional de 4 horas, e alerta automático conforme o acúmulo se aproxima do limite
- Monitoramento de Atividade de Água (Aw) por peça em maturação, com o limiar de segurança (0,85) marcado — alimentado diretamente pela Inteligência Preditiva de Evaporação da aba de Maturação
- Registro de coletas microbiológicas (mesófilos aeróbios, coliformes totais, E. coli, Salmonella spp, Listeria monocytogenes), com resultado, limite de referência e status de conformidade
- Agenda das próximas coletas
- Histórico/auditoria de verificações, pronto para consulta em caso de inspeção sanitária
- Rastreabilidade de lote: do fornecedor (registro SIF/SIE/SIM) até a venda final, vinculando dados de GTA e NF-e — permite recall por lote em minutos

---

## 6. Estoque

O ponto de encontro entre Desossa, Maturação e os dois canais de venda.

- Estoque "duplo": peças brutas (kg) e cortes derivados (kg), sempre sincronizados com a aba de Desossa
- Estoque de insumos que não são carne (bebidas, descartáveis, embalagens, acompanhamentos)
- Baixa automática por venda direta, perda, devolução, transferência e transformação de estoque
- Controle de validade com FIFO (primeiro que vence, primeiro que sai)
- Alertas de estoque mínimo, configuráveis por item
- Consulta de saldo filtrável por peça, corte, câmara ou lote de origem

---

## 7. Financeiro & Relatórios

- Fluxo de caixa diário
- Contas a pagar e a receber
- DRE gerencial da operação única do Mercado/Açougue
- Custo médio ponderado móvel por corte — absorve a sazonalidade do preço da arroba sem distorcer a margem
- Margem real por corte/prato, considerando a perda acumulada da desossa e da maturação
- Curva ABC de produtos
- Alerta de margem em risco: comparação entre custo de reposição atual e preço de venda praticado
- Relatórios exportáveis (PDF/Excel) por período, canal e categoria

---

## 8. Clientes

- Cadastro: nome, telefone, endereço, data de aniversário
- Histórico de pedidos por cliente
- Conta corrente (fiado): saldo devedor, limite de crédito configurável por cliente, bloqueio automático ao atingir o teto
- Lançamento "marcar na conta" direto no fechamento da venda no PDV
- Tela de quitação (parcial ou total), com extrato completo de lançamentos
- Programa de fidelidade/cashback — a decidir se entra no escopo inicial ou em uma fase posterior

---

## 9. Configurações

Área administrativa, não aparece como destaque no menu principal mas sustenta todas as outras abas.

- Usuários e permissões por papel: dono, caixa, açougueiro
- Cadastro de câmaras (faixa ideal de temperatura e umidade por câmara)
- Templates de desossa por tipo de peça
- Parâmetros de Segurança Biológica: limite de zona de perigo, limiar de Aw, frequência de coleta microbiológica
- Tema padrão do sistema (claro/escuro)
- Painel de status da fila offline — implementar somente após `controle-producao/PAGOU.md`; na amostra, exibir estado simulado
