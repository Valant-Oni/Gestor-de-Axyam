import { useUserStore } from '@/stores/userStore'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { UserCircle, Users, Package, ScrollText } from 'lucide-react'

export function HomePage() {
  const { username, loaded, setUsername } = useUserStore()
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  if (!username) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md w-full space-y-4 text-center">
          <UserCircle className="size-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Bienvenido a Gestor de Axyam</h1>
          <p className="text-muted-foreground">Escribe tu nombre para personalizar la experiencia</p>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setUsername(input.trim()); setInput('') } }}
              placeholder="Tu nombre..."
              className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={async () => { await setUsername(input.trim()); setInput('') }} disabled={saving || !input.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hola, {username}</h1>
        <p className="text-muted-foreground">Panel de control del Gestor de Axyam</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/personajes" className="block p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
          <Users className="size-8 mb-2 text-muted-foreground" />
          <h3 className="font-semibold mb-1">Personajes</h3>
          <p className="text-sm text-muted-foreground">Gestiona tus personajes y sus estadísticas</p>
        </Link>
        <Link to="/equipamiento" className="block p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
          <Package className="size-8 mb-2 text-muted-foreground" />
          <h3 className="font-semibold mb-1">Equipamiento</h3>
          <p className="text-sm text-muted-foreground">Explora el catálogo de objetos disponibles</p>
        </Link>
        <Link to="/materiales" className="block p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
          <ScrollText className="size-8 mb-2 text-muted-foreground" />
          <h3 className="font-semibold mb-1">Recetas</h3>
          <p className="text-sm text-muted-foreground">Consulta materiales necesarios para crafting</p>
        </Link>
      </div>
    </div>
  )
}
