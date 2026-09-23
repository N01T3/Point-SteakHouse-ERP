#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera PDF comercial Point SteakHouse."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, HRFlowable, KeepTogether)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

OUT = "Point-SteakHouse-Apresentacao-Comercial.pdf"

VINHO = HexColor("#6B1414")
VINHO2 = HexColor("#8E1E1E")
DOURO = HexColor("#C9A86A")
DOURO_DARK = HexColor("#8C7346")
FUNDO = HexColor("#FFF9F2")
CINZA = HexColor("#4B4B4B")
CINZA_CLARO = HexColor("#F3EDE4")
VERDE = HexColor("#1B7A3D")
LARANJA = HexColor("#B4640A")
PRETO = HexColor("#1A1A1A")

def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFillColor(VINHO)
        canvas.rect(0, A4[1]-14*mm, A4[0], 14*mm, fill=1, stroke=0)
        canvas.setFillColor(white)
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawString(15*mm, A4[1]-9*mm, "POINT STEAKHOUSE")
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(A4[0]-15*mm, A4[1]-9*mm, "Gestão completa para açougue e mercado de carnes")
        canvas.setFillColor(CINZA)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawCentredString(A4[0]/2, 10*mm, f"Página {doc.page}")
        canvas.setStrokeColor(DOURO)
        canvas.setLineWidth(0.8)
        canvas.line(15*mm, 12.5*mm, A4[0]-15*mm, 12.5*mm)
    canvas.restoreState()

sTitulo = ParagraphStyle("titulo", fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=VINHO, alignment=TA_LEFT)
sSub = ParagraphStyle("sub", fontName="Helvetica", fontSize=11, leading=15, textColor=CINZA, alignment=TA_LEFT)
sH1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=VINHO, spaceBefore=6, spaceAfter=6)
sH2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=PRETO, spaceBefore=8, spaceAfter=4)
sP = ParagraphStyle("p", fontName="Helvetica", fontSize=9.5, leading=14, textColor=PRETO, alignment=TA_JUSTIFY, spaceAfter=4)
sLi = ParagraphStyle("li", fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=PRETO, leftIndent=14, spaceAfter=2.5)
sSmall = ParagraphStyle("small", fontName="Helvetica", fontSize=8.2, leading=11, textColor=CINZA, alignment=TA_LEFT)
sCenter = ParagraphStyle("center", fontName="Helvetica", fontSize=9.5, leading=14, textColor=CINZA, alignment=TA_CENTER)
sTag = ParagraphStyle("tag", fontName="Helvetica-Bold", fontSize=7.5, leading=10, textColor=white, alignment=TA_CENTER)

def tag(texto, cor):
    t = Table([[Paragraph(texto, sTag)]], colWidths=[38*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), cor),
        ("ROUNDEDCORNERS", [4,4,4,4]),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ]))
    return t

def bullet(txt):
    return Paragraph(f"<font color='#8E1E1E'>•</font>&nbsp;&nbsp;{txt}", sLi)

def check(txt):
    return Paragraph(f"<font color='#1B7A3D'><b>OK</b></font>&nbsp;&nbsp;{txt}", sLi)

def star(txt):
    return Paragraph(f"<font color='#B4640A'><b>+</b></font>&nbsp;&nbsp;{txt}", sLi)

def barra_ouro():
    return HRFlowable(width="100%", thickness=1.2, color=DOURO, spaceAfter=6, spaceBefore=4)

def tabela_modulo(linhas):
    # linhas: [(modulo, descricao)]
    dados = [[Paragraph("<b><font color='#FFFFFF'>Módulo</font></b>", sLi),
              Paragraph("<b><font color='#FFFFFF'>O que o sistema faz</font></b>", sLi)]]
    for m, d in linhas:
        dados.append([Paragraph(f"<b>{m}</b>", sLi), Paragraph(d, sLi)])
    t = Table(dados, colWidths=[52*mm, 118*mm])
    estilo = [
        ("BACKGROUND", (0,0), (-1,0), VINHO),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("GRID", (0,0), (-1,-1), 0.5, HexColor("#D8CFC0")),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, CINZA_CLARO]),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ]
    t.setStyle(TableStyle(estilo))
    return t

