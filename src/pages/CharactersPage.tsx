import { useEffect, useState } from 'react'
import { Character, Race, Zone } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, User } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'

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
  if (/^-?\d+$/.test(a) && /^-?\d+$/.test(b)) return `${parseInt(a) + parseInt(b)}`
  return `${a} + ${b}`
}

function applyFlatToBase(baseExpr: string, flatAmount: number): string {
  const diceMatch = baseExpr.match(/^(\d*)d(\d+)$/)
  if (diceMatch) {
    const count = parseInt(diceMatch[1] || '1')
    const sides = parseInt(diceMatch[2]) + flatAmount
    if (sides <= 0) return '0'
    return `${count}d${sides}`
  }
  const numMatch = baseExpr.match(/^(-?\d+)$/)
  if (numMatch) {
    const val = parseInt(numMatch[1]) + flatAmount
    return String(val)
  }
  return `${baseExpr} + ${flatAmount}`
}

function isFlatBonus(expr: string): number | null {
  const m = expr.match(/^-?\d+$/)
  return m ? parseInt(expr) : null
}

function computeTotal(base: string | undefined, equip: string | undefined): string {
  if (!base && !equip) return '0'
  if (!base) return equip || '0'
  if (!equip) return base
  const isNum = (s: string) => /^-?\d+$/.test(s)
  if (isNum(base) && isNum(equip)) return String(parseInt(base) + parseInt(equip))
  return `${base} + ${equip}`
}

const BASE_STATS = ['vida', 'ataque', 'ataque_magico', 'defensa', 'mana', 'estamina', 'agilidad', 'robo', 'sigilo'] as const

