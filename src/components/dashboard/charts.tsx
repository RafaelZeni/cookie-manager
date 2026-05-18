'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const mockVendasData = [
  { mes: 'Jan', receita: 2400, despesa: 1800 },
  { mes: 'Fev', receita: 1398, despesa: 1200 },
  { mes: 'Mar', receita: 3800, despesa: 2200 },
  { mes: 'Abr', receita: 3908, despesa: 2100 },
  { mes: 'Mai', receita: 4800, despesa: 2400 },
  { mes: 'Jun', receita: 3800, despesa: 2300 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name === 'receita' ? 'Receita' : 'Despesa'}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue vs Expenses */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-display font-semibold text-sm mb-4">Receita vs Despesa (6 meses)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={mockVendasData}>
            <defs>
              <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="despesaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60}
              tickFormatter={(v) => `R$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="receita" stroke="#22c55e" fill="url(#receitaGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="despesa" stroke="#ef4444" fill="url(#despesaGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-0.5 bg-green-500 rounded" />
            Receita
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-0.5 bg-red-500 rounded" />
            Despesa
          </div>
        </div>
      </div>

      {/* Top selling */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-display font-semibold text-sm mb-4">Vendas por Produto</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={[
            { nome: 'Chocolate', qtd: 120 },
            { nome: 'Nutella', qtd: 95 },
            { nome: 'Baunilha', qtd: 78 },
            { nome: 'Amendoim', qtd: 65 },
            { nome: 'Limão', qtd: 42 },
          ]} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="nome" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip
              formatter={(v) => [`${v} un.`, 'Qtd.']}
              contentStyle={{ borderRadius: '12px', border: '1px solid hsl(35 20% 88%)', fontSize: 12 }}
            />
            <Bar dataKey="qtd" fill="#e08520" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
