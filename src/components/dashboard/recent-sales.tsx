'use client'

import Link from 'next/link'
import { formatCurrency, formatDateTime, getFormaPagamentoLabel } from '@/lib/utils'
import { ShoppingBag, ArrowRight } from 'lucide-react'

interface RecentSalesProps {
  vendas: Array<{
    id: string
    total: number
    dataVenda: Date
    formaPagamento: string | null
    cliente: { nome: string } | null
    itens: Array<{ quantidade: number; receita: { nome: string } }>
  }>
}

export function RecentSales({ vendas }: RecentSalesProps) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">Vendas Recentes</h3>
        <Link href="/vendas" className="text-xs text-cookie-600 hover:text-cookie-700 font-medium flex items-center gap-1 transition-colors">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      {vendas.length === 0 ? (
        <div className="p-8 text-center">
          <ShoppingBag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {vendas.map((venda) => (
            <div key={venda.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
              <div className="w-8 h-8 bg-cookie-50 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-cookie-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {venda.cliente?.nome || 'Cliente Avulso'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {venda.itens.slice(0, 2).map(i => `${i.quantidade}x ${i.receita.nome}`).join(', ')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(venda.total)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {venda.formaPagamento ? getFormaPagamentoLabel(venda.formaPagamento) : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
