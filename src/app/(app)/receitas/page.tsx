import { prisma } from '@/lib/prisma'
import { ReceitasClient } from '@/components/receitas/receitas-client'

export const metadata = { title: 'Receitas' }

async function getData() {
  const [receitas, ingredientes] = await Promise.all([
    prisma.receita.findMany({
      where: { ativa: true },
      include: {
        ingredientes: { include: { ingrediente: true } },
        _count: { select: { producoes: true } },
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.ingrediente.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    }),
  ])
  return { receitas, ingredientes }
}

export default async function ReceitasPage() {
  const data = await getData()
  return <ReceitasClient {...data} />
}
