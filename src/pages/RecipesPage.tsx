import { useEffect, useState, useMemo, useCallback } from 'react'
import { MaterialNode, RootMaterialData } from '@/types'
import { useCharacterStore } from '@/stores/characterStore'
import { Hammer, Search, CheckCircle2, Circle, Package, ChevronRight, Plus, Minus } from 'lucide-react'

export function RecipesPage() {
  const { selectedCharId } = useCharacterStore()
  const [roots, setRoots] = useState<RootMaterialData[]>([])
  const [ownedMap, setOwnedMap] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!selectedCharId) { setRoots([]); setOwnedMap({}); return }
    const load = async () => {
      const result = await window.electronAPI.characterMaterials.getNeeded(selectedCharId)
      setRoots(result.roots as RootMaterialData[])
      setOwnedMap(result.ownedByPath as Record<string, number>)
    }
    load()
  }, [selectedCharId])

  const pathToItemId = useMemo(() => {
    const map: Record<string, number> = {}
    function walk(node: MaterialNode) {
      map[node.path] = node.id
      for (const child of node.children) walk(child)
    }
    for (const root of roots) walk(root.tree)
    return map
  }, [roots])

  const ownedByItem = useMemo(() => {
    const itemTotals: Record<number, number> = {}
    for (const [path, qty] of Object.entries(ownedMap)) {
      const itemId = pathToItemId[path]
      if (itemId !== undefined) {
        itemTotals[itemId] = (itemTotals[itemId] || 0) + qty
      }
    }
    return itemTotals
  }, [ownedMap, pathToItemId])

  const setOwned = async (itemId: number, value: number, nodePath: string) => {
    setOwnedMap((prev) => ({ ...prev, [nodePath]: value }))
    await window.electronAPI.characterMaterials.setOwned(selectedCharId!, itemId, value, nodePath)
  }

  const toggleCrafted = useCallback(async (root: RootMaterialData) => {
    const path = root.tree.path || String(root.item.id)
    await window.electronAPI.characterMaterials.setOwned(selectedCharId!, root.item.id, root.crafted ? 0 : 1, path)
    const result = await window.electronAPI.characterMaterials.getNeeded(selectedCharId!)
    setRoots(result.roots as RootMaterialData[])
    setOwnedMap(result.ownedByPath as Record<string, number>)
  }, [selectedCharId])

  const handleToggle = (nodePath: string, itemId: number, totalNeeded: number) => {
    const current = ownedMap[nodePath] || 0
    setOwned(itemId, current >= totalNeeded ? 0 : totalNeeded, nodePath)
  }

  const handleIncrement = (e: React.MouseEvent, nodePath: string, itemId: number, totalNeeded: number) => {
    e.stopPropagation()
    const current = ownedMap[nodePath] || 0
    if (current < totalNeeded) setOwned(itemId, current + 1, nodePath)
  }

  const handleDecrement = (e: React.MouseEvent, nodePath: string, itemId: number) => {
    e.stopPropagation()
    const current = ownedMap[nodePath] || 0
    if (current > 0) setOwned(itemId, current - 1, nodePath)
  }

  function flattenNames(node: MaterialNode): string[] {
    return [node.name.toLowerCase(), ...node.children.flatMap(flattenNames)]
  }

  function matchesRoot(root: RootMaterialData, q: string): boolean {
    return flattenNames(root.tree).some((name) => name.includes(q))
  }

  function filterTree(node: MaterialNode, q: string): MaterialNode | null {
    const filteredChildren = node.children.map((c) => filterTree(c, q)).filter(Boolean) as MaterialNode[]
    const nameMatch = node.name.toLowerCase().includes(q)
    if (nameMatch || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren }
    }
    return null
  }

  const filteredRoots = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roots
    return roots.filter((r) => matchesRoot(r, q))
  }, [roots, search])

  const totals = useMemo(() => {
    const t: Record<string, number> = {}
    for (const root of roots) {
      if (root.crafted) continue
      for (const [id, qty] of Object.entries(root.totals)) {
        t[id] = (t[id] || 0) + qty
      }
    }
    return t
  }, [roots])

  const totalCount = Object.keys(totals).length
  const ownedCount = Object.entries(totals).filter(([id, total]) => (ownedByItem[parseInt(id)] || 0) >= total).length
  const progressPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

  function renderNode(node: MaterialNode, depth: number, rootTotals: Record<string, number>) {
    const isBase = node.children.length === 0 && !node.crafted
    const total = isBase ? node.quantity : (rootTotals[node.id] || 0)
    const owned = ownedMap[node.path] || 0
    const completed = owned >= total

    if (node.crafted) {
      return (
        <div key={node.path}
          className="flex items-center gap-2 px-3 py-2 rounded-lg opacity-50"
          style={{ paddingLeft: `${depth * 20 + 12}px` }}>
          <CheckCircle2 className="size-4 text-primary shrink-0" />
          <span className="text-base shrink-0">{node.emoji || '📦'}</span>
          <span className="text-sm flex-1 line-through text-muted-foreground/60">{node.name}</span>
          <span className="text-xs text-muted-foreground/50">Ya hecho</span>
        </div>
      )
    }

    if (isBase) {
      return (
        <div key={node.path} onClick={() => handleToggle(node.path, node.id, total)}
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
            <button onClick={(e) => handleDecrement(e, node.path, node.id)}
              className="p-0.5 rounded hover:bg-accent disabled:opacity-30" disabled={owned <= 0}>
              <Minus className="size-3" />
            </button>
            <span className={`text-sm font-mono min-w-[2ch] text-center ${completed ? 'text-muted-foreground/60' : 'text-foreground'}`}>
              {owned}
            </span>
            <button onClick={(e) => handleIncrement(e, node.path, node.id, total)}
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
      <details key={node.path} className="group"
        style={{ paddingLeft: `${depth * 20}px` }}>
        <summary className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-muted-foreground group-open:rotate-90 transition-transform" />
          <span className="text-base shrink-0">{node.emoji || '📦'}</span>
          <span className="text-sm font-medium">{node.name}</span>
          {node.quantity > 1 && <span className="text-xs text-muted-foreground font-mono">x{node.quantity}</span>}
          <span className="text-xs text-muted-foreground/50 ml-auto">{node.children.length} material(es)</span>
        </summary>
        <div className="border-l border-border/50 ml-5 pl-2 space-y-0.5 mt-0.5">
          {node.children.map((child) => renderNode(child, depth + 1, rootTotals))}
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
      ) : roots.length === 0 ? (
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

          <div className="space-y-4">
            {filteredRoots.map((root) => (
              <div key={root.item.id} className="rounded-lg border border-border/50 overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-accent/30 border-b border-border/30">
                  <span className="text-lg">{root.item.emoji || '📦'}</span>
                  <span className="text-sm font-semibold flex-1">{root.item.name}</span>
                  {root.crafted ? (
                    <>
                      <span className="text-xs text-primary font-medium">✓ Ya hecho</span>
                      <button onClick={() => toggleCrafted(root)}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-accent/70 transition-colors">
                        Rehacer
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground/50">{Object.keys(root.totals).length} material(es)</span>
                      <button onClick={() => toggleCrafted(root)}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-accent/70 transition-colors">
                        Marcar hecho
                      </button>
                    </>
                  )}
                </div>
                {root.crafted && (
                  <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground/60 italic">
                    <CheckCircle2 className="size-4 text-primary" />
                    Este objeto ya est&aacute; marcado como creado. Sus materiales no cuentan en el total.
                  </div>
                )}
                {!root.crafted && (
                  <div className="p-1">
                    {root.tree.children.length > 0 ? (
                      root.tree.children.map((child) => renderNode(child, 0, root.totals))
                    ) : (
                      <div className="px-3 py-4 text-sm text-muted-foreground/60 italic">
                        Este objeto no requiere materiales adicionales
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
