import { prisma } from '@/lib/prisma'
import { FinanceiroClient } from '@/components/financeiro/financeiro-client'
import { startOfMonth, endOfMonth } from 'date-fns'

export const metadata = { title: 'Financeiro' }

async function getData() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [lancamentos, categorias, resumoMes] = await Promise.all([
    prisma.lancamentoFinanceiro.findMany({
      include: { categoria: true, venda: true },
      orderBy: { data: 'desc' },
      take: 100,
    }),
    prisma.categoriaFinanceiro.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.lancamentoFinanceiro.groupBy({
      by: ['tipo'],
      where: { data: { gte: monthStart, lte: monthEnd } },
      _sum: { valor: true },
    }),
  ])

  const receitaMes = resumoMes.find(r => r.tipo === 'RECEITA')?._sum.valor || 0
  const despesaMes = resumoMes.find(r => r.tipo === 'DESPESA')?._sum.valor || 0

  return { lancamentos, categorias, receitaMes, despesaMes }
}

export default async function FinanceiroPage() {
  const data = await getData()
  return <FinanceiroClient {...data} />
}