story = []

# ===== CAPA =====
story.append(Spacer(1, 22*mm))
story.append(tag("AÇOUGUE &nbsp;•&nbsp; MERCADO DE CARNES &nbsp;•&nbsp; GESTÃO COMPLETA", VINHO))
story.append(Spacer(1, 6*mm))
story.append(Paragraph("POINT<br/>STEAKHOUSE", ParagraphStyle("capa", fontName="Helvetica-Bold", fontSize=44, leading=44, textColor=VINHO)))
story.append(Spacer(1, 3*mm))
story.append(Paragraph("Do recebimento à venda — controle total de peças, cortes,<br/>lotes, validade, margem e rastreabilidade.", ParagraphStyle("capaSub", fontName="Helvetica", fontSize=12, leading=17, textColor=CINZA)))
story.append(Spacer(1, 5*mm))
story.append(barra_ouro())
story.append(Paragraph("PDV &nbsp;•&nbsp; Estoque por lote &nbsp;•&nbsp; Desossa &nbsp;•&nbsp; Maturação &nbsp;•&nbsp; Fornecedores &nbsp;•&nbsp; Fiado &nbsp;•&nbsp; Financeiro gerencial &nbsp;•&nbsp; Fiscal &nbsp;•&nbsp; Pagamentos &nbsp;•&nbsp; Balança &nbsp;•&nbsp; Impressão térmica &nbsp;•&nbsp; Offline &nbsp;•&nbsp; IA", sCenter))
story.append(Spacer(1, 8*mm))

destaques = [
    [Paragraph("<b><font color='#6B1414' size=16>100%</font></b><br/><font color='#4B4B4B' size=8>foco em açougue,<br/>sem módulo de restaurante</font>", sCenter),
     Paragraph("<b><font color='#6B1414' size=16>FEFO</font></b><br/><font color='#4B4B4B' size=8>baixa automática pelo<br/>lote mais próximo do vencimento</font>", sCenter),
     Paragraph("<b><font color='#6B1414' size=16>360°</font></b><br/><font color='#4B4B4B' size=8>compra -> lote -> corte -><br/>venda -> margem</font>", sCenter)],
]
t0 = Table(destaques, colWidths=[56*mm, 56*mm, 56*mm])
t0.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), CINZA_CLARO),
    ("ROUNDEDCORNERS", [8,8,8,8]),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
]))
story.append(t0)
story.append(Spacer(1, 8*mm))
story.append(Paragraph("Documento comercial — apresentação completa do sistema, módulos, relatórios, integrações e roadmap de evolução. Ideal para avaliação, implantação e expansão.", sSmall))
story.append(Paragraph("Compra -> Recebimento -> Lote / Cadeia fria -> Peça bruta -> Desossa / Maturação -> Corte -> Estoque -> Venda -> Cliente -> Margem -> Rastreabilidade.", sSmall))

