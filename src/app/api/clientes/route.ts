import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientes = await prisma.cliente.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const cliente = await prisma.cliente.create({
    data: {
      nome: body.nome,
      telefone: body.telefone || null,
      email: body.email || null,
      endereco: body.endereco || null,
    },
  })
  return NextResponse.json(cliente, { status: 201 })
}
