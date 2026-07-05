import { useEffect, useState } from 'react'
import { Character, Race, Zone } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, User } from 'lucide-react'

function parseItemAttributes(attrsStr: string | null): Record<string, string> {
  const result: Record<string, string> = {}
  if (!attrsStr) return result
  for (const part of attrsStr.split(',')) {
    const m = part.trim().toLowerCase().match(/^(.+?)\s*\+\s*(.+)$/)
    if (m) result[m[1]] = m[2]
  }
  return result
}

function combineExpr(a: string | undefined, b: string): string {
  if (!a) return b
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) return `${parseInt(a) + parseInt(b)}`
  return `${a} + ${b}`
}

const STAT_KEYS = ['vida', 'ataque', 'ataque_magico', 'defensa', 'mana', 'estamina', 'agilidad', 'robo', 'sigilo'] as const

export function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [charItems, setCharItems] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Character | null>(null)
  const [form, setForm] = useState({ name: '', race_id: '', gender: '' })

  const load = async () => {
    try {
      const [chars, raceData, zoneData] = await Promise.all([
        window.electronAPI.characters.getAll(),
        window.electronAPI.races.getAll(),
        window.electronAPI.zones.getAll(),
      ])
      setCharacters(chars as Character[])
      setRaces(raceData as Race[])
      setZones(zoneData as Zone[])

      // Load items for each character
      const itemsMap: Record<number, any[]> = {}
      for (const c of chars as Character[]) {
        const items = await window.electronAPI.characters.getItems(c.id)
        itemsMap[c.id] = items as any[]
      }
      setCharItems(itemsMap)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.name.trim()) return
    const data = { name: form.name.trim(), race_id: form.race_id ? parseInt(form.race_id) : undefined, gender: form.gender || undefined }
    try {
      if (editing) {
        await window.electronAPI.characters.update(editing.id, data)
      } else {
        await window.electronAPI.characters.create(data)
      }
    } catch (e) {
      console.error(e)
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
    try { await window.electronAPI.characters.delete(id) } catch (e) { console.error(e) }
    load()
  }

  const baseRaces = races.filter((r) => !r.parent_race_id)

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
              <option value="">Selecciona raza...</option>
              {baseRaces.map((r) => (
                <optgroup key={r.id} label={r.name}>
                  <option value={r.id}>{r.name}</option>
                  {races.filter((ev) => ev.parent_race_id === r.id).map((ev) => (
                    <option key={ev.id} value={ev.id}>  {ev.name} (evolución)</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input placeholder="Género (opcional)" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.race_id}>{editing ? 'Guardar' : 'Crear'}</Button>
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
          {characters.map((c) => {
            const race = races.find((r) => r.id === c.race_id)
            return (
              <div key={c.id} className="border rounded-xl p-4 space-y-2 bg-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{race?.name || 'Sin raza'}{c.gender ? ` - ${c.gender}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(c)} className="p-1 hover:bg-accent rounded"><Edit2 className="size-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-accent rounded"><Trash2 className="size-4 text-destructive" /></button>
                  </div>
                </div>
                {race && (() => {
                  const equipped = (charItems[c.id] || []).filter((i: any) => i.equipped)
                  const equipStats: Record<string, string> = {}
                  for (const item of equipped) {
                    const parsed = parseItemAttributes(item.attributes)
                    for (const [k, v] of Object.entries(parsed)) {
                      equipStats[k] = combineExpr(equipStats[k], v)
                    }
                  }
                  const keyMap: Record<string, string> = { vida: 'Vida', ataque: 'Ataque', ataque_magico: 'Atq Mágico', defensa: 'Defensa', mana: 'Mana', estamina: 'Estamina', agilidad: 'Agilidad', robo: 'Robo', sigilo: 'Sigilo' }
                  const statMap: Record<string, string> = { vida: race.vida, ataque: race.ataque, ataque_magico: race.ataque_magico, defensa: race.defensa, mana: race.mana, estamina: race.estamina, agilidad: race.agilidad, robo: race.robo, sigilo: race.sigilo }
                  return (
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {STAT_KEYS.map((k) => {
                        const base = statMap[k]
                        const equip = equipStats[k]
                        const total = equip ? combineExpr(base, equip) : base
                        return (
                          <div key={k} className="bg-muted/50 rounded-lg p-1.5 text-center">
                            <p className="text-muted-foreground">{keyMap[k]}</p>
                            <p className="font-medium">{base === '0' ? '-' : base}</p>
                            {equip && <p className="text-[10px] text-green-400">+ equip: {equip}</p>}
                            {equip && <p className="text-[10px] text-yellow-400">total: {total}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
                {race && race.restrictions.length > 0 && (
                  <div className="text-xs text-destructive/80 space-y-0.5">
                    {race.restrictions.map((r, i) => <p key={i}>{r.message}</p>)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


