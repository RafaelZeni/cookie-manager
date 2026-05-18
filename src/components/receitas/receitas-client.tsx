'use client'

import { useState } from 'react'
import { Plus, Search, BookOpen, TrendingUp, DollarSign, Edit, Trash2, ChefHat, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { ReceitaDialog } from './receita-dialog'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ReceitaIngrediente {
  id: string
  quantidade: number
  unidade: string
  ingrediente: { id: string; nome: string; custoMedio: number; unidade: string; estoqueAtual: number }
}

interface Receita {
  id: string
  nome: string
  descricao: string | null
  pesoFinal: number
  quantidadePorcoes: number
  tempoPreparo: number
  custoTotal: number
  custoPorUnidade: number
  precoVenda: number
  margemLucro: number
  observacoes: string | null
  ingredientes: ReceitaIngrediente[]
  _count: { producoes: number }
}

interface Props {
  receitas: Receita[]
  ingredientes: Array<{ id: string; nome: string; unidade: string; custoMedio: number; estoqueAtual: number }>
}

export function ReceitasClient({ receitas, ingredientes }: Props) {
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [selected, setSelected] = useState<Receita | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const filtered = receitas.filter(r =>
    r.nome.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('Desativar esta receita?')) return
    const res = await fetch(`/api/receitas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Receita desativada' })
      router.refresh()
    }
  }

  async function handleDuplicate(receita: Receita) {
    const res = await fetch('/api/receitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...receita,
        nome: `${receita.nome} (Cópia)`,
        ingredientes: receita.ingredientes.map(i => ({
          ingredienteId: i.ingrediente.id,
          quantidade: i.quantidade,
          unidade: i.unidade,
        })),
      }),
    })
    if (res.ok) {
      toast({ title: 'Receita duplicada!' })
      router.refresh()
    }
  }

  // Calculate how many batches can be made
  function calcularBatches(receita: Receita): number {
    if (receita.ingredientes.length === 0) return 0
    const ratios = receita.ingredientes.map(ri => {
      if (ri.quantidade === 0) return Infinity
      return ri.ingrediente.estoqueAtual / ri.quantidade
    })
    return Math.floor(Math.min(...ratios))
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Receitas</h1>
          <p className="page-subtitle">{receitas.length} receitas cadastradas</p>
        </div>
        <Button
          onClick={() => { setSelected(null); setShowDialog(true) }}
          className="bg-cookie-500 hover:bg-cookie-600 text-white rounded-xl"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Nova Receita</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar receitas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Recipe cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma receita encontrada</p>
          </div>
        )}
        {filtered.map(receita => {
          const batches = calcularBatches(receita)
          const lucro = receita.precoVenda - receita.custoPorUnidade
          const missingIngredients = receita.ingredientes.filter(
            ri => ri.ingrediente.estoqueAtual < ri.quantidade
          )

          return (
            <div key={receita.id} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cookie-100 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-cookie-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{receita.nome}</h3>
                    <p className="text-xs text-muted-foreground">{receita.quantidadePorcoes} unidades · {receita.tempoPreparo}min</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={() => handleDuplicate(receita)}>
                    <Copy className="w-3.5 h-3.5 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={() => { setSelected(receita); setShowDialog(true) }}>
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={() => handleDelete(receita.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-muted/50 rounded-xl">
                  <p className="text-[10px] text-muted-foreground">Custo/un</p>
                  <p className="text-xs font-bold">{formatCurrency(receita.custoPorUnidade)}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-xl">
                  <p className="text-[10px] text-muted-foreground">Venda</p>
                  <p className="text-xs font-bold text-green-600">{formatCurrency(receita.precoVenda)}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-xl">
                  <p className="text-[10px] text-muted-foreground">Margem</p>
                  <p className={`text-xs font-bold ${receita.margemLucro >= 30 ? 'text-green-600' : receita.margemLucro >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                    {formatPercent(receita.margemLucro)}
                  </p>
                </div>
              </div>

              {/* Ingredients count + batches possible */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {receita.ingredientes.length} ingredientes · {receita._count.producoes} produções
                </span>
                <span className={`font-medium ${batches > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {batches > 0 ? `${batches} lote${batches !== 1 ? 's' : ''} possível` : '⚠ Estoque insuficiente'}
                </span>
              </div>

              {missingIngredients.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded-xl">
                  <p className="text-[11px] text-red-600 font-medium">Faltando:</p>
                  {missingIngredients.slice(0, 2).map(ri => (
                    <p key={ri.id} className="text-[11px] text-red-500">
                      • {ri.ingrediente.nome} (tem {ri.ingrediente.estoqueAtual}, precisa {ri.quantidade}{ri.unidade})
                    </p>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ReceitaDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        receita={selected}
        ingredientes={ingredientes}
      />
    </div>
  )
}
