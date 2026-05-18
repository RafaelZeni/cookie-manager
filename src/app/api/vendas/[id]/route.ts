import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const venda = await prisma.venda.update({
    where: { id: params.id },
    data: { status: body.status },
    include: { itens: true },
  })

  // If cancelled, reverse stock and financial
  if (body.status === 'CANCELADA') {
    // Reverse financial entry
    await prisma.lancamentoFinanceiro.deleteMany({
      where: { vendaId: params.id },
    })

    // Restore stock (simplified)
    for (const item of venda.itens) {
      const prod = await prisma.estoqueProduto.findFirst({
        where: { receitaId: item.receitaId, ativo: true },
        orderBy: { dataValidade: 'asc' },
      })

      if (prod) {
        await prisma.estoqueProduto.update({
          where: { id: prod.id },
          data: { quantidade: { increment: item.quantidade } },
        })
      }
    }
  }

  return NextResponse.json(venda)
}