# ===== 1 VISÃO =====
story.append(PageBreak())
story.append(Paragraph("1 &nbsp;•&nbsp; Visão geral", sH1))
story.append(barra_ouro())
story.append(Paragraph("O Point SteakHouse é um sistema de gestão especializado para açougue e mercado de carnes. Ele organiza toda a operação em um fluxo único, do recebimento da peça até a margem de cada venda, com controle de lote, validade, cadeia fria, desossa, maturação, estoque, PDV, clientes, fornecedores e financeiro.", sP))
story.append(Paragraph("Fluxo operacional coberto pelo sistema", sH2))
story.append(tabela_modulo([
    ("Compra e recebimento", "Pedido ao fornecedor, recebimento com conferência, registro de temperatura, divergência, quarentena e entrada por lote com custo e validade."),
    ("Lote e cadeia fria", "Cada lote possui código, quantidade, validade, local (câmara, balcão, loja), estado (liberado, quarentena, bloqueado) e histórico de movimentos."),
    ("Peça bruta e desossa", "Transformação de peças em cortes derivados com rendimento real, perdas de desossa, custo efetivo por kg e rastreabilidade origem -> destino."),
    ("Maturação", "Câmaras de maturação com controle de tempo, perda por evaporação, acompanhamento e liberação para venda."),
    ("Estoque e validade", "Estoque por produto e por lote, FEFO automático na venda, transferências, inventário, alertas de mínimo, vencimento e sugestão de reposição."),
    ("Venda e cliente", "PDV rápido com EAN/PLU, peso variável, descontos, promoções, fiado, reservas, preferências de corte e histórico de compras."),
    ("Margem e rastreabilidade", "Cada venda guarda custo, grupo/subgrupo, lote e operador. É possível saber a margem por produto, corte, grupo, hora, operador e fornecedor."),
]))
story.append(Spacer(1, 3*mm))
story.append(Paragraph("Papéis de acesso: Proprietário, Administrador, Açougueiro e Caixa — cada um com permissões e aprovações próprias (preço, desconto, perda, inventário, cancelamento).", sP))

# ===== 2 PDV =====
story.append(Paragraph("2 &nbsp;•&nbsp; Frente de caixa (PDV)", sH1))
story.append(barra_ouro())
for b in [
    check("<b>Venda rápida:</b> busca por nome, EAN com leitor USB/Bluetooth, PLU, leitura de peso e seleção de corte."),
    check("<b>Peso variável:</b> produtos por kg com preço automático, etiqueta GS1 e conferência de peso."),
    check("<b>Descontos e promoções:</b> desconto promocional e manual com permissão, aprovação e registro em auditoria."),
    check("<b>Venda suspensa e retomada:</b> pausa a venda no balcão sem perder os itens."),
    check("<b>Pagamento dividido:</b> dinheiro, cartão, PIX e fiado na mesma venda, com troco e fechamento por turno."),
    check("<b>Fiado / crediário:</b> limite por cliente, aging, baixa parcial e histórico — integrado ao contas a receber."),
    check("<b>Devolução e cancelamento auditável:</b> vendas canceladas preservadas para auditoria, sem distorcer faturamento."),
    check("<b>Turno e fechamento de caixa:</b> abertura com fundo, sangria, suprimento, fechamento cego e divergência por operador."),
    star("<b>Multi-caixa e multi-turno:</b> operação simultânea com sincronização e fechamento consolidado."),
    star("<b>Modo offline:</b> vende sem internet e sincroniza automaticamente ao reconectar, sem duplicar vendas."),
    star("<b>Impressão térmica ESC/POS:</b> cupom não fiscal, romaneio, etiqueta de balcão e comprovante de fiado."),
    star("<b>NFC-e / NF-e no PDV:</b> emissão, cancelamento, inutilização, DANFE e contingência offline."),
    star("<b>TEF + PIX integrado:</b> Stone, Cielo, Rede, Vero e PIX com confirmação automática e conciliação."),
    star("<b>Balança integrada:</b> leitura automática de peso no PDV e na etiqueta, sem digitação manual."),
]:
    story.append(b)
story.append(Spacer(1, 2*mm))

# ===== 3 ESTOQUE =====
story.append(Paragraph("3 &nbsp;•&nbsp; Estoque, lotes, desossa e maturação", sH1))
story.append(barra_ouro())
for b in [
    check("<b>Estoque por produto e por lote:</b> saldo em kg e unidades, custo médio, mínimo, alvo e valor em custo e venda."),
    check("<b>Validade e FEFO:</b> a venda baixa automaticamente o lote com vencimento mais próximo; validades críticas em destaque."),
    check("<b>Quarentena e bloqueio:</b> lote em quarentena ou bloqueado não vende até liberação documentada."),
    check("<b>Múltiplos locais:</b> câmara fria, balcão, loja e depósito, com transferência entre locais e motivo."),
    check("<b>Inventário físico:</b> contagem por produto/lote, divergência, aprovação e ajuste com auditoria."),
    check("<b>Recall por lote:</b> localize em segundos todas as vendas e clientes de um lote."),
    check("<b>Desossa com rendimento real:</b> peça de origem -> cortes derivados, quebra técnica, custo efetivo por corte."),
    check("<b>Maturação controlada:</b> entrada, tempo, perda por evaporação, liberação e custo final."),
    check("<b>Segurança biológica:</b> registro de temperatura, quebra de cadeia fria, perdas sanitárias e descarte rastreado."),
    check("<b>Alertas inteligentes:</b> estoque mínimo, lote vencendo, ruptura prevista e sugestão de compra."),
    star("<b>Importação de XML de compra:</b> entrada automática de nota, conferência pedido × nota × recebimento."),
    star("<b>Previsão de demanda:</b> reposição sugerida por histórico, sazonalidade e curva de venda por corte."),
]:
    story.append(b)
