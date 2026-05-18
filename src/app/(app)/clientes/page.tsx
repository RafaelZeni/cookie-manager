import { prisma } from '@/lib/prisma'
import { ClientesClient } from '@/components/clientes/clientes-client'

export const metadata = { title: 'Clientes' }

async function getData() {
  const clientes = await prisma.cliente.findMany({
    where: { ativo: true },
    include: {
      vendas: {
        where: { status: 'FECHADA' },
        select: { total: true, dataVenda: true },
        orderBy: { dataVenda: 'desc' },
      },
    },
    orderBy: { nome: 'asc' },
  })
  return { clientes }
}

export default async function ClientesPage() {
  const data = await getData()
  return <ClientesClient {...data} />
}
