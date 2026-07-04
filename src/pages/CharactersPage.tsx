import { useEffect, useState } from 'react'
import { Character, Race } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, User } from 'lucide-react'

export function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Character | null>(null)
  const [form, setForm] = useState({ name: '', race_id: '', gender: '' })

  const load = async () => {
    try {
      const [chars, raceData] = await Promise.all([
        window.electronAPI.characters.getAll(),
        window.electronAPI.races.getAll(),
      ])
      setCharacters(chars as Character[])
      setRaces(raceData as Race[])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.name.trim()) return
    const data = { name: form.name.trim(), race_id: form.race_id ? parseInt(form.race_id) : undefined, gender: form.gender || undefined }
    if (editing) {
      await window.electronAPI.characters.update(editing.id, data)
    } else {
      await window.electronAPI.characters.create(data)
    }
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', race_id: '', gender: '' })
    load()
  }

  const handleEdit = (c: Character) => {
    setEditing(c)
    setForm({ name: c.name, race_id: c.race_id?.toString() || '', gender: c.gender || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    await window.electronAPI.characters.delete(id)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personajes</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus personajes del servidor</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', race_id: '', gender: '' }); setShowForm(true) }}>
          <Plus className="size-4" /> Nuevo personaje
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-xl p-4 space-y-3 bg-card">
          <h3 className="font-semibold">{editing ? 'Editar personaje' : 'Nuevo personaje'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <select value={form.race_id} onChange={(e) => setForm({ ...form, race_id: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Sin raza</option>
              {races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input placeholder="Género (opcional)" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editing ? 'Guardar' : 'Crear'}</Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null) }}>Cancelar</Button>
          </div>
        </div>
      )}

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <User className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay personajes registrados</p>
          <p className="text-sm text-muted-foreground">Crea tu primer personaje para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((c) => (
            <div key={c.id} className="border rounded-xl p-4 space-y-2 bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.race_name || 'Sin raza'}{c.gender ? ` - ${c.gender}` : ''}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(c)} className="p-1 hover:bg-accent rounded"><Edit2 className="size-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-accent rounded"><Trash2 className="size-4 text-destructive" /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <Stat label="Vida" value={c.base_vida} />
                <Stat label="Ataque" value={c.base_ataque} />
                <Stat label="Ataq. Mágico" value={c.base_ataque_magico} />
                <Stat label="Defensa" value={c.base_defensa} />
                <Stat label="Mana" value={c.base_mana} />
                <Stat label="Estamina" value={c.base_estamina} />
                <Stat label="Agilidad" value={c.base_agilidad} />
                <Stat label="Robo" value={c.base_robo} />
                <Stat label="Sigilo" value={c.base_sigilo} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/50 rounded-lg p-1.5 text-center">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
