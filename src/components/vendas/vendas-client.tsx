'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, X, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, formatDateTime, getFormaPagamentoLabel, getStatusColor } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { startOfDay, endOfDay } from 'date-fns'

interface CartItem {
  receitaId: string
  nome: string
  quantidade: number
  precoUnitario: number
}

interface Receita {
  id: string
  nome: string
  precoVenda: number
}

interface Venda {
  id: string
  status: string
  total: number
  formaPagamento: string | null
  dataVenda: Date
  cliente: { nome: string } | null
  itens: Array<{ quantidade: number; precoUnitario: number; receita: { nome: string } }>
}

interface Props {
  vendas: Venda[]
  receitas: Receita[]
  clientes: Array<{ id: string; nome: string }>
  estoque: Array<{ receitaId: string; _sum: { quantidade: number | null } }>
  userId?: string
}

export function VendasClient({ vendas, receitas, clientes, estoque, userId }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [desconto, setDesconto] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const hoje = new Date()
  const vendasHoje = vendas.filter(v => {
    const d = new Date(v.dataVenda)
    return v.status === 'FECHADA' && d >= startOfDay(hoje) && d <= endOfDay(hoje)
  })
  const totalHoje = vendasHoje.reduce((s, v) => s + v.total, 0)

  const subtotal = cart.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0)
  const total = Math.max(0, subtotal - desconto)

  function getEstoque(receitaId: string) {
    return estoque.find(e => e.receitaId === receitaId)?._sum.quantidade || 0
  }

  function addToCart(receita: Receita) {
    setCart(prev => {
      const existing = prev.find(i => i.receitaId === receita.id)
      if (existing) {
        return prev.map(i => i.receitaId === receita.id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
        )
      }
      return [...prev, {
        receitaId: receita.id,
        nome: receita.nome,
        quantidade: 1,
        precoUnitario: receita.precoVenda,
      }]
    })
  }

  function updateQty(receitaId: string, delta: number) {
    setCart(prev => prev
      .map(i => i.receitaId === receitaId ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i)
      .filter(i => i.quantidade > 0)
    )
  }

  function removeFromCart(receitaId: string) {
    setCart(prev => prev.filter(i => i.receitaId !== receitaId))
  }

  async function finalizarVenda() {
    if (!formaPagamento) {
      toast({ title: 'Selecione a forma de pagamento', variant: 'destructive' })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: cart,
          clienteId: clienteId || null,
          vendedorId: userId || null,
          formaPagamento,
          subtotal,
          desconto,
          total,
        }),
      })

      if (!res.ok) throw new Error()
      toast({ title: 'Venda finalizada!', description: `Total: ${formatCurrency(total)}` })
      setCart([])
      setShowCheckout(false)
      setFormaPagamento('')
      setDesconto(0)
      setClienteId('')
      router.refresh()
    } catch {
      toast({ title: 'Erro ao finalizar venda', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function cancelarVenda(id: string) {
    if (!confirm('Cancelar esta venda?')) return
    const res = await fetch(`/api/vendas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELADA' }),
    })
    if (res.ok) {
      toast({ title: 'Venda cancelada' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Vendas</h1>
          <p className="page-subtitle">Carrinho e histórico de vendas</p>
        </div>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="font-bold text-lg text-green-600">{formatCurrency(totalHoje)}</p>
          <p className="text-[11px] text-muted-foreground">Total Hoje</p>
        </div>
        <div className="stat-card text-center">
          <ShoppingCart className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="font-bold text-lg">{vendasHoje.length}</p>
          <p className="text-[11px] text-muted-foreground">Vendas Hoje</p>
        </div>
        <div className="stat-card text-center col-span-2 sm:col-span-1">
          <TrendingUp className="w-5 h-5 text-cookie-500 mx-auto mb-1" />
          <p className="font-bold text-lg">{formatCurrency(vendasHoje.length ? totalHoje / vendasHoje.length : 0)}</p>
          <p className="text-[11px] text-muted-foreground">Ticket Médio</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Product selection */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-sm">Produtos Disponíveis</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {receitas.map(receita => {
              const estoqueDisp = getEstoque(receita.id)
              const inCart = cart.find(i => i.receitaId === receita.id)
              return (
                <div key={receita.id} className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                  estoqueDisp === 0 ? 'opacity-50' : ''
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{receita.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(receita.precoVenda)} · Estoque: {estoqueDisp}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={estoqueDisp === 0}
                    onClick={() => addToCart(receita)}
                    className="rounded-xl bg-cookie-500 hover:bg-cookie-600 text-white h-8 px-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cart */}
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-sm flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Carrinho
            {cart.length > 0 && (
              <span className="text-xs bg-cookie-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </h2>

          {cart.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center text-muted-foreground">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Carrinho vazio</p>
              <p className="text-xs">Adicione produtos ao lado</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {cart.map(item => (
                  <div key={item.receitaId} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.precoUnitario)} cada</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="w-7 h-7 rounded-lg" onClick={() => updateQty(item.receitaId, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantidade}</span>
                      <Button variant="outline" size="icon" className="w-7 h-7 rounded-lg" onClick={() => updateQty(item.receitaId, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-sm font-semibold w-16 text-right">
                      {formatCurrency(item.quantidade * item.precoUnitario)}
                    </div>
                    <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={() => removeFromCart(item.receitaId)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border bg-muted/30 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <Button
                  onClick={() => setShowCheckout(true)}
                  className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Fechar Venda — {formatCurrency(subtotal)}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales history */}
      <div className="space-y-2">
        <h2 className="font-display font-semibold text-sm">Histórico de Vendas</h2>
        {vendas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma venda registrada
          </div>
        )}
        <div className="space-y-2">
          {vendas.map(venda => (
            <div key={venda.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{venda.cliente?.nome || 'Cliente Avulso'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusColor(venda.status)}`}>
                    {venda.status === 'FECHADA' ? 'Pago' : venda.status === 'CANCELADA' ? 'Cancelado' : 'Aberto'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {venda.itens.map(i => `${i.quantidade}x ${i.receita.nome}`).join(', ')}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDateTime(venda.dataVenda)}
                  {venda.formaPagamento && ` · ${getFormaPagamentoLabel(venda.formaPagamento)}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">{formatCurrency(venda.total)}</p>
                {venda.status === 'FECHADA' && (
                  <button
                    onClick={() => cancelarVenda(venda.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Fechar Venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order summary */}
            <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
              {cart.map(item => (
                <div key={item.receitaId} className="flex justify-between">
                  <span className="text-muted-foreground">{item.quantidade}x {item.nome}</span>
                  <span>{formatCurrency(item.quantidade * item.precoUnitario)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Select onValueChange={setClienteId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Desconto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={e => setDesconto(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>

            <div className="bg-cookie-50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Desconto</span>
                  <span>-{formatCurrency(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-cookie-200 pt-1.5">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <div className="grid grid-cols-2 gap-2">
                {['PIX', 'DINHEIRO', 'CREDITO', 'DEBITO'].map(fp => (
                  <button
                    key={fp}
                    type="button"
                    onClick={() => setFormaPagamento(fp)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      formaPagamento === fp
                        ? 'border-cookie-500 bg-cookie-50 text-cookie-700'
                        : 'border-border hover:border-cookie-300'
                    }`}
                  >
                    {fp === 'PIX' ? '📱 Pix' :
                     fp === 'DINHEIRO' ? '💵 Dinheiro' :
                     fp === 'CREDITO' ? '💳 Crédito' : '💳 Débito'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)} className="rounded-xl">Voltar</Button>
            <Button
              onClick={finalizarVenda}
              disabled={isLoading || !formaPagamento}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
            >
              {isLoading ? '...' : `Confirmar ${formatCurrency(total)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
