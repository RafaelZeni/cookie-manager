import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function formatWeight(value: number, unit: string): string {
  if (unit === 'g' && value >= 1000) {
    return `${(value / 1000).toFixed(2).replace('.', ',')}kg`
  }
  if (unit === 'ml' && value >= 1000) {
    return `${(value / 1000).toFixed(2).replace('.', ',')}L`
  }
  return `${value}${unit}`
}

export function generateLote(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `L${year}${month}${day}-${random}`
}

export function calcularDataValidade(diasValidade: number = 7): Date {
  const date = new Date()
  date.setDate(date.getDate() + diasValidade)
  return date
}

export function isVencimentoProximo(dataValidade: Date | string, diasAlerta: number = 3): boolean {
  const hoje = new Date()
  const validade = new Date(dataValidade)
  const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  return diffDias <= diasAlerta && diffDias >= 0
}

export function isVencido(dataValidade: Date | string): boolean {
  return new Date(dataValidade) < new Date()
}

export function calcularMargemLucro(custo: number, precoVenda: number): number {
  if (precoVenda === 0) return 0
  return ((precoVenda - custo) / precoVenda) * 100
}

export function sugerirPrecoVenda(custo: number, margemDesejada: number): number {
  return custo / (1 - margemDesejada / 100)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ATIVO: 'text-green-600 bg-green-50 border-green-200',
    VENCIDO: 'text-red-600 bg-red-50 border-red-200',
    DESCARTADO: 'text-gray-600 bg-gray-50 border-gray-200',
    ABERTA: 'text-blue-600 bg-blue-50 border-blue-200',
    FECHADA: 'text-green-600 bg-green-50 border-green-200',
    CANCELADA: 'text-red-600 bg-red-50 border-red-200',
  }
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getFormaPagamentoLabel(forma: string): string {
  const labels: Record<string, string> = {
    PIX: 'Pix',
    CREDITO: 'Cartão de Crédito',
    DEBITO: 'Cartão de Débito',
    DINHEIRO: 'Dinheiro',
  }
  return labels[forma] || forma
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
