import { useEffect, useState } from 'react'
import { Tag } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Tags } from 'lucide-react'

export function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')

  const load = async () => {
    try {
      const data = await window.electronAPI.tags.getAll()
      setTags(data as Tag[])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!input.trim()) return
    try {
      await window.electronAPI.tags.create(input.trim())
      setInput('')
      load()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.tags.delete(id)
      load()
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-muted-foreground text-sm">Gestiona las categorías de equipamiento</p>
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
          placeholder="Nuevo tag..."
          className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <Button onClick={handleCreate} disabled={!input.trim()}><Plus className="size-4" /> Añadir</Button>
      </div>

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tags className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay tags creados</p>
          <p className="text-sm text-muted-foreground">Crea tags como "casco", "arma", "armadura" para categorizar objetos</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-card border">
              <span className="text-sm font-medium">{tag.name}</span>
              <button onClick={() => handleDelete(tag.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
