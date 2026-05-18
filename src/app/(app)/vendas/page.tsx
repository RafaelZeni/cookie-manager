import { prisma } from '@/lib/prisma'
import { VendasClient } from '@/components/vendas/vendas-client'
import { auth } from '@/lib/auth'

export const metadata = { title: 'Vendas' }

async function getData() {
  const [vendas, receitas, clientes, estoque] = await Promise.all([
    prisma.venda.findMany({
      include: {
        itens: { include: { receita: true } },
        cliente: true,
      },
      orderBy: { dataVenda: 'desc' },
      take: 100,
    }),
    prisma.receita.findMany({
      where: { ativa: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.estoqueProduto.groupBy({
      by: ['receitaId'],
      where: { ativo: true },
      _sum: { quantidade: true },
    }),
  ])
  return { vendas, receitas, clientes, estoque }
}

export default async function VendasPage() {
  const session = await auth()
  const data = await getData()
  return <VendasClient {...data} userId={session?.user?.id} />
}
