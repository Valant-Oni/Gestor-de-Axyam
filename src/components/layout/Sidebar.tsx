import { NavLink } from 'react-router-dom'
import { Sword, Users, Package, ScrollText, Dices, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: UserCircle, label: 'Inicio' },
  { to: '/personajes', icon: Users, label: 'Personajes' },
  { to: '/equipamiento', icon: Package, label: 'Equipamiento' },
  { to: '/materiales', icon: ScrollText, label: 'Recetas' },
  { to: '/dados', icon: Dices, label: 'Dados' },
]

export function Sidebar() {
  return (
    <aside className="w-56 border-r bg-sidebar flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <Sword className="size-5 text-sidebar-primary" />
        <span className="font-semibold text-sm">Gestor de Axyam</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