export function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [charItems, setCharItems] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Character | null>(null)
  const [form, setForm] = useState({ name: '', race_id: '', gender: '', level: 'none', perk_10: '', perk_20: '' })

  const PERK_10_OPTIONS = [
    { id: 'estamina', label: '+1 Estamina' },
    { id: 'mana', label: '+2 Mana' },
    { id: 'vida', label: '+2 Vida' },
    { id: 'robo', label: '+2 Robo' },
  ]
  const PERK_20_OPTIONS = [
    { id: 'ataque', label: '+1 Ataque' },
    { id: 'ataque_magico', label: '+1 Atq Mágico' },
    { id: 'vida', label: '+3 Vida' },
    { id: 'sigilo', label: '+2 Sigilo' },
  ]

  const load = async () => {
    try {
      const [chars, raceData, zoneData] = await Promise.all([
        window.electronAPI.characters.getAll(),
        window.electronAPI.races.getAll(),
        window.electronAPI.zones.getAll(),
      ])
      setCharacters(chars as Character[])
      useCharacterStore.getState().setCharacters(chars as Character[])
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
    const levelVal = form.level === 'none' ? 0 : parseInt(form.level)
    const data = { name: form.name.trim(), race_id: form.race_id ? parseInt(form.race_id) : undefined, gender: form.gender || undefined, level: levelVal, perk_10: form.level !== 'none' ? form.perk_10 || null : null, perk_20: form.level === '20' ? form.perk_20 || null : null }
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
    setForm({ name: '', race_id: '', gender: '', level: 'none', perk_10: '', perk_20: '' })
    load()
  }

  const handleEdit = (c: Character) => {
    setEditing(c)
    setForm({ name: c.name, race_id: c.race_id?.toString() || '', gender: c.gender || '', level: c.level === 10 ? '10' : c.level === 20 ? '20' : 'none', perk_10: c.perk_10 || '', perk_20: c.perk_20 || '' })
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
        <Button onClick={() => { setEditing(null); setForm({ name: '', race_id: '', gender: '', level: 'none', perk_10: '', perk_20: '' }); setShowForm(true) }}>
          <Plus className="size-4" /> Nuevo personaje
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-xl p-4 space-y-3 bg-card">
          <h3 className="font-semibold">{editing ? 'Editar personaje' : 'Nuevo personaje'}</h3>
          <div className="grid grid-cols-4 gap-3">
            <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <select value={form.race_id} onChange={(e) => setForm({ ...form, race_id: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Selecciona raza...</option>
              {baseRaces.map((r) => {
                const evolutions = races.filter((ev) => ev.parent_race_id === r.id)
                if (evolutions.length > 0) {
                  return (
                    <optgroup key={r.id} label={r.name}>
                      <option value={r.id}>{r.name}</option>
                      {evolutions.map((ev) => (
                        <option key={ev.id} value={ev.id}>  {ev.name} (evolución)</option>
                      ))}
                    </optgroup>
                  )
                }
                return <option key={r.id} value={r.id}>{r.name}</option>
              })}
            </select>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Sin género</option>
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
            </select>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value, perk_10: e.target.value === 'none' ? '' : form.perk_10, perk_20: e.target.value !== '20' ? '' : form.perk_20 })}
              className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="none">Sin perks</option>
              <option value="10">Nivel 10</option>
              <option value="20">Nivel 20</option>
            </select>
          </div>
          {form.level !== 'none' && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Perk nivel 10</p>
              <div className="flex gap-4">
                {PERK_10_OPTIONS.map(p => (
                  <label key={p.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="perk_10" value={p.id} checked={form.perk_10 === p.id}
                      onChange={(e) => setForm({ ...form, perk_10: e.target.value })} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          {form.level === '20' && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Perk nivel 20</p>
              <div className="flex gap-4">
                {PERK_20_OPTIONS.map(p => (
                  <label key={p.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name="perk_20" value={p.id} checked={form.perk_20 === p.id}
                      onChange={(e) => setForm({ ...form, perk_20: e.target.value })} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          )}
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
                    <p className="text-sm text-muted-foreground">{race?.name || 'Sin raza'}{c.gender ? ` - ${c.gender}` : ''}{c.level > 0 ? ` · Nivel ${c.level}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(c)} className="p-1 hover:bg-accent rounded"><Edit2 className="size-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-accent rounded"><Trash2 className="size-4 text-destructive" /></button>
                  </div>
                </div>
                {race && (() => {
                  const equipped = (charItems[c.id] || []).filter((i: any) => i.equipped)

                  const modifiedBase: Record<string, string> = {}
                  for (const k of BASE_STATS) {
                    modifiedBase[k] = (race as any)[k] || '0'
                  }

                  const equipStats: Record<string, string> = {}
                  for (const item of equipped) {
                    const parsed = parseItemAttributes(item.attributes)
                    for (const [key, val] of Object.entries(parsed)) {
                      if (!val) continue
                      if (key === 'armadura' || key === 'nulimagia') {
                        equipStats[key] = combineExpr(equipStats[key], val)
                        continue
                      }
                      const flatAmt = isFlatBonus(val)
                      if (flatAmt !== null && BASE_STATS.includes(key as any)) {
                        modifiedBase[key] = applyFlatToBase(modifiedBase[key] || '0', flatAmt)
                      } else {
                        equipStats[key] = combineExpr(equipStats[key], val)
                      }
                    }
                  }

                  const perk10Map: Record<string, number> = { estamina: 1, mana: 2, vida: 2, robo: 2 }
                  const perk20Map: Record<string, number> = { ataque: 1, ataque_magico: 1, vida: 3, sigilo: 2 }
                  if (c.perk_10 && perk10Map[c.perk_10]) { modifiedBase[c.perk_10] = applyFlatToBase(modifiedBase[c.perk_10] || '0', perk10Map[c.perk_10]) }
                  if (c.perk_20 && perk20Map[c.perk_20]) { modifiedBase[c.perk_20] = applyFlatToBase(modifiedBase[c.perk_20] || '0', perk20Map[c.perk_20]) }
                  const keyMap: Record<string, string> = { vida: 'Vida', ataque: 'Ataque', ataque_magico: 'Atq Mágico', defensa: 'Defensa', mana: 'Mana', estamina: 'Estamina', agilidad: 'Agilidad', robo: 'Robo', sigilo: 'Sigilo', armadura: 'Armadura', nulimagia: 'Nulimagia' }
                  const allKeys = [...BASE_STATS, 'armadura', 'nulimagia'] as const
                  return (
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {allKeys.map((k) => {
                        const base = modifiedBase[k]
                        const equip = equipStats[k]
                        const total = computeTotal(base, equip)
                        const restriction = race.restrictions.find((r) => r.restricted_stat === k)
                        const displayTotal = restriction ? String(restriction.max_value) : total
                        return (
                          <div key={k} className="bg-muted/50 rounded-lg p-1.5 text-center">
                            <p className="text-muted-foreground">{keyMap[k]}</p>
                            <p className="font-medium">{displayTotal}</p>
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


