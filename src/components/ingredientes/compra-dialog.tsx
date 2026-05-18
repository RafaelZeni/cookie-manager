'use client'

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
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const schema = z.object({
  quantidade: z.coerce.number().positive('Quantidade deve ser positiva'),
  precoTotal: z.coerce.number().positive('Preço deve ser positivo'),
  dataCompra: z.string(),
  dataValidade: z.string().optional(),
  notaFiscal: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  ingrediente: { id: string; nome: string; unidade: string }
}

export function CompraDialog({ open, onClose, ingrediente }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataCompra: new Date().toISOString().split('T')[0],
    },
  })

  const quantidade = watch('quantidade')
  const precoTotal = watch('precoTotal')
  const precoPorUnidade = quantidade && precoTotal ? precoTotal / quantidade : 0

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredienteId: ingrediente.id,
          unidade: ingrediente.unidade,
          ...data,
          dataValidade: data.dataValidade || null,
        }),
      })

      if (!res.ok) throw new Error()
      toast({ title: 'Compra registrada! Estoque atualizado.' })
      reset()
      onClose()
      router.refresh()
    } catch {
      toast({ title: 'Erro ao registrar compra', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar Compra</DialogTitle>
          <p className="text-sm text-muted-foreground">{ingrediente.nome}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade ({ingrediente.unidade}) *</Label>
              <Input {...register('quantidade')} type="number" step="0.01" placeholder="5000" className="rounded-xl" />
              {errors.quantidade && <p className="text-xs text-destructive">{errors.quantidade.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Preço Total (R$) *</Label>
              <Input {...register('precoTotal')} type="number" step="0.01" placeholder="20.87" className="rounded-xl" />
              {errors.precoTotal && <p className="text-xs text-destructive">{errors.precoTotal.message}</p>}
            </div>
          </div>

          {precoPorUnidade > 0 && (
            <div className="bg-cookie-50 rounded-xl p-3 text-xs text-cookie-700">
              Custo por {ingrediente.unidade}: <strong>R$ {precoPorUnidade.toFixed(4)}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data da Compra</Label>
              <Input {...register('dataCompra')} type="date" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Validade</Label>
              <Input {...register('dataValidade')} type="date" className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nota Fiscal</Label>
            <Input {...register('notaFiscal')} placeholder="Número da NF (opcional)" className="rounded-xl" />
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
