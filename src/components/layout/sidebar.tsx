'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Cookie,
  LayoutDashboard,
  Package,
  BookOpen,
  Factory,
  ShoppingCart,
  TrendingUp,
  Users,
  BarChart3,
  ChevronRight,
  Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operações',
    items: [
      { href: '/ingredientes', label: 'Ingredientes', icon: Package },
      { href: '/receitas', label: 'Receitas', icon: BookOpen },
      { href: '/producao', label: 'Produção', icon: Factory },
      { href: '/estoque', label: 'Estoque', icon: Boxes },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
      { href: '/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { href: '/financeiro', label: 'Financeiro', icon: TrendingUp },
      { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white border-r border-border h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-border">
        <div className="w-9 h-9 bg-gradient-to-br from-cookie-400 to-cookie-600 rounded-xl flex items-center justify-center shadow-sm">
          <Cookie className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-sm leading-tight">Cookie Manager</p>
          <p className="text-[10px] text-muted-foreground">Gestão Artesanal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navItems.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-cookie-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Version */}
      <div className="p-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">v1.0.0 — Cookie Manager</p>
      </div>
    </aside>
  )
}
