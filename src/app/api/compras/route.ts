import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ingredienteId, quantidade, precoTotal, unidade, dataCompra, dataValidade, notaFiscal, observacoes, fornecedorId } = body

  const precoPorUnidade = precoTotal / quantidade

  // Create purchase record
  const compra = await prisma.compraIngrediente.create({
    data: {
      ingredienteId,
      fornecedorId: fornecedorId || null,
      quantidade,
      unidade,
      precoTotal,
      precoPorUnidade,
      dataCompra: new Date(dataCompra),
      dataValidade: dataValidade ? new Date(dataValidade) : null,
      notaFiscal: notaFiscal || null,
      observacoes: observacoes || null,
    },
  })

  // Get all purchases to calculate weighted average cost
  const todasCompras = await prisma.compraIngrediente.findMany({
    where: { ingredienteId },
    orderBy: { dataCompra: 'desc' },
    take: 10,
  })

  let totalQtd = 0
  let totalCost = 0
  for (const c of todasCompras) {
    totalQtd += c.quantidade
    totalCost += c.precoTotal
  }
  const custoMedio = totalQtd > 0 ? totalCost / totalQtd : precoPorUnidade

  // Update ingredient stock and average cost
  await prisma.ingrediente.update({
    where: { id: ingredienteId },
    data: {
      estoqueAtual: { increment: quantidade },
      custoMedio,
    },
  })

  // Record stock movement
  await prisma.movimentacaoEstoque.create({
    data: {
      tipo: 'ENTRADA',
      ingredienteId,
      quantidade,
      unidade,
      motivo: `Compra registrada${notaFiscal ? ` - NF: ${notaFiscal}` : ''}`,
      referenciaId: compra.id,
    },
  })

  // Also record as financial expense
  await prisma.lancamentoFinanceiro.create({
    data: {
      tipo: 'DESPESA',
      descricao: `Compra de ingrediente`,
      valor: precoTotal,
      data: new Date(dataCompra),
      observacoes: `Ingrediente ID: ${ingredienteId}`,
    },
  })

  return NextResponse.json(compra, { status: 201 })
}