story.append(Spacer(1, 2*mm))

# ===== 4 COMPRAS CLIENTES =====
story.append(Paragraph("4 &nbsp;•&nbsp; Compras, fornecedores, clientes e equipe", sH1))
story.append(barra_ouro())
story.append(Paragraph("Compras e fornecedores", sH2))
for b in [
    check("<b>Cadastro de fornecedores</b> com contato, prazo médio de entrega e histórico de preços."),
    check("<b>Pedido de compra</b> manual ou gerado por reposição, com status e recebimento parcial."),
    check("<b>Recebimento conferido:</b> quantidade, custo, lote, validade, temperatura e divergência com quarentena."),
    check("<b>Custo médio ponderado</b> atualizado a cada entrada; histórico de custo por fornecedor."),
    star("<b>Contas a pagar da compra:</b> a entrada gera títulos, vencimentos e fluxo de caixa projetado."),
    star("<b>Portal/catálogo do fornecedor e cotação</b> para comparação de preço por kg."),
]:
    story.append(b)
story.append(Paragraph("Clientes, fiado e fidelidade", sH2))
for b in [
    check("<b>Cadastro completo:</b> contato, endereço, limite de fiado, preferências de corte e observações."),
    check("<b>Histórico de compras, reservas e encomendas</b> por cliente."),
    check("<b>Fiado com controle:</b> saldo, vencimento, cobrança e baixa — sem planilha paralela."),
    star("<b>Fidelidade e cashback:</b> pontos por compra, campanhas e ofertas por perfil de consumo."),
    star("<b>WhatsApp e catálogo:</b> aviso de oferta, cobrança lembrete, encomenda e catálogo de cortes."),
]:
    story.append(b)
story.append(Paragraph("Equipe e segurança", sH2))
for b in [
    check("<b>Perfis:</b> Proprietário, Administrador, Açougueiro e Caixa, com permissões por ação."),
    check("<b>Auditoria completa:</b> quem vendeu, cancelou, ajustou preço, deu desconto, moveu estoque ou liberou lote."),
    check("<b>Aprovação com reautenticação</b> para ações sensíveis."),
    star("<b>Autenticação central + backup automático, LGPD, consentimento e trilhas centralizadas.</b>"),
]:
    story.append(b)

# ===== 5 FINANCEIRO =====
story.append(PageBreak())
story.append(Paragraph("5 &nbsp;•&nbsp; Financeiro e relatórios gerenciais", sH1))
story.append(barra_ouro())
story.append(Paragraph("O financeiro é conectado à operação: cada venda, perda, compra e ajuste alimenta caixa, CMV, margem e DRE — sem retrabalho.", sP))
for b in [
    check("<b>Contas a pagar e a receber</b> com vencimento, status, baixa e projeção."),
    check("<b>Fluxo de caixa</b> realizado + projetado, por dia, com entradas por forma de pagamento."),
    check("<b>DRE gerencial:</b> receita, CMV, margem bruta, despesas fixas/variáveis e lucro operacional."),
    check("<b>CMV real por lote:</b> custo efetivo pós-desossa e maturação, não apenas preço de compra."),
    check("<b>Margem por produto, corte, grupo e subgrupo</b> — com snapshot histórico (mudança no cadastro não reescreve o passado)."),
    check("<b>Relatório por hora (24 faixas):</b> descubra pico de movimento, hora fraca e melhor hora para oferta."),
    check("<b>Relatório por operador, forma de pagamento e fornecedor.</b>"),
    check("<b>Perdas por grupo, motivo e validade:</b> validade, deterioração, quebra de frio, desossa, dano."),
    check("<b>Ponto de equilíbrio (break-even)</b> e simulação de preço e margem."),
    check("<b>Curva ABC, ticket médio, giro e ruptura.</b>"),
    check("<b>Exportação CSV</b> de vendas, estoque, financeiro e relatórios gerenciais."),
    star("<b>Conciliação bancária e de cartões, boletos, CNAB e integração contábil.</b>"),
    star("<b>Apuração fiscal e obrigações (SPED, EFD, Sintegra/GIA) com base nas vendas e notas.</b>"),
]:
    story.append(b)
