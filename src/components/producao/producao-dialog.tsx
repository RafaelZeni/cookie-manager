'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle } from 'lucide-react'
import { formatCurrency, generateLote } from '@/lib/utils'

const schema = z.object({
  receitaId: z.string().min(1, 'Selecione uma receita'),
  quantidadeLotes: z.coerce.number().int().positive('Informe quantos lotes'),
  dataProducao: z.string(),
  dataValidade: z.string(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  receitas: Array<{
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
  }>
  userId?: string
}

export function ProducaoDialog({ open, onClose, receitas, userId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReceita, setSelectedReceita] = useState<typeof receitas[0] | null>(null)
  const [loteGerado] = useState(generateLote())

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantidadeLotes: 1,
      dataProducao: new Date().toISOString().split('T')[0],
      dataValidade: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  })

  const watchLotes = watch('quantidadeLotes') || 1

  // Check ingredient availability
  const ingredientesFaltando = selectedReceita?.ingredientes.filter(ri => {
    const necessario = ri.quantidade * watchLotes
    return ri.ingrediente.estoqueAtual < necessario
  }) || []

  const custoTotal = selectedReceita ? selectedReceita.custoTotal * watchLotes : 0
  const cookiesTotal = selectedReceita ? selectedReceita.quantidadePorcoes * watchLotes : 0

  async function onSubmit(data: FormData) {
    if (ingredientesFaltando.length > 0) {
      if (!confirm('Há ingredientes insuficientes. Deseja registrar mesmo assim?')) return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/producoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          lote: loteGerado,
          quantidadeProduzida: cookiesTotal,
          custoProducao: custoTotal,
          responsavelId: userId || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao registrar')
      }

      toast({ title: `Produção registrada! Lote: ${loteGerado}`, description: `${cookiesTotal} cookies produzidos.` })
      reset()
      onClose()
      router.refresh()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao registrar produção', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar Produção</DialogTitle>
          <p className="text-xs text-muted-foreground">Lote: <strong>{loteGerado}</strong></p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Receita *</Label>
            <Select onValueChange={v => {
              setValue('receitaId', v)
              setSelectedReceita(receitas.find(r => r.id === v) || null)
            }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione a receita" />
              </SelectTrigger>
              <SelectContent>
                {receitas.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.receitaId && <p className="text-xs text-destructive">{errors.receitaId.message}</p>}
          </div>

          {selectedReceita && (
            <div className="bg-cookie-50 rounded-xl p-3 text-xs space-y-1 text-cookie-800">
              <p>Rendimento por lote: <strong>{selectedReceita.quantidadePorcoes} cookies</strong></p>
              <p>Custo por lote: <strong>{formatCurrency(selectedReceita.custoTotal)}</strong></p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantidade de Lotes *</Label>
            <Input {...register('quantidadeLotes')} type="number" min="1" className="rounded-xl" />
            {selectedReceita && watchLotes > 0 && (
              <p className="text-xs text-muted-foreground">
                = <strong>{cookiesTotal} cookies</strong> · Custo total: <strong>{formatCurrency(custoTotal)}</strong>
              </p>
            )}
          </div>

          {ingredientesFaltando.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-xs font-semibold text-red-700">Ingredientes insuficientes:</p>
              </div>
              {ingredientesFaltando.map(ri => (
                <p key={ri.ingrediente.id} className="text-xs text-red-600">
                  • {ri.ingrediente.nome}: tem {ri.ingrediente.estoqueAtual}{ri.ingrediente.unidade},
                  precisa {ri.quantidade * watchLotes}{ri.unidade}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data de Produção</Label>
              <Input {...register('dataProducao')} type="date" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Validade</Label>
              <Input {...register('dataValidade')} type="date" className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Input {...register('observacoes')} placeholder="Notas sobre a produção..." className="rounded-xl" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-cookie-500 hover:bg-cookie-600 rounded-xl">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
