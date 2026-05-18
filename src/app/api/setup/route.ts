import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// One-time setup route to initialize database
// Access: /api/setup?secret=cookie2024
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  
  if (secret !== 'cookie2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if already set up
    const existingUser = await prisma.user.findFirst()
    if (existingUser) {
      return NextResponse.json({ message: 'Already initialized', ok: true })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@cookies.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    // Create financial categories
    const categorias = [
      { nome: 'Vendas', tipo: 'RECEITA' as const, icone: '💰', cor: '#22c55e' },
      { nome: 'Outras Receitas', tipo: 'RECEITA' as const, icone: '📈', cor: '#16a34a' },
      { nome: 'Ingredientes', tipo: 'DESPESA' as const, icone: '🛒', cor: '#ef4444' },
      { nome: 'Embalagens', tipo: 'DESPESA' as const, icone: '📦', cor: '#f97316' },
      { nome: 'Gás', tipo: 'DESPESA' as const, icone: '🔥', cor: '#f59e0b' },
      { nome: 'Energia', tipo: 'DESPESA' as const, icone: '⚡', cor: '#eab308' },
      { nome: 'Funcionários', tipo: 'DESPESA' as const, icone: '👥', cor: '#8b5cf6' },
      { nome: 'Taxas', tipo: 'DESPESA' as const, icone: '📋', cor: '#6366f1' },
      { nome: 'Outras Despesas', tipo: 'DESPESA' as const, icone: '💸', cor: '#ec4899' },
    ]

    for (const cat of categorias) {
      await prisma.categoriaFinanceiro.create({ data: cat })
    }

    return NextResponse.json({
      message: 'Setup completed successfully!',
      credentials: {
        email: 'admin@cookies.com',
        password: 'admin123',
      },
      warning: 'Change your password after first login!',
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
