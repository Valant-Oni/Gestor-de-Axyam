import { useEffect, useState } from 'react'
import { Character, Race, Tag } from '@/types'
import { useDiceStore } from '@/stores/diceStore'
import { useCharacterStore } from '@/stores/characterStore'
import { Button } from '@/components/ui/button'
import { Dices, History, Sword, Shield, Wand2 } from 'lucide-react'

function parseAttributes(attrs: string | null): Record<string, string> {
  const result: Record<string, string> = {}
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
  const aFlat = parseInt(a)
  const bFlat = parseInt(b)
  if (!isNaN(aFlat) && !isNaN(bFlat)) return String(aFlat + bFlat)
  return `${a} + ${b}`
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

const BASE_STATS = ['vida', 'ataque', 'ataque_magico', 'defensa', 'mana', 'estamina', 'agilidad', 'robo', 'sigilo'] as const
const WEAPON_TAGS = ['arma a 1 mano', 'arma a 2 manos', 'arma ligera']

const quickRolls = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d13', '1d14', '1d15', '1d17', '1d20', '1d100', '1d3+2', '1d10+2']

export function DicePage() {
  const { selectedCharId } = useCharacterStore()
  const [characters, setCharacters] = useState<Character[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [charItems, setCharItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [expr, setExpr] = useState('1d20')
  const [result, setResult] = useState<{ result: number; breakdown: string; expr: string } | null>(null)
  const [rolling, setRolling] = useState(false)
  const { history, roll } = useDiceStore()

  const [charRollResult, setCharRollResult] = useState<{ result: number; breakdown: string; expr: string; statKey: string } | null>(null)
  const [charRolling, setCharRolling] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [chars, raceData, tagData] = await Promise.all([
          window.electronAPI.characters.getAll(),
          window.electronAPI.races.getAll(),
          window.electronAPI.tags.getAll(),
        ])
        setCharacters(chars as Character[])
        setRaces(raceData as Race[])
        setTags(tagData as Tag[])
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedCharId) { setCharItems([]); return }
    const fetch = async () => {
      try {
        const data = await window.electronAPI.characters.getItems(selectedCharId) as any[]
        const enriched: any[] = []
        for (const item of data) {
          const tagIds = await window.electronAPI.tags.getItemTags(item.id)
          const tagNames = tagIds.map((id: number) => tags.find((t) => t.id === id)?.name || '').filter(Boolean)
          enriched.push({ ...item, item_tags: tagNames })
        }
        setCharItems(enriched.filter((it) => it.item_tags && it.item_tags.length > 0))
      } catch (e) { console.error(e) }
    }
    fetch()
  }, [selectedCharId, tags])

  const char = characters.find(c => c.id === selectedCharId)
  const race = races.find(r => r.id === char?.race_id)

  const modifiedBase: Record<string, string> = {}
  const equipStats: Record<string, string> = {}

  if (race) {
    for (const key of BASE_STATS) {
      modifiedBase[key] = (race as any)[key] || '0'
    }
  }

  const equippedItems = charItems.filter((it) => it.equipped)
  const equippedTags = equippedItems.flatMap((it) => it.item_tags || []).map((t: string) => t.toLowerCase())
  const hasHeavyWeapon = equippedTags.some((t: string) => t === 'arma a 1 mano' || t === 'arma a 2 manos')
  const hasLightWeapon = equippedTags.includes('arma ligera')
  const excludeLightWeapon = hasHeavyWeapon && hasLightWeapon

  for (const item of equippedItems) {
    const itemTagLower = (item.item_tags?.[0] || '').toLowerCase()
    const isWeapon = WEAPON_TAGS.includes(itemTagLower)
    const isLight = itemTagLower === 'arma ligera'
    if (isLight && excludeLightWeapon) continue

    const parsed = parseAttributes(item.attributes)
    for (const [key, val] of Object.entries(parsed)) {
      if (!val) continue
      if (key === 'armadura' || key === 'nulimagia') continue
      if (isWeapon) {
        equipStats[key] = combineExpr(equipStats[key], val)
      } else {
        const flatAmt = isFlatBonus(val)
        if (flatAmt !== null && BASE_STATS.includes(key as any)) {
          modifiedBase[key] = applyFlatToBase(modifiedBase[key] || '0', flatAmt)
        } else {
          equipStats[key] = combineExpr(equipStats[key], val)
        }
      }
    }
  }

  const perk10Map: Record<string, number> = { estamina: 1, mana: 2, vida: 2, robo: 2 }
  const perk20Map: Record<string, number> = { ataque: 1, ataque_magico: 1, vida: 3, sigilo: 2 }
  if (char?.perk_10 && perk10Map[char.perk_10]) { modifiedBase[char.perk_10] = applyFlatToBase(modifiedBase[char.perk_10] || '0', perk10Map[char.perk_10]) }
  if (char?.perk_20 && perk20Map[char.perk_20]) { modifiedBase[char.perk_20] = applyFlatToBase(modifiedBase[char.perk_20] || '0', perk20Map[char.perk_20]) }

  const statExpr = (key: string) => computeTotal(modifiedBase[key], equipStats[key])
  const ataqueExpr = statExpr('ataque')
  const ataqueMagicoExpr = statExpr('ataque_magico')
  const defensaExpr = statExpr('defensa')

  const handleRoll = async (e?: string) => {
    const input = e || expr
    if (!input.trim()) return
    setRolling(true)
    try {
      const res = await window.electronAPI.dice.roll(input.trim())
      setResult(res)
      roll(input.trim())
    } catch (err) {
      console.error(err)
    }
    setRolling(false)
  }

  const handleCharRoll = async (statKey: string, e: string) => {
    if (!e || e === '0') return
    setCharRolling(statKey)
    try {
      const res = await window.electronAPI.dice.roll(e)
      setCharRollResult({ ...res, statKey })
      roll(e)
    } catch (err) {
      console.error(err)
    }
    setCharRolling(null)
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Dados</h1>
        <p className="text-muted-foreground text-sm">Tira dados para tus estadísticas y acciones</p>
      </div>

      {selectedCharId && char && race ? (
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <p className="text-sm font-semibold">{char.name} ({race.name}{char.gender ? ` - ${char.gender}` : ''}{char.level > 0 ? ` · Nivel ${char.level}` : ''})</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'ataque', label: 'Ataque', icon: Sword, expr: ataqueExpr },
              { key: 'ataque_magico', label: 'Atq Mágico', icon: Wand2, expr: ataqueMagicoExpr },
              { key: 'defensa', label: 'Defensa', icon: Shield, expr: defensaExpr },
            ].map((s) => (
              <div key={s.key} className="text-center space-y-2">
                <Button onClick={() => handleCharRoll(s.key, s.expr)} disabled={charRolling === s.key || s.expr === '0'}
                  className="w-full" variant={s.expr === '0' ? 'ghost' : 'default'}>
                  <s.icon className={`size-4 ${charRolling === s.key ? 'animate-spin' : ''}`} />
                  {s.label}
                </Button>
                <p className="text-xs font-mono text-muted-foreground">{s.expr}</p>
              </div>
            ))}
          </div>
          {charRollResult && (
            <div className="text-center py-3 border-t">
              <p className="text-xs text-muted-foreground">
                {charRollResult.statKey === 'ataque' ? 'Ataque' : charRollResult.statKey === 'ataque_magico' ? 'Atq Mágico' : 'Defensa'}
              </p>
              <p className="text-4xl font-bold">{charRollResult.result}</p>
              <p className="text-sm text-muted-foreground font-mono">{charRollResult.breakdown}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-xl p-6 bg-card text-center text-muted-foreground text-sm">
          Selecciona un personaje en la barra lateral para ver sus dados de ataque, ataque mágico y defensa.
        </div>
      )}

      <div className="border rounded-xl p-6 bg-card space-y-4">
        <div className="flex gap-2">
          <input value={expr} onChange={(e) => setExpr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
            placeholder="Ej: 1d20, 2d6, 1d3+2"
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
          <Button onClick={() => handleRoll()} disabled={rolling}>
            <Dices className={`size-4 ${rolling ? 'animate-spin' : ''}`} />
            {rolling ? 'Tirando...' : 'Tirar'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {quickRolls.map((d) => (
            <button key={d} onClick={() => { setExpr(d); handleRoll(d) }}
              className="px-2.5 py-1 rounded-lg border bg-background text-xs font-mono hover:bg-accent transition-colors">
              {d}
            </button>
          ))}
        </div>

        {result && (
          <div className="text-center py-4">
            <p className="text-4xl font-bold">{result.result}</p>
            <p className="text-sm text-muted-foreground font-mono">{result.breakdown}</p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2"><History className="size-4" /> Historial</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                <span className="font-mono">{h.expr}</span>
                <span className="font-semibold">{h.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
