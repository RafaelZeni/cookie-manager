import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: {
      nome: body.nome,
      telefone: body.telefone || null,
      email: body.email || null,
      endereco: body.endereco || null,
    },
  })
  return NextResponse.json(cliente)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.cliente.update({ where: { id: params.id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
}
