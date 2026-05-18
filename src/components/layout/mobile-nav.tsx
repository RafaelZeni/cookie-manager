'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Factory,
  BookOpen,
  Boxes,
  Users,
  BarChart3,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const primaryNav = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/producao', label: 'Produção', icon: Factory },
  { href: '/financeiro', label: 'Financeiro', icon: TrendingUp },
]

const allNav = [
  { href: '/ingredientes', label: 'Ingredientes', icon: Package },
  { href: '/receitas', label: 'Receitas', icon: BookOpen },
  { href: '/estoque', label: 'Estoque', icon: Boxes },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function MobileNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu panel */}
      {showMore && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 bg-white rounded-2xl border border-border shadow-2xl z-50 p-3">
          <div className="grid grid-cols-3 gap-2">
            {allNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors',
                    isActive
                      ? 'bg-cookie-500 text-white'
                      : 'hover:bg-accent text-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30 safe-bottom">
        <div className="flex items-center">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
                  isActive ? 'text-cookie-600' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'fill-current opacity-20')} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-cookie-500 rounded-full" />
                )}
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
              showMore ? 'text-cookie-600' : 'text-muted-foreground'
            )}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </>
  )
}
