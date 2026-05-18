'use client'

import { useState } from 'react'
import { Plus, Factory, CheckCircle, AlertTriangle, Clock, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatDateTime, isVencimentoProximo, isVencido } from '@/lib/utils'
import { ProducaoDialog } from './producao-dialog'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { startOfDay, endOfDay } from 'date-fns'

interface Producao {
  id: string
  lote: string
  quantidadeProduzida: number
  dataProducao: Date
  dataValidade: Date
  custoProducao: number
  status: string
  receita: { id: string; nome: string; precoVenda: number }
  responsavel: { id: string; name: string | null } | null
}

interface Receita {
  id: string
  nome: string
  quantidadePorcoes: number
  custoTotal: number
  custoPorUnidade: number
  ingredientes: Array<{
    quantidade: number
    unidade: string
    ingrediente: { id: string; nome: string; estoqueAtual: number; unidade: string }
  }>
}

interface Props {
  producoes: Producao[]
  receitas: Receita[]
  userId?: string
}

export function ProducaoClient({ producoes, receitas, userId }: Props) {
  const [showDialog, setShowDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const hoje = new Date()
  const producaoHoje = producoes.filter(p => {
    const d = new Date(p.dataProducao)
    return d >= startOfDay(hoje) && d <= endOfDay(hoje)
  })

  const cookiesHoje = producaoHoje.reduce((sum, p) => sum + p.quantidadeProduzida, 0)
  const ativas = producoes.filter(p => p.status === 'ATIVO')
  const vencendo = producoes.filter(p => p.status === 'ATIVO' && isVencimentoProximo(p.dataValidade))
  const vencidas = producoes.filter(p => p.status === 'ATIVO' && isVencido(p.dataValidade))

  async function handleDiscard(id: string) {
    if (!confirm('Marcar lote como descartado?')) return
    const res = await fetch(`/api/producoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DESCARTADO' }),
    })
    if (res.ok) {
      toast({ title: 'Lote descartado' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Produção</h1>
          <p className="page-subtitle">Registro e controle de lotes produzidos</p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-cookie-500 hover:bg-cookie-600 text-white rounded-xl"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Nova Produção</span>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Cookies Hoje', value: cookiesHoje, icon: ChefHat, color: 'text-cookie-600', bg: 'bg-cookie-50' },
          { label: 'Lotes Ativos', value: ativas.length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Vencendo', value: vencendo.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Vencidos', value: vencidas.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="stat-card text-center">
              <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className={`font-bold text-xl ${card.color}`}>{card.value}</p>
              <p className="text-[11px] text-muted-foreground">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Production list */}
      <div className="space-y-2">
        <h2 className="font-display font-semibold text-sm">Histórico de Produção</h2>

        {producoes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Factory className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma produção registrada</p>
          </div>
        )}

        {producoes.map(producao => {
          const venc = isVencido(producao.dataValidade)
          const vencProx = !venc && isVencimentoProximo(producao.dataValidade)
          const receitaValorTotal = producao.receita.precoVenda * producao.quantidadeProduzida
          const lucroEstimado = receitaValorTotal - producao.custoProducao

          return (
            <div key={producao.id} className={`bg-white rounded-2xl border p-4 hover:shadow-md transition-shadow ${
              venc ? 'border-red-200 bg-red-50/30' :
              vencProx ? 'border-amber-200 bg-amber-50/30' :
              'border-border'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{producao.receita.nome}</span>
                    <span className="badge-neutral text-[10px]">Lote: {producao.lote}</span>
                    {producao.status === 'ATIVO' && !venc && !vencProx && (
                      <span className="badge-success">Ativo</span>
                    )}
                    {vencProx && <span className="badge-warning">⚠ Vencendo</span>}
                    {venc && <span className="badge-danger">✗ Vencido</span>}
                    {producao.status === 'DESCARTADO' && <span className="badge-neutral">Descartado</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>🍪 <strong className="text-foreground">{producao.quantidadeProduzida}</strong> cookies</span>
                    <span>📅 Produção: {formatDate(producao.dataProducao)}</span>
                    <span>⏱ Validade: <strong className={venc ? 'text-red-600' : vencProx ? 'text-amber-600' : 'text-foreground'}>{formatDate(producao.dataValidade)}</strong></span>
                    <span>💰 Custo: {formatCurrency(producao.custoProducao)}</span>
                    <span className={lucroEstimado >= 0 ? 'text-green-600' : 'text-red-500'}>
                      Lucro est.: {formatCurrency(lucroEstimado)}
                    </span>
                  </div>
                  {producao.responsavel?.name && (
                    <p className="text-[11px] text-muted-foreground mt-1">Responsável: {producao.responsavel.name}</p>
                  )}
                </div>
                {producao.status === 'ATIVO' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => handleDiscard(producao.id)}
                  >
                    Descartar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ProducaoDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        receitas={receitas}
        userId={userId}
      />
    </div>
  )
}
