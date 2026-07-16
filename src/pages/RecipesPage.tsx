import { useEffect, useState, useMemo } from 'react'
import { Character, NeededMaterial, CharacterMaterial } from '@/types'
import { useCharacterStore } from '@/stores/characterStore'
import { Hammer, Search, CheckCircle2, Circle, Package, Plus, Minus } from 'lucide-react'

export function RecipesPage() {
  const { selectedCharId } = useCharacterStore()
  const [characters, setCharacters] = useState<Character[]>([])
  const [materials, setMaterials] = useState<NeededMaterial[]>([])
  const [ownedMap, setOwnedMap] = useState<Record<number, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.characters.getAll().then((chars) => {
      setCharacters(chars as Character[])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedCharId) { setMaterials([]); setOwnedMap({}); return }
    const load = async () => {
      const [needed, owned] = await Promise.all([
        window.electronAPI.characterMaterials.getNeeded(selectedCharId),
        window.electronAPI.characterMaterials.getByCharacter(selectedCharId),
      ])
      setMaterials(needed as NeededMaterial[])
      const map: Record<number, number> = {}
      for (const m of owned as CharacterMaterial[]) {
        map[m.item_id] = m.quantity_owned
      }
      setOwnedMap(map)
    }
    load()
  }, [selectedCharId])

  const setOwned = async (itemId: number, value: number) => {
    setOwnedMap((prev) => ({ ...prev, [itemId]: value }))
    await window.electronAPI.characterMaterials.setOwned(selectedCharId!, itemId, value)
  }

  const handleToggle = (itemId: number, totalNeeded: number) => {
    const current = ownedMap[itemId] || 0
    setOwned(itemId, current >= totalNeeded ? 0 : totalNeeded)
  }

  const handleIncrement = (e: React.MouseEvent, itemId: number, totalNeeded: number) => {
    e.stopPropagation()
    const current = ownedMap[itemId] || 0
    if (current < totalNeeded) setOwned(itemId, current + 1)
  }

  const handleDecrement = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation()
    const current = ownedMap[itemId] || 0
    if (current > 0) setOwned(itemId, current - 1)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return materials
    const q = search.toLowerCase()
    return materials.filter((m) => m.name.toLowerCase().includes(q))
  }, [materials, search])

  const totalCount = materials.length
  const ownedCount = materials.filter((m) => (ownedMap[m.id] || 0) >= m.total_needed).length
  const progressPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Materiales</h1>
        <p className="text-muted-foreground text-sm">Materiales necesarios para tus objetos marcados</p>
      </div>

      {!selectedCharId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Selecciona un personaje en la barra lateral</p>
          <p className="text-sm text-muted-foreground">Para ver los materiales que necesita para sus objetos marcados</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Hammer className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay materiales necesarios</p>
          <p className="text-sm text-muted-foreground">Este personaje no tiene objetos marcados con recetas de crafting</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar material..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{ownedCount} de {totalCount} materiales</span>
              <span className="text-muted-foreground">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="space-y-1">
            {filtered.map((m) => {
              const owned = ownedMap[m.id] || 0
              const completed = owned >= m.total_needed
              return (
                <div key={m.id} onClick={() => handleToggle(m.id, m.total_needed)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${completed ? 'bg-primary/5' : 'hover:bg-accent/50'}`}>
                  <span className="shrink-0">
                    {completed ? <CheckCircle2 className="size-5 text-primary" /> : <Circle className="size-5 text-muted-foreground/40" />}
                  </span>
                  <span className="text-lg shrink-0">{m.emoji || '📦'}</span>
                  <span className={`text-sm flex-1 ${completed ? 'line-through text-muted-foreground/60' : ''}`}>{m.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => handleDecrement(e, m.id)}
                      className="p-0.5 rounded hover:bg-accent disabled:opacity-30" disabled={owned <= 0}>
                      <Minus className="size-3.5" />
                    </button>
                    <span className={`text-sm font-mono min-w-[2ch] text-center ${completed ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                      {owned}
                    </span>
                    <button onClick={(e) => handleIncrement(e, m.id, m.total_needed)}
                      className="p-0.5 rounded hover:bg-accent disabled:opacity-30" disabled={owned >= m.total_needed}>
                      <Plus className="size-3.5" />
                    </button>
                    <span className="text-sm text-muted-foreground/50 mx-1">/</span>
                    <span className={`text-sm font-mono ${completed ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                      {m.total_needed}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
