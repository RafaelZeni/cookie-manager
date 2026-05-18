import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendas = await prisma.venda.findMany({
    include: {
      itens: { include: { receita: true } },
      cliente: true,
    },
    orderBy: { dataVenda: 'desc' },
    take: 100,
  })
  return NextResponse.json(vendas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { itens, clienteId, vendedorId, formaPagamento, subtotal, desconto, total } = body

  // Create sale
  const venda = await prisma.venda.create({
    data: {
      clienteId: clienteId || null,
      vendedorId: vendedorId || null,
      status: 'FECHADA',
      formaPagamento,
      subtotal,
      desconto: desconto || 0,
      total,
      itens: {
        create: itens.map((item: any) => ({
          receitaId: item.receitaId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          subtotal: item.quantidade * item.precoUnitario,
        })),
      },
    },
    include: { itens: true },
  })

  // Deduct from product stock
  for (const item of itens) {
    // Reduce from stock entries (FIFO - oldest first)
    const stockEntries = await prisma.estoqueProduto.findMany({
      where: { receitaId: item.receitaId, ativo: true },
      orderBy: { dataValidade: 'asc' },
    })

    let remaining = item.quantidade
    for (const entry of stockEntries) {
      if (remaining <= 0) break
      const toDeduct = Math.min(entry.quantidade, remaining)
      remaining -= toDeduct

      if (entry.quantidade - toDeduct <= 0) {
        await prisma.estoqueProduto.update({
          where: { id: entry.id },
          data: { quantidade: 0, ativo: false },
        })
      } else {
        await prisma.estoqueProduto.update({
          where: { id: entry.id },
          data: { quantidade: { decrement: toDeduct } },
        })
      }
    }

    await prisma.movimentacaoEstoque.create({
      data: {
        tipo: 'SAIDA',
        quantidade: item.quantidade,
        unidade: 'unidade',
        motivo: `Venda #${venda.id.slice(-8)}`,
        referenciaId: venda.id,
      },
    })
  }

  // Record as financial income
  await prisma.lancamentoFinanceiro.create({
    data: {
      tipo: 'RECEITA',
      descricao: `Venda de cookies`,
      valor: total,
      data: new Date(),
      vendaId: venda.id,
      observacoes: `Pagamento: ${formaPagamento}`,
    },
  })

  return NextResponse.json(venda, { status: 201 })
}