story.append(Spacer(1, 2*mm))
story.append(Paragraph("Exemplos de perguntas que o sistema responde", sH2))
story.append(tabela_modulo([
    ("Qual corte dá mais lucro?", "Margem real por produto e grupo, com CMV efetivo e perdas descontadas."),
    ("Que horas vendem mais?", "Mapa de calor por hora + faturamento por faixa, por dia e por operador."),
    ("Onde estou perdendo?", "Perdas por grupo, motivo, lote e validade — com valor e % sobre compra."),
    ("Qual fornecedor compensa?", "Custo médio, prazo, divergência e margem gerada por fornecedor."),
    ("Posso dar desconto?", "Simulação de margem e ponto de equilíbrio antes de precificar."),
]))

# ===== 6 FISCAL PAG HARD =====
story.append(Paragraph("6 &nbsp;•&nbsp; Fiscal, pagamentos, hardware e operação contínua", sH1))
story.append(barra_ouro())
for b in [
    star("<b>Fiscal completo:</b> NFC-e, NF-e, cancelamento, carta de correção, inutilização, XML, DANFE, certificado A1/A3, homologação/produção por UF, contingência."),
    star("<b>Pagamentos reais:</b> TEF (Stone, Cielo, Rede, Vero e outras), PIX com confirmação, parcelamento com adquirente e conciliação automática."),
    star("<b>Hardware de balcão:</b> balança, leitor, impressora térmica ESC/POS, gaveta, pinpad — com bridge local de impressão e comunicação serial/USB/IP."),
    star("<b>Operação offline de verdade:</b> PDV, estoque e financeiro funcionam sem internet; sincronização com fila idempotente entre terminais."),
    star("<b>Multi-loja e multi-caixa</b> com estoque centralizado e consulta em tempo real."),
    star("<b>Backup automático, restauração testada, monitoramento e logs centralizados.</b>"),
]:
    story.append(b)
story.append(Paragraph("Para o açougue, balança + impressora térmica + NFC-e + TEF/PIX são o coração da operação — todos contemplados no desenho do sistema.", sP))

# ===== 7 IA INTEGRA ROADMAP =====
story.append(Paragraph("7 &nbsp;•&nbsp; Inteligência, integrações e mobilidade", sH1))
story.append(barra_ouro())
story.append(Paragraph("Inteligência aplicada à operação", sH2))
for b in [
    check("<b>Dashboard operacional:</b> faturamento, ticket, vendas, fiado, top cortes, alertas de estoque e validade."),
    check("<b>Projeção de caixa e reposição</b> a partir do ritmo de vendas."),
    star("<b>IA preditiva treinada na sua operação:</b> previsão de demanda por corte, dia e hora; sugestão de compra; detecção de anomalias (quebra, desvio, perda anormal)."),
    star("<b>Precificação inteligente:</b> sugestão de preço por margem alvo, giro e concorrência."),
]:
    story.append(b)
