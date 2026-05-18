import { prisma } from '@/lib/prisma'
import { ProducaoClient } from '@/components/producao/producao-client'
import { auth } from '@/lib/auth'

export const metadata = { title: 'Produção' }

async function getData() {
  const [producoes, receitas] = await Promise.all([
    prisma.producao.findMany({
      include: {
        receita: true,
        responsavel: { select: { id: true, name: true } },
      },
      orderBy: { dataProducao: 'desc' },
      take: 50,
    }),
    prisma.receita.findMany({
      where: { ativa: true },
      include: {
        ingredientes: { include: { ingrediente: true } },
      },
      orderBy: { nome: 'asc' },
    }),
  ])
  return { producoes, receitas }
}

export default async function ProducaoPage() {
  const session = await auth()
  const data = await getData()
  return <ProducaoClient {...data} userId={session?.user?.id} />
}
