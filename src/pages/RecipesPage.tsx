import { useEffect, useState, useMemo } from 'react'
import { Character, MaterialNode, CharacterMaterial } from '@/types'
import { useCharacterStore } from '@/stores/characterStore'
import { Hammer, Search, CheckCircle2, Circle, Package, ChevronRight, ChevronDown, Plus, Minus } from 'lucide-react'

export function RecipesPage() {
  const { selectedCharId } = useCharacterStore()
  const [characters, setCharacters] = useState<Character[]>([])
  const [tree, setTree] = useState<MaterialNode[]>([])
  const [totalsMap, setTotalsMap] = useState<Record<string, number>>({})
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
    if (!selectedCharId) { setTree([]); setTotalsMap({}); setOwnedMap({}); return }
    const load = async () => {
      const [result, owned] = await Promise.all([
        window.electronAPI.characterMaterials.getNeeded(selectedCharId),
        window.electronAPI.characterMaterials.getByCharacter(selectedCharId),
      ])
      setTree(result.tree as MaterialNode[])
      setTotalsMap(result.totals as Record<string, number>)
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

  // Flatten tree node names for search
  function flattenNames(node: MaterialNode): string[] {
    return [node.name.toLowerCase(), ...node.children.flatMap(flattenNames)]
  }

  function matchesSearch(node: MaterialNode, q: string): boolean {
    return flattenNames(node).some((name) => name.includes(q))
  }

  function filterTree(nodes: MaterialNode[], q: string): MaterialNode[] {
    if (!q) return nodes
    return nodes
      .map((n) => ({ ...n, children: filterTree(n.children, q) }))
      .filter((n) => n.children.length > 0 || n.name.toLowerCase().includes(q))
  }

  const filteredTree = useMemo(() => filterTree(tree, search.trim().toLowerCase()), [tree, search])

  const totalCount = Object.keys(totalsMap).length
  const ownedCount = Object.entries(totalsMap).filter(([id, total]) => (ownedMap[parseInt(id)] || 0) >= total).length
  const progressPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

  function renderNode(node: MaterialNode, depth: number) {
    const isBase = node.children.length === 0
    const total = totalsMap[node.id] || 0
    const owned = ownedMap[node.id] || 0
    const completed = owned >= total

    if (isBase) {
      return (
        <div key={`${node.id}-${depth}`} onClick={() => handleToggle(node.id, total)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${completed ? 'bg-primary/5' : 'hover:bg-accent/50'}`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}>
          <span className="shrink-0">
            {completed ? <CheckCircle2 className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground/40" />}
          </span>
          <span className="text-base shrink-0">{node.emoji || '📦'}</span>
          <span className={`text-sm flex-1 ${completed ? 'line-through text-muted-foreground/60' : ''}`}>
            {node.quantity > 1 ? `${node.name} x${node.quantity}` : node.name}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={(e) => handleDecrement(e, node.id)}
              className="p-0.5 rounded hover:bg-accent disabled:opacity-30" disabled={owned <= 0}>
              <Minus className="size-3" />
            </button>
            <span className={`text-sm font-mono min-w-[2ch] text-center ${completed ? 'text-muted-foreground/60' : 'text-foreground'}`}>
              {owned}
            </span>
            <button onClick={(e) => handleIncrement(e, node.id, total)}
              className="p-0.5 rounded hover:bg-accent disabled:opacity-30" disabled={owned >= total}>
              <Plus className="size-3" />
            </button>
            <span className="text-sm text-muted-foreground/50 mx-0.5">/</span>
            <span className={`text-sm font-mono ${completed ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
              {total}
            </span>
          </div>
        </div>
      )
    }

    return (
      <details key={`${node.id}-${depth}`} className="group"
        style={{ paddingLeft: `${depth * 20}px` }}>
        <summary className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-muted-foreground group-open:rotate-90 transition-transform" />
          <span className="text-base shrink-0">{node.emoji || '📦'}</span>
          <span className="text-sm font-medium">{node.name}</span>
          {node.quantity > 1 && <span className="text-xs text-muted-foreground font-mono">x{node.quantity}</span>}
          <span className="text-xs text-muted-foreground/50 ml-auto">{node.children.length} material(es)</span>
        </summary>
        <div className="border-l border-border/50 ml-5 pl-2 space-y-0.5 mt-0.5">
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      </details>
    )
  }

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
      ) : tree.length === 0 ? (
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
            {filteredTree.map((root) => renderNode(root, 0))}
          </div>
        </>
      )}
    </div>
  )
}
