import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const ingrediente = await prisma.ingrediente.update({
    where: { id: params.id },
    data: {
      nome: body.nome,
      categoria: body.categoria,
      unidade: body.unidade,
      estoqueAtual: body.estoqueAtual,
      estoqueMinimo: body.estoqueMinimo,
      fornecedorId: body.fornecedorId || null,
    },
  })

  return NextResponse.json(ingrediente)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.ingrediente.update({
    where: { id: params.id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
}
