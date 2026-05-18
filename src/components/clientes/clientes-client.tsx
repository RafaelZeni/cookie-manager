'use client'

import { useState } from 'react'
import { Plus, Search, Users, Phone, Mail, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  endereco: string | null
  vendas: Array<{ total: number; dataVenda: Date }>
}

interface Props {
  clientes: Cliente[]
}

export function ClientesClient({ clientes }: Props) {
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', endereco: '' })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefone || '').includes(search)
  )

  function openCreate() {
    setSelected(null)
    setForm({ nome: '', telefone: '', email: '', endereco: '' })
    setShowDialog(true)
  }

  function openEdit(cliente: Cliente) {
    setSelected(cliente)
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      endereco: cliente.endereco || '',
    })
    setShowDialog(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome) return
    setIsLoading(true)
    try {
      const url = selected ? `/api/clientes/${selected.id}` : '/api/clientes'
      const method = selected ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast({ title: selected ? 'Cliente atualizado!' : 'Cliente cadastrado!' })
      setShowDialog(false)
      router.refresh()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este cliente?')) return
    const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Cliente excluído' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes cadastrados</p>
        </div>
        <Button onClick={openCreate} className="bg-cookie-500 hover:bg-cookie-600 text-white rounded-xl" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Novo Cliente</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum cliente encontrado</p>
          </div>
        )}
        {filtered.map(cliente => {
          const totalGasto = cliente.vendas.reduce((s, v) => s + v.total, 0)
          const ultimaCompra = cliente.vendas[0]?.dataVenda

          return (
            <div key={cliente.id} className="bg-white rounded-2xl border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-cookie-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="font-bold text-cookie-600 text-sm">{cliente.nome[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{cliente.nome}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {cliente.telefone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />{cliente.telefone}
                        </span>
                      )}
                      {cliente.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />{cliente.email}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span>{cliente.vendas.length} compras</span>
                      <span>Total: <strong>{formatCurrency(totalGasto)}</strong></span>
                      {ultimaCompra && <span>Última: {formatDate(ultimaCompra)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => openEdit(cliente)}>
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => handleDelete(cliente.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{selected ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do cliente" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, número, bairro..." className="rounded-xl" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">Cancelar</Button>
              <Button type="submit" disabled={isLoading} className="bg-cookie-500 hover:bg-cookie-600 rounded-xl">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {selected ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
