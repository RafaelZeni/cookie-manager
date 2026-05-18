'use client'

import { useState } from 'react'
import { Boxes, Package, Cookie, AlertTriangle, Clock } from 'lucide-react'
import { formatCurrency, formatDate, isVencimentoProximo, isVencido } from '@/lib/utils'

interface IngredienteEstoque {
  id: string
  nome: string
  categoria: string
  unidade: string
  estoqueAtual: number
  estoqueMinimo: number
  custoMedio: number
}

interface ProdutoEstoque {
  id: string
  lote: string
  quantidade: number
  dataValidade: Date
  producao: {
    receita: { nome: string; precoVenda: number }
  }
}

interface Props {
  estoqueIngredientes: IngredienteEstoque[]
  estoqueProdutos: ProdutoEstoque[]
}

export function EstoqueClient({ estoqueIngredientes, estoqueProdutos }: Props) {
  const [tab, setTab] = useState<'ingredientes' | 'produtos'>('ingredientes')

  const lowStock = estoqueIngredientes.filter(i => i.estoqueMinimo > 0 && i.estoqueAtual <= i.estoqueMinimo)
  const produtosVencendo = estoqueProdutos.filter(p => isVencimentoProximo(p.dataValidade))
  const produtosVencidos = estoqueProdutos.filter(p => isVencido(p.dataValidade))

  const totalProdutos = estoqueProdutos.reduce((s, p) => s + p.quantidade, 0)
  const valorEstoqueIngredientes = estoqueIngredientes.reduce((s, i) => s + i.estoqueAtual * i.custoMedio, 0)
  const valorEstoqueProdutos = estoqueProdutos.reduce((s, p) => s + p.quantidade * p.producao.receita.precoVenda, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Estoque</h1>
        <p className="page-subtitle">Ingredientes e produtos acabados</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card text-center">
          <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="font-bold">{estoqueIngredientes.length}</p>
          <p className="text-[11px] text-muted-foreground">Ingredientes</p>
          <p className="text-[10px] text-muted-foreground">{formatCurrency(valorEstoqueIngredientes)}</p>
        </div>
        <div className="stat-card text-center">
          <Cookie className="w-5 h-5 text-cookie-500 mx-auto mb-1" />
          <p className="font-bold">{totalProdutos}</p>
          <p className="text-[11px] text-muted-foreground">Cookies</p>
          <p className="text-[10px] text-muted-foreground">{formatCurrency(valorEstoqueProdutos)}</p>
        </div>
        <div className="stat-card text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className={`font-bold ${lowStock.length > 0 ? 'text-amber-600' : ''}`}>{lowStock.length}</p>
          <p className="text-[11px] text-muted-foreground">Estoque baixo</p>
        </div>
        <div className="stat-card text-center">
          <Clock className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className={`font-bold ${(produtosVencendo.length + produtosVencidos.length) > 0 ? 'text-red-600' : ''}`}>
            {produtosVencendo.length + produtosVencidos.length}
          </p>
          <p className="text-[11px] text-muted-foreground">Vencendo/Vencidos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: 'ingredientes', label: 'Ingredientes', count: estoqueIngredientes.length },
          { key: 'produtos', label: 'Produtos', count: totalProdutos },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === t.key
                ? 'border-cookie-500 text-cookie-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            <span className="text-xs bg-muted rounded-full px-1.5">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Ingredients tab */}
      {tab === 'ingredientes' && (
        <div className="space-y-2">
          {estoqueIngredientes.map(ing => {
            const isLow = ing.estoqueMinimo > 0 && ing.estoqueAtual <= ing.estoqueMinimo
            const pct = ing.estoqueMinimo > 0 ? Math.min(100, (ing.estoqueAtual / (ing.estoqueMinimo * 3)) * 100) : 50

            return (
              <div key={ing.id} className={`bg-white rounded-2xl border p-4 ${isLow ? 'border-amber-200' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{ing.nome}</p>
                    <p className="text-xs text-muted-foreground">{ing.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isLow ? 'text-amber-600' : ''}`}>
                      {ing.estoqueAtual}{ing.unidade}
                    </p>
                    {ing.estoqueMinimo > 0 && (
                      <p className="text-[11px] text-muted-foreground">mín: {ing.estoqueMinimo}{ing.unidade}</p>
                    )}
                  </div>
                </div>
                {/* Stock bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLow ? 'bg-amber-400' : pct > 60 ? 'bg-green-500' : 'bg-cookie-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Custo médio: {formatCurrency(ing.custoMedio)}/{ing.unidade}
                  {' · '}Valor em estoque: {formatCurrency(ing.estoqueAtual * ing.custoMedio)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Products tab */}
      {tab === 'produtos' && (
        <div className="space-y-2">
          {estoqueProdutos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Cookie className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhum produto em estoque
            </div>
          )}
          {estoqueProdutos.map(prod => {
            const vencido = isVencido(prod.dataValidade)
            const vencProx = !vencido && isVencimentoProximo(prod.dataValidade)

            return (
              <div key={prod.id} className={`bg-white rounded-2xl border p-4 ${
                vencido ? 'border-red-200 bg-red-50/20' :
                vencProx ? 'border-amber-200 bg-amber-50/20' :
                'border-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{prod.producao.receita.nome}</p>
                      {vencido && <span className="badge-danger">Vencido</span>}
                      {vencProx && <span className="badge-warning">Vencendo</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Lote: {prod.lote}</p>
                    <p className="text-xs text-muted-foreground">
                      Validade: <span className={vencido ? 'text-red-600 font-medium' : vencProx ? 'text-amber-600 font-medium' : ''}>
                        {formatDate(prod.dataValidade)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{prod.quantidade}</p>
                    <p className="text-xs text-muted-foreground">cookies</p>
                    <p className="text-xs text-green-600 font-medium">
                      {formatCurrency(prod.quantidade * prod.producao.receita.precoVenda)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
