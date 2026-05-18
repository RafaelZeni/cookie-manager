import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const receitas = await prisma.receita.findMany({
    where: { ativa: true },
    include: {
      ingredientes: { include: { ingrediente: true } },
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(receitas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const receita = await prisma.receita.create({
    data: {
      nome: body.nome,
      descricao: body.descricao || null,
      pesoFinal: body.pesoFinal,
      quantidadePorcoes: body.quantidadePorcoes,
      tempoPreparo: body.tempoPreparo,
      custoTotal: body.custoTotal || 0,
      custoPorUnidade: body.custoPorUnidade || 0,
      precoVenda: body.precoVenda || 0,
      margemLucro: body.margemLucro || 0,
      observacoes: body.observacoes || null,
      ingredientes: {
        create: (body.ingredientes || []).map((i: any) => ({
          ingredienteId: i.ingredienteId,
          quantidade: i.quantidade,
          unidade: i.unidade,
        })),
      },
    },
    include: { ingredientes: { include: { ingrediente: true } } },
  })

  return NextResponse.json(receita, { status: 201 })
}
