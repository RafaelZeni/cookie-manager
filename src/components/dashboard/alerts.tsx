'use client'

import Link from 'next/link'
import { AlertTriangle, Clock, Package, ArrowRight } from 'lucide-react'
import { formatDate, isVencido } from '@/lib/utils'

interface AlertsProps {
  alerts: {
    lowStock: Array<{ id: string; nome: string; estoqueAtual: number; estoqueMinimo: number; unidade: string }>
    expiringSoon: Array<{ id: string; lote: string; dataValidade: Date; producao: { receita: { nome: string } } }>
    ingExpiring: Array<{ id: string; ingrediente: { nome: string }; dataValidade: Date | null }>
  }
}

export function DashboardAlerts({ alerts }: AlertsProps) {
  const totalAlerts = alerts.lowStock.length + alerts.expiringSoon.length + alerts.ingExpiring.length

  if (totalAlerts === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
          <span className="text-lg">✅</span>
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-800">Tudo em ordem!</p>
          <p className="text-xs text-emerald-600">Nenhum alerta no momento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display font-semibold text-sm text-foreground">
        Alertas ({totalAlerts})
      </h2>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.lowStock.length > 0 && (
          <Link href="/estoque" className="group">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:border-amber-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-xs font-semibold text-amber-800">Estoque Baixo</p>
                <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                  {alerts.lowStock.length}
                </span>
              </div>
              <div className="space-y-1">
                {alerts.lowStock.slice(0, 3).map(item => (
                  <p key={item.id} className="text-xs text-amber-700 truncate">
                    • {item.nome} ({item.estoqueAtual}{item.unidade})
                  </p>
                ))}
                {alerts.lowStock.length > 3 && (
                  <p className="text-xs text-amber-600">+{alerts.lowStock.length - 3} mais</p>
                )}
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600 font-medium group-hover:gap-2 transition-all">
                Ver tudo <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        )}

        {alerts.expiringSoon.length > 0 && (
          <Link href="/estoque" className="group">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 hover:border-red-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-red-600" />
                </div>
                <p className="text-xs font-semibold text-red-800">Produtos Vencendo</p>
                <span className="ml-auto text-xs font-bold text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                  {alerts.expiringSoon.length}
                </span>
              </div>
              <div className="space-y-1">
                {alerts.expiringSoon.slice(0, 3).map(item => (
                  <p key={item.id} className="text-xs text-red-700 truncate">
                    • {item.producao.receita.nome} — Lote {item.lote}
                    {isVencido(item.dataValidade) && <span className="ml-1 font-bold">VENCIDO</span>}
                  </p>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-red-600 font-medium group-hover:gap-2 transition-all">
                Ver tudo <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        )}

        {alerts.ingExpiring.length > 0 && (
          <Link href="/ingredientes" className="group">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 hover:border-orange-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <p className="text-xs font-semibold text-orange-800">Ingredientes Vencendo</p>
                <span className="ml-auto text-xs font-bold text-orange-700 bg-orange-100 rounded-full px-2 py-0.5">
                  {alerts.ingExpiring.length}
                </span>
              </div>
              <div className="space-y-1">
                {alerts.ingExpiring.slice(0, 3).map(item => (
                  <p key={item.id} className="text-xs text-orange-700 truncate">
                    • {item.ingrediente.nome} — {item.dataValidade ? formatDate(item.dataValidade) : ''}
                  </p>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-orange-600 font-medium group-hover:gap-2 transition-all">
                Ver tudo <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
