import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    include: { categoria: true, venda: true },
    orderBy: { data: 'desc' },
    take: 200,
  })
  return NextResponse.json(lancamentos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const lancamento = await prisma.lancamentoFinanceiro.create({
    data: {
      tipo: body.tipo,
      descricao: body.descricao,
      valor: body.valor,
      data: new Date(body.data),
      categoriaId: body.categoriaId || null,
      observacoes: body.observacoes || null,
      pago: true,
    },
    include: { categoria: true },
  })

  return NextResponse.json(lancamento, { status: 201 })
}
