import { prisma } from '@/lib/prisma'
import { EstoqueClient } from '@/components/estoque/estoque-client'

export const metadata = { title: 'Estoque' }

async function getData() {
  const [estoqueIngredientes, estoqueProdutos] = await Promise.all([
    prisma.ingrediente.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.estoqueProduto.findMany({
      where: { ativo: true },
      include: { producao: { include: { receita: true } } },
      orderBy: { dataValidade: 'asc' },
    }),
  ])
  return { estoqueIngredientes, estoqueProdutos }
}

export default async function EstoquePage() {
  const data = await getData()
  return <EstoqueClient {...data} />
}
