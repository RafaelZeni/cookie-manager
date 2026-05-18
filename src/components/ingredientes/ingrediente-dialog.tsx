'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  categoria: z.string().min(1, 'Categoria obrigatória'),
  unidade: z.string().min(1, 'Unidade obrigatória'),
  estoqueAtual: z.coerce.number().min(0),
  estoqueMinimo: z.coerce.number().min(0),
  fornecedorId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const categorias = ['Farinhas', 'Açúcares', 'Gorduras', 'Ovos', 'Chocolates', 'Cremes', 'Fermentos', 'Temperos', 'Aromas', 'Laticínios', 'Frutas', 'Outros']
const unidades = ['g', 'kg', 'ml', 'L', 'unidade', 'colher', 'xícara']

interface Props {
  open: boolean
  onClose: () => void
  ingrediente: any | null
  fornecedores: Array<{ id: string; nome: string }>
}

export function IngredienteDialog({ open, onClose, ingrediente, fornecedores }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (ingrediente) {
      reset({
        nome: ingrediente.nome,
        categoria: ingrediente.categoria,
        unidade: ingrediente.unidade,
        estoqueAtual: ingrediente.estoqueAtual,
        estoqueMinimo: ingrediente.estoqueMinimo,
        fornecedorId: ingrediente.fornecedorId || undefined,
      })
    } else {
      reset({ nome: '', categoria: '', unidade: 'g', estoqueAtual: 0, estoqueMinimo: 0 })
    }
  }, [ingrediente, reset])

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const url = ingrediente ? `/api/ingredientes/${ingrediente.id}` : '/api/ingredientes'
      const method = ingrediente ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error()

      toast({ title: ingrediente ? 'Ingrediente atualizado!' : 'Ingrediente cadastrado!' })
      onClose()
      router.refresh()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {ingrediente ? 'Editar Ingrediente' : 'Novo Ingrediente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input {...register('nome')} placeholder="Ex: Farinha de Trigo" className="rounded-xl" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select onValueChange={v => setValue('categoria', v)} defaultValue={ingrediente?.categoria}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Select onValueChange={v => setValue('unidade', v)} defaultValue={ingrediente?.unidade || 'g'}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Estoque Atual</Label>
              <Input {...register('estoqueAtual')} type="number" step="0.01" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Estoque Mínimo</Label>
              <Input {...register('estoqueMinimo')} type="number" step="0.01" className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select onValueChange={v => setValue('fornecedorId', v)} defaultValue={ingrediente?.fornecedorId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecionar fornecedor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-cookie-500 hover:bg-cookie-600 rounded-xl">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {ingrediente ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
