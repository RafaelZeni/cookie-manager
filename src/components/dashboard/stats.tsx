'use client'

import { formatCurrency, formatPercent } from '@/lib/utils'
import { ShoppingBag, TrendingUp, Cookie, DollarSign, ArrowUp, ArrowDown } from 'lucide-react'

interface StatsProps {
  stats: {
    vendasHoje: number
    vendasContagemHoje: number
    vendasMes: number
    vendasContagemMes: number
    producaoHoje: number
    producaoContagemHoje: number
    lucroMes: number
    margemMes: number
  }
}

export function DashboardStats({ stats }: StatsProps) {
  const cards = [
    {
      title: 'Vendas Hoje',
      value: formatCurrency(stats.vendasHoje),
      sub: `${stats.vendasContagemHoje} ${stats.vendasContagemHoje === 1 ? 'venda' : 'vendas'}`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: null,
    },
    {
      title: 'Vendas do Mês',
      value: formatCurrency(stats.vendasMes),
      sub: `${stats.vendasContagemMes} ${stats.vendasContagemMes === 1 ? 'venda' : 'vendas'}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: null,
    },
    {
      title: 'Produção Hoje',
      value: `${stats.producaoHoje}`,
      sub: `${stats.producaoContagemHoje} ${stats.producaoContagemHoje === 1 ? 'lote' : 'lotes'}`,
      icon: Cookie,
      color: 'text-cookie-600',
      bg: 'bg-cookie-50',
      unit: 'cookies',
      trend: null,
    },
    {
      title: 'Lucro do Mês',
      value: formatCurrency(stats.lucroMes),
      sub: `Margem: ${formatPercent(stats.margemMes)}`,
      icon: DollarSign,
      color: stats.lucroMes >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: stats.lucroMes >= 0 ? 'bg-emerald-50' : 'bg-red-50',
      trend: stats.lucroMes >= 0 ? 'up' : 'down',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.title} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              {card.trend && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${
                  card.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {card.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </span>
              )}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">{card.title}</p>
              <p className="font-display font-bold text-lg leading-tight">
                {card.value}
                {card.unit && <span className="text-xs font-normal text-muted-foreground ml-1">{card.unit}</span>}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
