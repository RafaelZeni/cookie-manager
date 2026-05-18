import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ingredientes = await prisma.ingrediente.findMany({
    where: { ativo: true },
    include: { fornecedor: true },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(ingredientes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const ingrediente = await prisma.ingrediente.create({
    data: {
      nome: body.nome,
      categoria: body.categoria,
      unidade: body.unidade,
      estoqueAtual: body.estoqueAtual || 0,
      estoqueMinimo: body.estoqueMinimo || 0,
      fornecedorId: body.fornecedorId || null,
    },
  })

  return NextResponse.json(ingrediente, { status: 201 })
}
