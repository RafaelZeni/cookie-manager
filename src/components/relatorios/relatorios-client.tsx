'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'

interface Props {
  vendasPorMes: Array<{ mes: Date; total: number; count: number }>
  despesasPorMes: Array<{ mes: Date; total: number }>
  topReceitas: Array<{ receitaId: string; nome: string; _sum: { quantidade: number | null; subtotal: number | null } }>
  formasPagamento: Array<{ formaPagamento: string | null; _count: number; _sum: { total: number | null } }>
}

const COLORS = ['#e08520', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

export function RelatoriosClient({ vendasPorMes, despesasPorMes, topReceitas, formasPagamento }: Props) {
  const chartData = vendasPorMes.map((v, i) => ({
    mes: format(new Date(v.mes), 'MMM', { locale: ptBR }),
    receita: v.total,
    despesa: despesasPorMes[i]?.total || 0,
    lucro: v.total - (despesasPorMes[i]?.total || 0),
  }))

  const totalVendas = vendasPorMes.reduce((s, v) => s + v.total, 0)
  const totalDespesas = despesasPorMes.reduce((s, d) => s + d.total, 0)
  const totalLucro = totalVendas - totalDespesas
  const margemGeral = totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0

  const pieData = formasPagamento
    .filter(f => f.formaPagamento)
    .map(f => ({
      name: f.formaPagamento === 'PIX' ? 'Pix' :
            f.formaPagamento === 'DINHEIRO' ? 'Dinheiro' :
            f.formaPagamento === 'CREDITO' ? 'Crédito' : 'Débito',
      value: f._sum.total || 0,
      count: f._count,
    }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Análise dos últimos 6 meses</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Faturamento Total', value: formatCurrency(totalVendas), color: 'text-green-600' },
          { label: 'Total Despesas', value: formatCurrency(totalDespesas), color: 'text-red-500' },
          { label: 'Lucro Total', value: formatCurrency(totalLucro), color: totalLucro >= 0 ? 'text-emerald-600' : 'text-red-600' },
          { label: 'Margem Geral', value: formatPercent(margemGeral), color: margemGeral >= 20 ? 'text-green-600' : 'text-amber-600' },
        ].map(kpi => (
          <div key={kpi.label} className="stat-card text-center">
            <p className={`font-bold text-xl ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses chart */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-display font-semibold text-sm mb-4">Receita vs Despesa (6 meses)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="receitaG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="despesaG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={65}
              tickFormatter={v => `R$${v}`} />
            <Tooltip
              formatter={(v: any, name: string) => [formatCurrency(v), name === 'receita' ? 'Receita' : name === 'despesa' ? 'Despesa' : 'Lucro']}
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="receita" stroke="#22c55e" fill="url(#receitaG)" strokeWidth={2} name="receita" />
            <Area type="monotone" dataKey="despesa" stroke="#ef4444" fill="url(#despesaG)" strokeWidth={2} name="despesa" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Profit chart */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-display font-semibold text-sm mb-4">Lucro Mensal</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={65}
              tickFormatter={v => `R$${v}`} />
            <Tooltip
              formatter={(v: any) => [formatCurrency(v), 'Lucro']}
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
            />
            <Bar dataKey="lucro" radius={[4, 4, 0, 0]}
              fill="#e08520"
              label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-display font-semibold text-sm mb-4">Produtos Mais Vendidos</h3>
          {topReceitas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {topReceitas.map((r, i) => {
                const maxVal = topReceitas[0]._sum.subtotal || 1
                const pct = ((r._sum.subtotal || 0) / maxVal) * 100
                return (
                  <div key={r.receitaId}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium truncate">{r.nome}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {r._sum.quantidade || 0} un · {formatCurrency(r._sum.subtotal || 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Payment methods pie */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-display font-semibold text-sm mb-4">Formas de Pagamento</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
                {pieData.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {p.name} ({p.count})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
