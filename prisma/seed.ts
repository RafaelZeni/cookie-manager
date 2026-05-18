import { PrismaClient, Role, TipoLancamento } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cookies.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@cookies.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // Create financial categories
  const categorias = [
    { nome: 'Vendas', tipo: TipoLancamento.RECEITA, icone: '💰', cor: '#22c55e' },
    { nome: 'Outras Receitas', tipo: TipoLancamento.RECEITA, icone: '📈', cor: '#16a34a' },
    { nome: 'Ingredientes', tipo: TipoLancamento.DESPESA, icone: '🛒', cor: '#ef4444' },
    { nome: 'Embalagens', tipo: TipoLancamento.DESPESA, icone: '📦', cor: '#f97316' },
    { nome: 'Gás', tipo: TipoLancamento.DESPESA, icone: '🔥', cor: '#f59e0b' },
    { nome: 'Energia', tipo: TipoLancamento.DESPESA, icone: '⚡', cor: '#eab308' },
    { nome: 'Funcionários', tipo: TipoLancamento.DESPESA, icone: '👥', cor: '#8b5cf6' },
    { nome: 'Taxas', tipo: TipoLancamento.DESPESA, icone: '📋', cor: '#6366f1' },
    { nome: 'Outras Despesas', tipo: TipoLancamento.DESPESA, icone: '💸', cor: '#ec4899' },
  ]

  for (const cat of categorias) {
    await prisma.categoriaFinanceiro.upsert({
      where: { id: cat.nome },
      update: {},
      create: cat,
    }).catch(() => prisma.categoriaFinanceiro.create({ data: cat }))
  }

  console.log('✅ Financial categories created')

  // Create sample supplier
  const fornecedor = await prisma.fornecedor.create({
    data: {
      nome: 'Distribuidora Central',
      contato: 'João Silva',
      telefone: '(11) 99999-9999',
      email: 'contato@distribuidora.com',
    },
  })

  // Create sample ingredients
  const ingredientes = [
    { nome: 'Farinha de Trigo', categoria: 'Farinhas', unidade: 'g', estoqueAtual: 5000, estoqueMinimo: 1000, custoMedio: 0.00417 },
    { nome: 'Açúcar', categoria: 'Açúcares', unidade: 'g', estoqueAtual: 3000, estoqueMinimo: 500, custoMedio: 0.003 },
    { nome: 'Manteiga', categoria: 'Gorduras', unidade: 'g', estoqueAtual: 1000, estoqueMinimo: 250, custoMedio: 0.04 },
    { nome: 'Ovos', categoria: 'Ovos', unidade: 'unidade', estoqueAtual: 30, estoqueMinimo: 10, custoMedio: 0.75 },
    { nome: 'Chocolate em Pó', categoria: 'Chocolates', unidade: 'g', estoqueAtual: 500, estoqueMinimo: 100, custoMedio: 0.05 },
    { nome: 'Nutella', categoria: 'Cremes', unidade: 'g', estoqueAtual: 400, estoqueMinimo: 100, custoMedio: 0.08 },
    { nome: 'Gotas de Chocolate', categoria: 'Chocolates', unidade: 'g', estoqueAtual: 600, estoqueMinimo: 150, custoMedio: 0.035 },
    { nome: 'Bicarbonato de Sódio', categoria: 'Fermentos', unidade: 'g', estoqueAtual: 200, estoqueMinimo: 50, custoMedio: 0.015 },
    { nome: 'Sal', categoria: 'Temperos', unidade: 'g', estoqueAtual: 500, estoqueMinimo: 100, custoMedio: 0.002 },
    { nome: 'Baunilha', categoria: 'Aromas', unidade: 'ml', estoqueAtual: 100, estoqueMinimo: 20, custoMedio: 0.25 },
  ]

  const createdIngredientes = []
  for (const ing of ingredientes) {
    const created = await prisma.ingrediente.create({
      data: { ...ing, fornecedorId: fornecedor.id },
    })
    createdIngredientes.push(created)
  }

  console.log('✅ Sample ingredients created')

  // Create sample recipe - Cookie de Chocolate
  const farinha = createdIngredientes.find(i => i.nome === 'Farinha de Trigo')!
  const acucar = createdIngredientes.find(i => i.nome === 'Açúcar')!
  const manteiga = createdIngredientes.find(i => i.nome === 'Manteiga')!
  const ovos = createdIngredientes.find(i => i.nome === 'Ovos')!
  const chocolate = createdIngredientes.find(i => i.nome === 'Chocolate em Pó')!
  const gotas = createdIngredientes.find(i => i.nome === 'Gotas de Chocolate')!
  const bicarbonato = createdIngredientes.find(i => i.nome === 'Bicarbonato de Sódio')!
  const sal = createdIngredientes.find(i => i.nome === 'Sal')!
  const baunilha = createdIngredientes.find(i => i.nome === 'Baunilha')!
  const nutella = createdIngredientes.find(i => i.nome === 'Nutella')!

  const custoChoco =
    510 * farinha.custoMedio +
    200 * acucar.custoMedio +
    227 * manteiga.custoMedio +
    2 * ovos.custoMedio +
    5 * baunilha.custoMedio +
    5 * bicarbonato.custoMedio +
    3 * sal.custoMedio +
    100 * gotas.custoMedio +
    50 * chocolate.custoMedio

  const receitaChoco = await prisma.receita.create({
    data: {
      nome: 'Cookie de Chocolate',
      descricao: 'Cookie clássico de chocolate com gotas',
      pesoFinal: 900,
      quantidadePorcoes: 24,
      tempoPreparo: 45,
      custoTotal: custoChoco,
      custoPorUnidade: custoChoco / 24,
      precoVenda: 5.0,
      margemLucro: ((5.0 - custoChoco / 24) / 5.0) * 100,
      ingredientes: {
        create: [
          { ingredienteId: farinha.id, quantidade: 510, unidade: 'g' },
          { ingredienteId: acucar.id, quantidade: 200, unidade: 'g' },
          { ingredienteId: manteiga.id, quantidade: 227, unidade: 'g' },
          { ingredienteId: ovos.id, quantidade: 2, unidade: 'unidade' },
          { ingredienteId: baunilha.id, quantidade: 5, unidade: 'ml' },
          { ingredienteId: bicarbonato.id, quantidade: 5, unidade: 'g' },
          { ingredienteId: sal.id, quantidade: 3, unidade: 'g' },
          { ingredienteId: gotas.id, quantidade: 100, unidade: 'g' },
          { ingredienteId: chocolate.id, quantidade: 50, unidade: 'g' },
        ],
      },
    },
  })

  const custoNutella =
    510 * farinha.custoMedio +
    200 * acucar.custoMedio +
    227 * manteiga.custoMedio +
    2 * ovos.custoMedio +
    5 * baunilha.custoMedio +
    5 * bicarbonato.custoMedio +
    3 * sal.custoMedio +
    200 * nutella.custoMedio

  await prisma.receita.create({
    data: {
      nome: 'Cookie de Nutella',
      descricao: 'Cookie recheado com Nutella cremosa',
      pesoFinal: 950,
      quantidadePorcoes: 20,
      tempoPreparo: 50,
      custoTotal: custoNutella,
      custoPorUnidade: custoNutella / 20,
      precoVenda: 7.0,
      margemLucro: ((7.0 - custoNutella / 20) / 7.0) * 100,
      ingredientes: {
        create: [
          { ingredienteId: farinha.id, quantidade: 510, unidade: 'g' },
          { ingredienteId: acucar.id, quantidade: 200, unidade: 'g' },
          { ingredienteId: manteiga.id, quantidade: 227, unidade: 'g' },
          { ingredienteId: ovos.id, quantidade: 2, unidade: 'unidade' },
          { ingredienteId: baunilha.id, quantidade: 5, unidade: 'ml' },
          { ingredienteId: bicarbonato.id, quantidade: 5, unidade: 'g' },
          { ingredienteId: sal.id, quantidade: 3, unidade: 'g' },
          { ingredienteId: nutella.id, quantidade: 200, unidade: 'g' },
        ],
      },
    },
  })

  console.log('✅ Sample recipes created')
  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
