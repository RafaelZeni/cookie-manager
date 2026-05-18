import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const producoes = await prisma.producao.findMany({
    include: { receita: true, responsavel: { select: { id: true, name: true } } },
    orderBy: { dataProducao: 'desc' },
  })
  return NextResponse.json(producoes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Get recipe with ingredients
  const receita = await prisma.receita.findUnique({
    where: { id: body.receitaId },
    include: { ingredientes: { include: { ingrediente: true } } },
  })

  if (!receita) return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })

  const quantidadeLotes = body.quantidadeLotes || 1

  // Create production record
  const producao = await prisma.producao.create({
    data: {
      receitaId: body.receitaId,
      lote: body.lote,
      quantidadeProduzida: body.quantidadeProduzida,
      dataProducao: new Date(body.dataProducao),
      dataValidade: new Date(body.dataValidade),
      custoProducao: body.custoProducao,
      responsavelId: body.responsavelId || null,
      observacoes: body.observacoes || null,
    },
  })

  // Create stock entry for produced cookies
  await prisma.estoqueProduto.create({
    data: {
      producaoId: producao.id,
      receitaId: body.receitaId,
      lote: body.lote,
      quantidade: body.quantidadeProduzida,
      dataValidade: new Date(body.dataValidade),
    },
  })

  // Deduct ingredients from stock
  for (const ri of receita.ingredientes) {
    const quantidadeUsada = ri.quantidade * quantidadeLotes

    await prisma.ingrediente.update({
      where: { id: ri.ingredienteId },
      data: { estoqueAtual: { decrement: quantidadeUsada } },
    })

    await prisma.movimentacaoEstoque.create({
      data: {
        tipo: 'SAIDA',
        ingredienteId: ri.ingredienteId,
        producaoId: producao.id,
        quantidade: quantidadeUsada,
        unidade: ri.unidade,
        motivo: `Produção - Lote ${body.lote}`,
        referenciaId: producao.id,
      },
    })
  }

  return NextResponse.json(producao, { status: 201 })
}
