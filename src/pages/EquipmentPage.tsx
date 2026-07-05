import { useEffect, useState } from 'react'
import { Character, Tag } from '@/types'
import { ScrollText, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MarkedItem {
  link_id: number
  equipped: number
  id: number
  name: string
  type: string
  attributes: string | null
  emoji: string | null
  description: string | null
  item_tags?: string[]
}

interface StatSum {
  vida: string
  ataque: string
  ataque_magico: string
  defensa: string
  armadura: string
  mana: string
  estamina: string
  agilidad: string
  robo: string
  sigilo: string
  nulimagia: string
}

interface Penalties {
  sigilo: number
  robo: number
  agilidad_huir: number
  agilidad_perseguir: number
}

function parseAttributes(attrs: string | null): Partial<StatSum> {
  const result: Partial<StatSum> = {}
  if (!attrs) return result
  const parts = attrs.split(',').map((p) => p.trim().toLowerCase())
  for (const part of parts) {
    const m = part.match(/^(.+?)\s*\+\s*(.+)$/)
    if (m) {
      const key = m[1].trim().replace(/[^a-záéíóúñ]/g, '')
      let expr = m[2].trim()
      if (expr.startsWith('+')) expr = expr.slice(1)
      if (key.includes('vida')) result.vida = combineExpr(result.vida, expr)
      else if (key.includes('ataque') && key.includes('mag')) result.ataque_magico = combineExpr(result.ataque_magico, expr)
      else if (key.includes('ataque')) result.ataque = combineExpr(result.ataque, expr)
      else if (key.includes('defensa')) result.defensa = combineExpr(result.defensa, expr)
      else if (key.includes('armadur')) result.armadura = combineExpr(result.armadura, expr)
      else if (key.includes('mana')) result.mana = combineExpr(result.mana, expr)
      else if (key.includes('estamin')) result.estamina = combineExpr(result.estamina, expr)
      else if (key.includes('agilid')) result.agilidad = combineExpr(result.agilidad, expr)
      else if (key.includes('robo')) result.robo = combineExpr(result.robo, expr)
      else if (key.includes('sigilo')) result.sigilo = combineExpr(result.sigilo, expr)
      else if (key.includes('nulimag')) result.nulimagia = combineExpr(result.nulimagia, expr)
    }
    const m2 = part.match(/^(.+?)\s*-\s*(\d+)$/)
    if (m2) {
      const key = m2[1].trim().replace(/[^a-záéíóúñ]/g, '')
      const val = parseInt(m2[2])
      const expr = `-${val}`
      if (key.includes('vida')) result.vida = combineExpr(result.vida, expr)
      else if (key.includes('ataque') && key.includes('mag')) result.ataque_magico = combineExpr(result.ataque_magico, expr)
      else if (key.includes('ataque')) result.ataque = combineExpr(result.ataque, expr)
      else if (key.includes('defensa')) result.defensa = combineExpr(result.defensa, expr)
      else if (key.includes('armadur')) result.armadura = combineExpr(result.armadura, expr)
      else if (key.includes('mana')) result.mana = combineExpr(result.mana, expr)
      else if (key.includes('estamin')) result.estamina = combineExpr(result.estamina, expr)
      else if (key.includes('agilid')) result.agilidad = combineExpr(result.agilidad, expr)
      else if (key.includes('robo')) result.robo = combineExpr(result.robo, expr)
      else if (key.includes('sigilo')) result.sigilo = combineExpr(result.sigilo, expr)
      else if (key.includes('nulimag')) result.nulimagia = combineExpr(result.nulimagia, expr)
    }
  }
  return result
}

function combineExpr(a: string | undefined, b: string): string {
  if (!a) return b
  const aFlat = flatValue(a)
  const bFlat = flatValue(b)
  if (aFlat !== null && bFlat !== null) {
    return String(aFlat + bFlat)
  }
  return `${a} + ${b}`
}

function flatValue(expr: string): number | null {
  const n = parseInt(expr)
  if (!isNaN(n)) return n
  return null
}

function numericValue(expr: string): number {
  const n = parseInt(expr)
  if (!isNaN(n)) return n
  if (expr.includes('d')) {
    const parts = expr.split(/[d+]/).filter(Boolean)
    const nums = parts.map(Number).filter((n) => !isNaN(n))
    return nums.reduce((a, b) => a + b, 0)
  }
  return 0
}

function calcPenalties(armadura: string): Penalties {
  const arm = numericValue(armadura)
  return {
    sigilo: Math.floor(arm / 25),
    robo: Math.floor(arm / 30),
    agilidad_huir: Math.floor(arm / 15),
    agilidad_perseguir: Math.floor(arm / 25),
  }
}

export function EquipmentPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedChar, setSelectedChar] = useState<number | null>(null)
  const [markedItems, setMarkedItems] = useState<MarkedItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [chars, tagData] = await Promise.all([
        window.electronAPI.characters.getAll(),
        window.electronAPI.tags.getAll(),
      ])
      setCharacters(chars as Character[])
      setTags(tagData as Tag[])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selectedChar) { setMarkedItems([]); return }
    const fetchItems = async () => {
      try {
        const data = await window.electronAPI.characters.getItems(selectedChar) as MarkedItem[]
        const enriched: MarkedItem[] = []
        for (const item of data) {
          const tagIds = await window.electronAPI.tags.getItemTags(item.id)
          const tagNames = tagIds.map((id: number) => tags.find((t) => t.id === id)?.name || '').filter(Boolean)
          enriched.push({ ...item, item_tags: tagNames })
        }
        setMarkedItems(enriched)
      } catch (e) { console.error(e) }
    }
    fetchItems()
  }, [selectedChar, tags])

  const toggleEquipped = async (itemId: number, currentlyEquipped: number) => {
    if (!selectedChar) return
    const newVal = currentlyEquipped ? false : true
    try {
      await window.electronAPI.characters.setEquipped(selectedChar, itemId, newVal)
      setMarkedItems((prev) => prev.map((it) => it.id === itemId ? { ...it, equipped: newVal ? 1 : 0 } : it))
    } catch (e) { console.error(e) }
  }

  const unmarkItem = async (itemId: number) => {
    if (!selectedChar) return
    try {
      await window.electronAPI.characters.unmarkItem(selectedChar, itemId)
      setMarkedItems((prev) => prev.filter((it) => it.id !== itemId))
    } catch (e) { console.error(e) }
  }

  // Group by tag
  const equippedItems = markedItems.filter((it) => it.equipped)

  const groupedByTag: Record<string, MarkedItem[]> = {}
  for (const item of markedItems) {
    const itemTags = item.item_tags && item.item_tags.length > 0 ? item.item_tags : ['(sin tag)']
    for (const tagName of itemTags) {
      if (!groupedByTag[tagName]) groupedByTag[tagName] = []
      groupedByTag[tagName].push(item)
    }
  }

  // Sum stats from equipped items
  const totalStats: StatSum = { vida: '', ataque: '', ataque_magico: '', defensa: '', armadura: '', mana: '', estamina: '', agilidad: '', robo: '', sigilo: '', nulimagia: '' }
  for (const item of equippedItems) {
    const parsed = parseAttributes(item.attributes)
    for (const [key, val] of Object.entries(parsed)) {
      if (val && key in totalStats) (totalStats as any)[key] = combineExpr((totalStats as any)[key], val as string)
    }
  }
  const penalties = calcPenalties(totalStats.armadura)

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipamiento</h1>
          <p className="text-muted-foreground text-sm">Gestiona el equipo activo de tu personaje. Solo 1 objeto por tag.</p>
        </div>
        <select value={selectedChar || ''} onChange={(e) => setSelectedChar(e.target.value ? parseInt(e.target.value) : null)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Selecciona personaje...</option>
          {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedChar ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ScrollText className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Selecciona un personaje para ver su equipamiento</p>
        </div>
      ) : markedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Este personaje no tiene objetos marcados</p>
          <p className="text-sm text-muted-foreground">Ve a Objetos y marca algunos con checkmark</p>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="border rounded-xl p-4 bg-card space-y-2">
            <h3 className="font-semibold text-sm">Bonificaciones totales (equipado)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              <SummaryStat label="Vida" value={totalStats.vida} />
              <SummaryStat label="Ataque" value={totalStats.ataque} />
              <SummaryStat label="Atq Mágico" value={totalStats.ataque_magico} />
              <SummaryStat label="Defensa" value={totalStats.defensa} />
              <SummaryStat label="Armadura" value={totalStats.armadura} />
              <SummaryStat label="Mana" value={totalStats.mana} />
              <SummaryStat label="Estamina" value={totalStats.estamina} />
              <SummaryStat label="Agilidad" value={totalStats.agilidad} />
              <SummaryStat label="Robo" value={totalStats.robo} />
              <SummaryStat label="Sigilo" value={totalStats.sigilo} />
              <SummaryStat label="Nulimagia" value={totalStats.nulimagia} />
            </div>

            {totalStats.armadura && numericValue(totalStats.armadura) > 0 && (
              <div className="pt-2 border-t space-y-0.5">
                <p className="text-xs font-medium text-destructive">Penalizaciones por armadura ({totalStats.armadura} total):</p>
                {penalties.sigilo > 0 && <p className="text-xs text-destructive/80">-{penalties.sigilo} sigilo (cada 25)</p>}
                {penalties.robo > 0 && <p className="text-xs text-destructive/80">-{penalties.robo} robo (cada 30)</p>}
                {penalties.agilidad_huir > 0 && <p className="text-xs text-destructive/80">-{penalties.agilidad_huir} agilidad al huir (cada 15)</p>}
                {penalties.agilidad_perseguir > 0 && <p className="text-xs text-destructive/80">-{penalties.agilidad_perseguir} agilidad al perseguir (cada 25)</p>}
              </div>
            )}
          </div>

          {/* Items grouped by tag */}
          <div className="space-y-4">
            {Object.entries(groupedByTag).map(([tagName, items]) => {
              const equippedInGroup = items.filter((it) => it.equipped)
              return (
                <div key={tagName} className="border rounded-xl bg-card overflow-hidden">
                  <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{tagName}</h3>
                    <span className="text-xs text-muted-foreground">{equippedInGroup.length}/1 equipado</span>
                  </div>
                  <div className="divide-y">
                    {items.map((item) => {
                      const isEquipped = item.equipped === 1
                      const blocked = equippedInGroup.length > 0 && !isEquipped
                      return (
                        <div key={item.id} className={`flex items-center gap-3 px-4 py-2.5 ${isEquipped ? 'bg-primary/5' : ''} ${blocked ? 'opacity-50' : ''}`}>
                          <input type="checkbox" checked={isEquipped}
                            onChange={() => toggleEquipped(item.id, item.equipped)}
                            disabled={blocked && !isEquipped}
                            className="rounded border-gray-400" />
                          <span className="text-lg">{item.emoji || '📦'}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            {item.attributes && <p className="text-xs text-muted-foreground">{item.attributes}</p>}
                          </div>
                          <button onClick={() => unmarkItem(item.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive/70 hover:text-destructive" title="Quitar">
                            <X className="size-3.5" />
                          </button>
                        </div>
                      )
                    })}
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  if (!value) return null
  const isFlat = /^\d+$/.test(value)
  const display = isFlat ? (parseInt(value) >= 0 ? `+${parseInt(value)}` : `${parseInt(value)}`) : value
  return (
    <div className="bg-muted/50 rounded-lg p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{display}</p>
    </div>
  )
}
