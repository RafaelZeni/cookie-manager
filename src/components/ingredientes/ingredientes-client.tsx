'use client'

import { useState } from 'react'
import { Plus, Search, Package, AlertTriangle, TrendingUp, Edit, Trash2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, isVencimentoProximo } from '@/lib/utils'
import { IngredienteDialog } from './ingrediente-dialog'
import { CompraDialog } from './compra-dialog'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Ingrediente {
  id: string
  nome: string
  categoria: string
  unidade: string
  estoqueAtual: number
  estoqueMinimo: number
  custoMedio: number
  fornecedor: { nome: string } | null
  compras: Array<{
    id: string
    quantidade: number
    precoTotal: number
    precoPorUnidade: number
    dataCompra: Date
    dataValidade: Date | null
  }>
}

interface Props {
  ingredientes: Ingrediente[]
  fornecedores: Array<{ id: string; nome: string }>
}

export function IngredientesClient({ ingredientes, fornecedores }: Props) {
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [showCompraDialog, setShowCompraDialog] = useState(false)
  const [selectedIngrediente, setSelectedIngrediente] = useState<Ingrediente | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const filtered = ingredientes.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    i.categoria.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = ingredientes.filter(i => i.estoqueMinimo > 0 && i.estoqueAtual <= i.estoqueMinimo)
  const expiringSoon = ingredientes.filter(i =>
    i.compras.some(c => c.dataValidade && isVencimentoProximo(c.dataValidade))
  )

  async function handleDelete(id: string) {
    if (!confirm('Desativar este ingrediente?')) return
    const res = await fetch(`/api/ingredientes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Ingrediente desativado' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ingredientes</h1>
          <p className="page-subtitle">{ingredientes.length} ingredientes cadastrados</p>
        </div>
        <Button
          onClick={() => { setSelectedIngrediente(null); setShowDialog(true) }}
          className="bg-cookie-500 hover:bg-cookie-600 text-white rounded-xl"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="font-bold text-lg">{ingredientes.length}</p>
          <p className="text-[11px] text-muted-foreground">Total</p>
        </div>
        <div className="stat-card text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="font-bold text-lg text-amber-600">{lowStock.length}</p>
          <p className="text-[11px] text-muted-foreground">Estoque baixo</p>
        </div>
        <div className="stat-card text-center">
          <TrendingUp className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="font-bold text-lg text-red-600">{expiringSoon.length}</p>
          <p className="text-[11px] text-muted-foreground">Vencendo</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ingredientes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum ingrediente encontrado</p>
          </div>
        )}
        {filtered.map(ingrediente => {
          const isLow = ingrediente.estoqueMinimo > 0 && ingrediente.estoqueAtual <= ingrediente.estoqueMinimo
          const lastCompra = ingrediente.compras[0]
          const expiring = lastCompra?.dataValidade && isVencimentoProximo(lastCompra.dataValidade)

          return (
            <div key={ingrediente.id} className="bg-white rounded-2xl border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{ingrediente.nome}</h3>
                    <span className="badge-neutral">{ingrediente.categoria}</span>
                    {isLow && <span className="badge-warning">Estoque baixo</span>}
                    {expiring && <span className="badge-danger">Vencendo</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>
                      Estoque: <strong className={isLow ? 'text-amber-600' : 'text-foreground'}>
                        {ingrediente.estoqueAtual}{ingrediente.unidade}
                      </strong>
                      {ingrediente.estoqueMinimo > 0 && ` / mín ${ingrediente.estoqueMinimo}${ingrediente.unidade}`}
                    </span>
                    <span>
                      Custo médio: <strong>{formatCurrency(ingrediente.custoMedio)}/{ingrediente.unidade}</strong>
                    </span>
                    {ingrediente.fornecedor && (
                      <span>{ingrediente.fornecedor.nome}</span>
                    )}
                  </div>
                  {lastCompra && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Última compra: {formatDate(lastCompra.dataCompra)} — {formatCurrency(lastCompra.precoTotal)}
                      {lastCompra.dataValidade && ` · Val: ${formatDate(lastCompra.dataValidade)}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-lg"
                    onClick={() => { setSelectedIngrediente(ingrediente); setShowCompraDialog(true) }}
                    title="Registrar compra"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-lg"
                    onClick={() => { setSelectedIngrediente(ingrediente); setShowDialog(true) }}
                  >
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-lg"
                    onClick={() => handleDelete(ingrediente.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <IngredienteDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        ingrediente={selectedIngrediente}
        fornecedores={fornecedores}
      />

      {selectedIngrediente && (
        <CompraDialog
          open={showCompraDialog}
          onClose={() => setShowCompraDialog(false)}
          ingrediente={selectedIngrediente}
        />
      )}
    </div>
  )
}
