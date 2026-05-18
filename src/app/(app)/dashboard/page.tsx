import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { formatCurrency, formatDate, isVencimentoProximo, isVencido } from '@/lib/utils'
import { DashboardStats } from '@/components/dashboard/stats'
import { DashboardAlerts } from '@/components/dashboard/alerts'
import { DashboardCharts } from '@/components/dashboard/charts'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

async function getDashboardData() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [
    vendasHoje,
    vendasMes,
    producaoHoje,
    estoqueBaixo,
    produtosVencendo,
    ingredientesVencendo,
    receitasMes,
    despesasMes,
    vendasRecentes,
    topReceitas,
  ] = await Promise.all([
    prisma.venda.aggregate({
      where: {
        status: 'FECHADA',
        dataVenda: { gte: todayStart, lte: todayEnd },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venda.aggregate({
      where: {
        status: 'FECHADA',
        dataVenda: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.producao.aggregate({
      where: {
        dataProducao: { gte: todayStart, lte: todayEnd },
      },
      _sum: { quantidadeProduzida: true },
      _count: true,
    }),
    prisma.ingrediente.findMany({
      where: {
        ativo: true,
        estoqueMinimo: { gt: 0 },
      },
      select: {
        id: true,
        nome: true,
        estoqueAtual: true,
        estoqueMinimo: true,
        unidade: true,
      },
    }),
    prisma.estoqueProduto.findMany({
      where: { ativo: true },
      include: { producao: { include: { receita: true } } },
      orderBy: { dataValidade: 'asc' },
    }),
    prisma.compraIngrediente.findMany({
      where: {
        dataValidade: { not: null },
      },
      include: { ingrediente: true },
      orderBy: { dataValidade: 'asc' },
      take: 10,
    }),
    prisma.lancamentoFinanceiro.aggregate({
      where: {
        tipo: 'RECEITA',
        data: { gte: monthStart, lte: monthEnd },
      },
      _sum: { valor: true },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      where: {
        tipo: 'DESPESA',
        data: { gte: monthStart, lte: monthEnd },
      },
      _sum: { valor: true },
    }),
    prisma.venda.findMany({
      where: { status: 'FECHADA' },
      include: {
        itens: { include: { receita: true } },
        cliente: true,
      },
      orderBy: { dataVenda: 'desc' },
      take: 5,
    }),
    prisma.vendaItem.groupBy({
      by: ['receitaId'],
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 5,
    }),
  ])

  // Filter low stock
  const lowStock = estoqueBaixo.filter(i => i.estoqueAtual <= i.estoqueMinimo)

  // Filter products expiring soon or expired
  const expiringSoon = produtosVencendo.filter(
    e => isVencimentoProximo(e.dataValidade) || isVencido(e.dataValidade)
  )

  // Filter ingredient purchases expiring soon
  const ingExpiring = ingredientesVencendo.filter(
    c => c.dataValidade && (isVencimentoProximo(c.dataValidade) || isVencido(c.dataValidade))
  )

  const receitaTotal = receitasMes._sum.valor || 0
  const despesaTotal = despesasMes._sum.valor || 0
  const lucroMes = receitaTotal - despesaTotal

  return {
    stats: {
      vendasHoje: vendasHoje._sum.total || 0,
      vendasContagemHoje: vendasHoje._count,
      vendasMes: vendasMes._sum.total || 0,
      vendasContagemMes: vendasMes._count,
      producaoHoje: producaoHoje._sum.quantidadeProduzida || 0,
      producaoContagemHoje: producaoHoje._count,
      lucroMes,
      margemMes: receitaTotal > 0 ? (lucroMes / receitaTotal) * 100 : 0,
    },
    alerts: {
      lowStock,
      expiringSoon,
      ingExpiring,
    },
    vendasRecentes,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Bem-vindo de volta! 👋</h1>
        <p className="page-subtitle">Aqui está um resumo da sua operação hoje.</p>
      </div>

      <DashboardStats stats={data.stats} />
      <DashboardAlerts alerts={data.alerts} />
      <DashboardCharts />
      <RecentSales vendas={data.vendasRecentes} />
    </div>
  )
}
