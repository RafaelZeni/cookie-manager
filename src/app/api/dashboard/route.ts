import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()

  const [vendasHoje, vendasMes, producaoHoje, alertas] = await Promise.all([
    prisma.venda.aggregate({
      where: { status: 'FECHADA', dataVenda: { gte: startOfDay(now), lte: endOfDay(now) } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venda.aggregate({
      where: { status: 'FECHADA', dataVenda: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.producao.aggregate({
      where: { dataProducao: { gte: startOfDay(now), lte: endOfDay(now) } },
      _sum: { quantidadeProduzida: true },
    }),
    prisma.ingrediente.count({
      where: { ativo: true, estoqueMinimo: { gt: 0 } },
    }),
  ])

  return NextResponse.json({
    vendasHoje: vendasHoje._sum.total || 0,
    vendasContagemHoje: vendasHoje._count,
    vendasMes: vendasMes._sum.total || 0,
    producaoHoje: producaoHoje._sum.quantidadeProduzida || 0,
  })
}