story.append(Paragraph("Integrações e mobilidade", sH2))
for b in [
    star("<b>Contábil/ERP:</b> Omie, Conta Azul, SAP, TOTVS — vendas, estoque e financeiro sincronizados."),
    star("<b>Vendas externas:</b> iFood, Rappi, Mercado Livre, Shopee, Magalu, Amazon + catálogo WhatsApp."),
    star("<b>Logística:</b> Loggi e transportadoras para entrega e encomenda."),
    star("<b>Bancos e contabilidade:</b> extrato, conciliação, boletos e documentos para o contador."),
    star("<b>Mobilidade:</b> web responsiva, tablet no balcão, PWA instalável e consulta remota em tempo real."),
]:
    story.append(b)
story.append(Paragraph("Roadmap de evolução", sH2))
story.append(tabela_modulo([
    ("Fase 1 — Operação", "PDV, catálogo EAN/PLU/peso, descontos, fiado, turnos, estoque por lote, FEFO, transferências, inventário, desossa, maturação, segurança biológica, clientes, relatórios por grupo/hora/operador/pagamento e DRE/CMV/margem."),
    ("Fase 2 — Produção", "Backend + PostgreSQL, autenticação real, NFC-e/NF-e, TEF/PIX, balança, impressora ESC/POS, offline com sincronização, backup, LGPD e homologação fiscal."),
    ("Fase 3 — Escala", "XML de compra, conciliação bancária, multi-caixa/loja, PWA, fidelidade/cashback, WhatsApp, contábil, delivery/marketplace e IA preditiva treinada."),
]))
story.append(Spacer(1, 2*mm))

# ===== 8 ESCOPO + FECHAMENTO =====
story.append(Paragraph("8 &nbsp;•&nbsp; Escopo e próximos passos", sH1))
story.append(barra_ouro())
story.append(Paragraph("Foco especializado — sem módulo de restaurante", sH2))
story.append(Paragraph("Por decisão de produto, o sistema não inclui salão, mesas, garçons, cozinha, pratos preparados ou comandas. O foco é 100% no ciclo de açougue e mercado de carnes, o que torna a operação mais simples, rápida e precisa para a sua realidade.", sP))
story.append(Paragraph("O que você recebe", sH2))
for b in [
    check("Sistema validado em protótipo operacional com PDV, estoque, lotes, desossa, maturação e financeiro."),
    check("Relatórios gerenciais prontos para decisão diária: margem, hora, operador, pagamento, fornecedor e perdas."),
    check("Rastreabilidade completa: do fornecedor e lote até a venda e o cliente."),
    star("Plano de produção com fiscal, pagamentos, hardware, offline, backup e IA — sem trocar de sistema."),
]:
    story.append(b)
story.append(Spacer(1, 4*mm))
c2a = Table([[Paragraph("<b><font color='#FFFFFF' size=11>Point SteakHouse — pronto para organizar sua operação hoje e escalar amanhã.</font></b><br/><font color='#F3EDE4' size=9>Agende uma demonstração no PDV, no estoque por lote e nos relatórios gerenciais. Traga seus cortes, fornecedores e preços — saia com margem calculada.</font>", ParagraphStyle("cta", fontName="Helvetica", fontSize=9.5, leading=13, textColor=white))]], colWidths=[168*mm])
c2a.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), VINHO),
    ("ROUNDEDCORNERS", [10,10,10,10]),
    ("TOPPADDING", (0,0), (-1,-1), 12),
    ("BOTTOMPADDING", (0,0), (-1,-1), 12),
    ("LEFTPADDING", (0,0), (-1,-1), 12),
    ("RIGHTPADDING", (0,0), (-1,-1), 12),
]))
story.append(c2a)
story.append(Spacer(1, 4*mm))
story.append(Paragraph("Legenda: ✓ recurso operacional validado &nbsp;&nbsp;•&nbsp;&nbsp; ★ expansão de produção contemplada no desenho do sistema (homologação com credenciais/equipamentos do cliente).", sSmall))

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=15*mm, rightMargin=15*mm, topMargin=18*mm, bottomMargin=15*mm, title="Point SteakHouse - Apresentação Comercial", author="Point SteakHouse")
doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(f"OK: {OUT}")
