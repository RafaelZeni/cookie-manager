import { prisma } from '@/lib/prisma'
import { RelatoriosClient } from '@/components/relatorios/relatorios-client'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const metadata = { title: 'Relatórios' }

async function getData() {
  const now = new Date()

  // Last 6 months data
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    return { start: startOfMonth(d), end: endOfMonth(d), date: d }
  })

  const [vendasPorMes, despesasPorMes, topReceitas, formasPagamento] = await Promise.all([
    Promise.all(meses.map(m =>
      prisma.venda.aggregate({
        where: { status: 'FECHADA', dataVenda: { gte: m.start, lte: m.end } },
        _sum: { total: true },
        _count: true,
      }).then(r => ({ mes: m.date, total: r._sum.total || 0, count: r._count }))
    )),
    Promise.all(meses.map(m =>
      prisma.lancamentoFinanceiro.aggregate({
        where: { tipo: 'DESPESA', data: { gte: m.start, lte: m.end } },
        _sum: { valor: true },
      }).then(r => ({ mes: m.date, total: r._sum.valor || 0 }))
    )),
    prisma.vendaItem.groupBy({
      by: ['receitaId'],
      _sum: { quantidade: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
    }),
    prisma.venda.groupBy({
      by: ['formaPagamento'],
      where: { status: 'FECHADA' },
      _count: true,
      _sum: { total: true },
    }),
  ])

  // Get recipe names for top recipes
  const receitaIds = topReceitas.map(r => r.receitaId)
  const receitas = await prisma.receita.findMany({
    where: { id: { in: receitaIds } },
    select: { id: true, nome: true },
  })

  const topReceitasComNome = topReceitas.map(r => ({
    ...r,
    nome: receitas.find(re => re.id === r.receitaId)?.nome || 'Desconhecido',
  }))

  return { vendasPorMes, despesasPorMes, topReceitas: topReceitasComNome, formasPagamento }
}

export default async function RelatoriosPage() {
  const data = await getData()
  return <RelatoriosClient {...data} />
}
