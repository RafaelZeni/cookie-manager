'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Loader2, Plus, Trash2, Calculator } from 'lucide-react'
import { formatCurrency, formatPercent, calcularMargemLucro, sugerirPrecoVenda } from '@/lib/utils'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  descricao: z.string().optional(),
  pesoFinal: z.coerce.number().positive(),
  quantidadePorcoes: z.coerce.number().int().positive(),
  tempoPreparo: z.coerce.number().int().min(0),
  precoVenda: z.coerce.number().min(0),
  observacoes: z.string().optional(),
  ingredientes: z.array(z.object({
    ingredienteId: z.string().min(1),
    quantidade: z.coerce.number().positive(),
    unidade: z.string().min(1),
  })).min(1, 'Adicione pelo menos 1 ingrediente'),
})

type FormData = z.infer<typeof schema>

interface Ingrediente {
  id: string
  nome: string
  unidade: string
  custoMedio: number
  estoqueAtual: number
}

interface Props {
  open: boolean
  onClose: () => void
  receita: any | null
  ingredientes: Ingrediente[]
}

export function ReceitaDialog({ open, onClose, receita, ingredientes }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [custoCalculado, setCustoCalculado] = useState(0)
  const [margemSugerida, setMargemSugerida] = useState(40)

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredientes' })
  
  const watchIngredientes = watch('ingredientes')
  const watchPorcoes = watch('quantidadePorcoes')
  const watchPreco = watch('precoVenda')

  useEffect(() => {
    if (receita) {
      reset({
        nome: receita.nome,
        descricao: receita.descricao || '',
        pesoFinal: receita.pesoFinal,
        quantidadePorcoes: receita.quantidadePorcoes,
        tempoPreparo: receita.tempoPreparo,
        precoVenda: receita.precoVenda,
        observacoes: receita.observacoes || '',
        ingredientes: receita.ingredientes.map((ri: any) => ({
          ingredienteId: ri.ingrediente.id,
          quantidade: ri.quantidade,
          unidade: ri.unidade,
        })),
      })
    } else {
      reset({
        nome: '',
        descricao: '',
        pesoFinal: 0,
        quantidadePorcoes: 12,
        tempoPreparo: 40,
        precoVenda: 0,
        observacoes: '',
        ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
      })
    }
  }, [receita, reset])

  // Auto calculate cost
  useEffect(() => {
    if (!watchIngredientes) return
    let total = 0
    for (const item of watchIngredientes) {
      const ing = ingredientes.find(i => i.id === item.ingredienteId)
      if (ing && item.quantidade) {
        total += ing.custoMedio * item.quantidade
      }
    }
    setCustoCalculado(total)
  }, [watchIngredientes, ingredientes])

  const custoPorUnidade = watchPorcoes > 0 ? custoCalculado / watchPorcoes : 0
  const margem = watchPreco > 0 ? calcularMargemLucro(custoPorUnidade, watchPreco) : 0
  const precoSugerido = sugerirPrecoVenda(custoPorUnidade, margemSugerida)

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const custoTotal = custoCalculado
      const custoPorUnidade = data.quantidadePorcoes > 0 ? custoTotal / data.quantidadePorcoes : 0
      const margemLucro = calcularMargemLucro(custoPorUnidade, data.precoVenda)

      const url = receita ? `/api/receitas/${receita.id}` : '/api/receitas'
      const method = receita ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, custoTotal, custoPorUnidade, margemLucro }),
      })

      if (!res.ok) throw new Error()
      toast({ title: receita ? 'Receita atualizada!' : 'Receita criada!' })
      onClose()
      router.refresh()
    } catch {
      toast({ title: 'Erro ao salvar receita', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {receita ? 'Editar Receita' : 'Nova Receita'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Basic info */}
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Nome da Receita *</Label>
              <Input {...register('nome')} placeholder="Ex: Cookie de Chocolate" className="rounded-xl" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Peso Final (g)</Label>
                <Input {...register('pesoFinal')} type="number" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Qtd. Cookies *</Label>
                <Input {...register('quantidadePorcoes')} type="number" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Tempo (min)</Label>
                <Input {...register('tempoPreparo')} type="number" className="rounded-xl" />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Ingredientes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ingredienteId: '', quantidade: 0, unidade: 'g' })}
                className="rounded-xl h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </Button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {fields.map((field, index) => {
                const selectedIng = ingredientes.find(i => i.id === watchIngredientes?.[index]?.ingredienteId)
                const custo = selectedIng && watchIngredientes?.[index]?.quantidade
                  ? selectedIng.custoMedio * watchIngredientes[index].quantidade
                  : 0

                return (
                  <div key={field.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select
                        onValueChange={v => {
                          setValue(`ingredientes.${index}.ingredienteId`, v)
                          const ing = ingredientes.find(i => i.id === v)
                          if (ing) setValue(`ingredientes.${index}.unidade`, ing.unidade)
                        }}
                        defaultValue={field.ingredienteId}
                      >
                        <SelectTrigger className="rounded-xl h-9 text-xs">
                          <SelectValue placeholder="Ingrediente" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientes.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        {...register(`ingredientes.${index}.quantidade`)}
                        type="number"
                        step="0.01"
                        placeholder="Qtd"
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <div className="w-16 text-xs text-muted-foreground pb-2">
                      {selectedIng?.unidade}
                    </div>
                    {custo > 0 && (
                      <div className="w-16 text-xs text-green-600 pb-2 font-medium">
                        {formatCurrency(custo)}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="w-8 h-8 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cost summary */}
          {custoCalculado > 0 && (
            <div className="bg-cookie-50 border border-cookie-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-cookie-800">
                <Calculator className="w-4 h-4" />
                Resumo de Custos
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Custo total: <strong>{formatCurrency(custoCalculado)}</strong></div>
                <div>Custo/cookie: <strong>{formatCurrency(custoPorUnidade)}</strong></div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Precificação</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Preço de Venda (R$)</Label>
                <Input {...register('precoVenda')} type="number" step="0.01" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Margem Atual</Label>
                <div className={`h-9 flex items-center px-3 rounded-xl text-sm font-semibold ${
                  margem >= 30 ? 'bg-green-50 text-green-700' :
                  margem >= 15 ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-600'
                }`}>
                  {watchPreco > 0 ? formatPercent(margem) : '—'}
                </div>
              </div>
            </div>

            {custoPorUnidade > 0 && (
              <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Sugestão com margem desejada:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={margemSugerida}
                    onChange={e => setMargemSugerida(Number(e.target.value))}
                    className="flex-1 accent-cookie-500"
                  />
                  <span className="text-xs font-medium w-10">{margemSugerida}%</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-lg"
                    onClick={() => setValue('precoVenda', Number(precoSugerido.toFixed(2)))}
                  >
                    {formatCurrency(precoSugerido)}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Input {...register('observacoes')} placeholder="Notas sobre a receita..." className="rounded-xl" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-cookie-500 hover:bg-cookie-600 rounded-xl">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {receita ? 'Salvar' : 'Criar Receita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
