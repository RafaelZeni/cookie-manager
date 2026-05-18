import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Delete existing ingredients and recreate
  await prisma.receitaIngrediente.deleteMany({ where: { receitaId: params.id } })

  const receita = await prisma.receita.update({
    where: { id: params.id },
    data: {
      nome: body.nome,
      descricao: body.descricao || null,
      pesoFinal: body.pesoFinal,
      quantidadePorcoes: body.quantidadePorcoes,
      tempoPreparo: body.tempoPreparo,
      custoTotal: body.custoTotal,
      custoPorUnidade: body.custoPorUnidade,
      precoVenda: body.precoVenda,
      margemLucro: body.margemLucro,
      observacoes: body.observacoes || null,
      versao: { increment: 1 },
      ingredientes: {
        create: (body.ingredientes || []).map((i: any) => ({
          ingredienteId: i.ingredienteId,
          quantidade: i.quantidade,
          unidade: i.unidade,
        })),
      },
    },
  })

  return NextResponse.json(receita)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.receita.update({
    where: { id: params.id },
    data: { ativa: false },
  })

  return NextResponse.json({ ok: true })
}
