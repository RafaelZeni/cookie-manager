'use client'

import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Lancamento {
  id: string
  tipo: string
  descricao: string
  valor: number
  data: Date
  categoria: { nome: string; icone: string | null } | null
  venda: { id: string } | null
}

interface Props {
  lancamentos: Lancamento[]
  categorias: Array<{ id: string; nome: string; tipo: string; icone: string | null }>
  receitaMes: number
  despesaMes: number
}

export function FinanceiroClient({ lancamentos, categorias, receitaMes, despesaMes }: Props) {
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState({ tipo: 'DESPESA', descricao: '', valor: '', categoriaId: '', data: new Date().toISOString().split('T')[0], observacoes: '' })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const lucroMes = receitaMes - despesaMes
  const margem = receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0

  const catFiltradas = categorias.filter(c => c.tipo === form.tipo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao || !form.valor) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor: parseFloat(form.valor),
          categoriaId: form.categoriaId || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Lançamento registrado!' })
      setForm({ tipo: 'DESPESA', descricao: '', valor: '', categoriaId: '', data: new Date().toISOString().split('T')[0], observacoes: '' })
      setShowDialog(false)
      router.refresh()
    } catch {
      toast({ title: 'Erro ao registrar', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    const res = await fetch(`/api/financeiro/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Lançamento excluído' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Fluxo de caixa e controle financeiro</p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-cookie-500 hover:bg-cookie-600 text-white rounded-xl"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Lançamento</span>
        </Button>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Receita do Mês', value: receitaMes, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', sign: '+' },
          { label: 'Despesas do Mês', value: despesaMes, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', sign: '-' },
          { label: 'Lucro Líquido', value: lucroMes, icon: DollarSign, color: lucroMes >= 0 ? 'text-emerald-600' : 'text-red-600', bg: lucroMes >= 0 ? 'bg-emerald-50' : 'bg-red-50', sign: '' },
          { label: 'Margem', value: margem, icon: null, color: margem >= 20 ? 'text-green-600' : margem >= 10 ? 'text-amber-600' : 'text-red-500', bg: 'bg-muted/50', isPercent: true },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                {Icon && (
                  <div className={`w-7 h-7 ${card.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">{card.label}</p>
              </div>
              <p className={`font-bold text-lg ${card.color}`}>
                {card.isPercent ? formatPercent(card.value) : formatCurrency(card.value)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Transactions list */}
      <div className="space-y-2">
        <h2 className="font-display font-semibold text-sm">Lançamentos</h2>

        {lancamentos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum lançamento registrado
          </div>
        )}

        <div className="space-y-2">
          {lancamentos.map(l => (
            <div key={l.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                l.tipo === 'RECEITA' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {l.tipo === 'RECEITA'
                  ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                  : <ArrowDownRight className="w-4 h-4 text-red-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{l.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {l.categoria ? `${l.categoria.icone || ''} ${l.categoria.nome}` : 'Sem categoria'}
                  {' · '}{formatDate(l.data)}
                  {l.venda && ' · 🛒 Venda'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-semibold text-sm ${l.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-500'}`}>
                  {l.tipo === 'RECEITA' ? '+' : '-'}{formatCurrency(l.valor)}
                </p>
                {!l.venda && (
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New entry dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Novo Lançamento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {['RECEITA', 'DESPESA'].map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo, categoriaId: '' }))}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    form.tipo === tipo
                      ? tipo === 'RECEITA'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-400 bg-red-50 text-red-700'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {tipo === 'RECEITA' ? '📈 Receita' : '📉 Despesa'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Compra de embalagens"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoriaId} onValueChange={v => setForm(f => ({ ...f, categoriaId: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {catFiltradas.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icone} {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Notas adicionais..."
                className="rounded-xl"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-cookie-500 hover:bg-cookie-600 rounded-xl">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
