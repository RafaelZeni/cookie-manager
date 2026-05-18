'use client'

import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { LogOut, Bell, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ingredientes': 'Ingredientes',
  '/receitas': 'Receitas',
  '/producao': 'Produção',
  '/estoque': 'Estoque',
  '/vendas': 'Vendas',
  '/clientes': 'Clientes',
  '/financeiro': 'Financeiro',
  '/relatorios': 'Relatórios',
}

interface TopBarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  
  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] || 'Cookie Manager'

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
      <h1 className="font-display font-semibold text-lg">{title}</h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-xl relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cookie-500 rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-xl h-9 px-2 gap-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-cookie-100 text-cookie-700 text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                {user.name || user.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
