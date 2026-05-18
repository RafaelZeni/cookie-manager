import { prisma } from '@/lib/prisma'
import { IngredientesClient } from '@/components/ingredientes/ingredientes-client'

export const metadata = { title: 'Ingredientes' }

async function getIngredientes() {
  const [ingredientes, fornecedores] = await Promise.all([
    prisma.ingrediente.findMany({
      where: { ativo: true },
      include: {
        fornecedor: true,
        compras: {
          orderBy: { dataCompra: 'desc' },
          take: 3,
        },
      },
      orderBy: { nome: 'asc' },
    }),
    prisma.fornecedor.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    }),
  ])
  return { ingredientes, fornecedores }
}

export default async function IngredientesPage() {
  const data = await getIngredientes()
  return <IngredientesClient {...data} />
}
