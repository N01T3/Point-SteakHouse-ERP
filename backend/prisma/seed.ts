import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/client.js'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const senhaHash = await bcrypt.hash('senha123', 10)
  await prisma.usuario.upsert({
    where: { email: 'dono@pointsteakhouse.com' },
    update: {},
    create: {
      nome: 'Dono',
      email: 'dono@pointsteakhouse.com',
      senhaHash,
      papel: 'PROPRIETARIO',
    },
  })

  const cortesRaw = [
    { nome: 'Picanha Maturada 28d', kg: 142, receita: 18460 },
    { nome: 'Ancho', kg: 98, receita: 11760 },
    { nome: 'Filé Mignon', kg: 41, receita: 7380 },
    { nome: 'Fraldinha', kg: 76, receita: 6840 },
    { nome: 'Costela Smoked', kg: 54, receita: 5940 },
  ]
  const cortes = new Map<string, string>()
  for (const corteRaw of cortesRaw) {
    const corte = await prisma.corte.upsert({
      where: { nome: corteRaw.nome },
      update: {},
      create: { nome: corteRaw.nome },
    })
    cortes.set(corte.nome, corte.id)
  }

  // Reproduz os valores de demonstração de Main.dc.html: 7 dias, Seg a Dom,
  // com split aproximado de 64% Salão / 36% Mercado por dia.
  const semanaRaw = [
    { diasAtras: 6, valor: 8200 },
    { diasAtras: 5, valor: 9400 },
    { diasAtras: 4, valor: 7600 },
    { diasAtras: 3, valor: 11200 },
    { diasAtras: 2, valor: 15800 },
    { diasAtras: 1, valor: 21300 },
    { diasAtras: 0, valor: 18900 },
  ]

  await prisma.itemDePedido.deleteMany()
  await prisma.pedido.deleteMany()

  for (const dia of semanaRaw) {
    const dataDoPedido = new Date()
    dataDoPedido.setDate(dataDoPedido.getDate() - dia.diasAtras)
    dataDoPedido.setHours(12, 0, 0, 0)

    const valorSalao = Math.round(dia.valor * 0.64)
    const valorMercado = dia.valor - valorSalao

    const pedidoSalao = await prisma.pedido.create({
      data: { canal: 'SALAO', valorTotal: valorSalao, criadoEm: dataDoPedido },
    })
    const pedidoMercado = await prisma.pedido.create({
      data: { canal: 'MERCADO', valorTotal: valorMercado, criadoEm: dataDoPedido },
    })

    // Distribui a receita do dia entre os cortes do ranking, proporcional ao peso de cada um,
    // só para popular `ItemDePedido` — o ranking real vem do agregado da semana inteira.
    const totalKg = cortesRaw.reduce((soma, corte) => soma + corte.kg, 0)
    for (const corteRaw of cortesRaw) {
      const proporcao = corteRaw.kg / totalKg
      const corteId = cortes.get(corteRaw.nome)
      if (!corteId) continue

      await prisma.itemDePedido.create({
        data: {
          pedidoId: pedidoSalao.id,
          corteId,
          pesoKg: (corteRaw.kg / semanaRaw.length) * proporcao,
          valorTotal: valorSalao * proporcao,
        },
      })
      await prisma.itemDePedido.create({
        data: {
          pedidoId: pedidoMercado.id,
          corteId,
          pesoKg: (corteRaw.kg / semanaRaw.length) * (1 - proporcao),
          valorTotal: valorMercado * proporcao,
        },
      })
    }
  }

  await prisma.pecaEmMaturacao.deleteMany()
  await prisma.pecaEmMaturacao.createMany({
    data: [
      { nome: 'Contrafilé Angus', tipo: 'dry_aged', diasAtual: 34, diasTotal: 45 },
      { nome: 'Bisteca Wagyu', tipo: 'dry_aged', diasAtual: 12, diasTotal: 60 },
      { nome: 'Picanha Nelore', tipo: 'wet_aged', diasAtual: 8, diasTotal: 10 },
    ],
  })

  await prisma.contaCorrente.deleteMany()
  await prisma.cliente.deleteMany()
  const nomesDeClientes = [
    'Ana Ferreira',
    'Bruno Alves',
    'Carla Souza',
    'Diego Lima',
    'Eduarda Melo',
    'Felipe Costa',
    'Gabriela Rocha',
    'Henrique Dias',
    'Isabela Pinto',
    'João Barbosa',
    'Karina Nunes',
    'Lucas Teixeira',
  ]
  const saldoPorCliente = 4350 / nomesDeClientes.length
  for (const nome of nomesDeClientes) {
    await prisma.cliente.create({
      data: { nome, contaCorrente: { create: { saldoDevedor: saldoPorCliente } } },
    })
  }

  await prisma.itemDeEstoque.deleteMany()
  await prisma.itemDeEstoque.createMany({
    data: [{ nome: 'Filé Mignon', quantidadeAtual: 3.2, quantidadeMinima: 10, unidade: 'kg' }],
  })

  console.log('Seed concluído.')
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
