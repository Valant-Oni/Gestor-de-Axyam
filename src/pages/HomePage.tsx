import { useUserStore } from '@/stores/userStore'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserCircle } from 'lucide-react'

export function HomePage() {
  const { username, loaded, setUsername } = useUserStore()
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  const handleSave = async () => {
    if (!input.trim()) return
    setSaving(true)
    await setUsername(input.trim())
    setSaving(false)
    setInput('')
  }

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
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Tu nombre..."
              className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={handleSave} disabled={saving || !input.trim()}>
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
        <QuickCard title="Personajes" description="Gestiona tus personajes y sus estadísticas" href="/personajes" />
        <QuickCard title="Equipamiento" description="Explora el catálogo de objetos disponibles" href="/equipamiento" />
        <QuickCard title="Recetas" description="Consulta materiales necesarios para crafting" href="/materiales" />
      </div>
    </div>
  )
}

function QuickCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a href={href} className="block p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </a>
  )
}
