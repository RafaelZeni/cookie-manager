import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const producao = await prisma.producao.update({
    where: { id: params.id },
    data: { status: body.status },
  })

  // If discarded, update stock product
  if (body.status === 'DESCARTADO') {
    await prisma.estoqueProduto.updateMany({
      where: { producaoId: params.id },
      data: { ativo: false },
    })

    await prisma.movimentacaoEstoque.create({
      data: {
        tipo: 'PERDA',
        producaoId: params.id,
        quantidade: producao.quantidadeProduzida,
        unidade: 'unidade',
        motivo: 'Lote descartado',
        referenciaId: params.id,
      },
    })
  }

  return NextResponse.json(producao)
}
