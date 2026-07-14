import { useEffect, useState } from 'react'
import { Item, Tag, Recipe, RecipeIngredient } from '@/types'
import { Package, Search, Check, Tags as TagsIcon, Hammer } from 'lucide-react'
import { useCharacterStore } from '@/stores/characterStore'

export function ObjectsPage() {
  const { selectedCharId, setSelectedCharId } = useCharacterStore()
  const [items, setItems] = useState<Item[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [markedItems, setMarkedItems] = useState<Set<number>>(new Set())
  const [itemTags, setItemTags] = useState<Record<number, number[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [expandedRecipe, setExpandedRecipe] = useState<Set<number>>(new Set())
  const [recipeIngredients, setRecipeIngredients] = useState<Record<number, RecipeIngredient[]>>({})

  const load = async () => {
    try {
      const [itemsData, tagsData, recipesData] = await Promise.all([
        window.electronAPI.items.getAll(),
        window.electronAPI.tags.getAll(),
        window.electronAPI.recipes.getAll(),
      ])
      setItems(itemsData as Item[])
      setTags(tagsData as Tag[])
      setRecipes(recipesData as Recipe[])

      // Eagerly load tags for all items
      const tagsMap: Record<number, number[]> = {}
      for (const item of itemsData as Item[]) {
        const ids = await window.electronAPI.tags.getItemTags(item.id)
        tagsMap[item.id] = ids
      }
      setItemTags(tagsMap)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const recipesByProduct: Record<string, Recipe> = {}
  for (const r of recipes) recipesByProduct[r.product_name.toLowerCase()] = r

  const toggleRecipe = async (recipeId: number) => {
    if (expandedRecipe.has(recipeId)) {
      setExpandedRecipe((prev) => { const next = new Set(prev); next.delete(recipeId); return next })
    } else {
      if (!recipeIngredients[recipeId]) {
        const data = await window.electronAPI.recipes.getIngredients(recipeId)
        setRecipeIngredients((prev) => ({ ...prev, [recipeId]: data as RecipeIngredient[] }))
      }
      setExpandedRecipe((prev) => { const next = new Set(prev); next.add(recipeId); return next })
    }
  }

  useEffect(() => {
    if (!selectedCharId) { setMarkedItems(new Set()); return }
    window.electronAPI.characters.getItems(selectedCharId).then((data: any[]) => {
      const marked = new Set<number>()
      for (const item of data) marked.add(item.id)
      setMarkedItems(marked)
    })
  }, [selectedCharId])

  const toggleMark = async (itemId: number) => {
    if (!selectedCharId) return
    try {
      if (markedItems.has(itemId)) {
        await window.electronAPI.characters.unmarkItem(selectedCharId, itemId)
        setMarkedItems((prev) => { const next = new Set(prev); next.delete(itemId); return next })
      } else {
        await window.electronAPI.characters.markItem(selectedCharId, itemId)
        setMarkedItems((prev) => new Set(prev).add(itemId))
      }
    } catch (e) { console.error(e) }
  }

  const filtered = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    const itemTagIds = itemTags[i.id] || []
    if (tagFilter === 'untagged') return itemTagIds.length === 0
    if (tagFilter === 'tagged') return itemTagIds.length > 0
    if (tagFilter) {
      const tagId = parseInt(tagFilter)
      if (!isNaN(tagId)) return itemTagIds.includes(tagId)
    }
    return true
  })

  const tagName = (tagId: number) => tags.find((t) => t.id === tagId)?.name || '?'

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Objetos</h1>
        <p className="text-muted-foreground text-sm">Catálogo completo de objetos. Selecciona un personaje en la barra lateral para marcar objetos.</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar objetos..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los tags</option>
          <option value="tagged">Con tag</option>
          <option value="untagged">Sin tag</option>
          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const itemTagIds = itemTags[item.id] || []
          return (
            <div key={item.id} className={`border rounded-xl p-4 bg-card space-y-2 transition-colors ${markedItems.has(item.id) ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.emoji || '📦'}</span>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.type && <p className="text-xs text-muted-foreground">{item.type}</p>}
                  </div>
                </div>
                {selectedCharId && (
                  <button onClick={() => toggleMark(item.id)}
                    className={`p-1.5 rounded-full transition-colors ${markedItems.has(item.id) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                    {markedItems.has(item.id) ? <Check className="size-3.5" /> : <Package className="size-3.5" />}
                  </button>
                )}
              </div>
              {item.attributes && item.attributes !== '{}' ? (
                <p className="text-xs text-muted-foreground">{item.attributes}</p>
              ) : item.description ? (
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              ) : null}
              {item.image ? (
                <div className="flex justify-center py-2">
                  <img src={item.image} alt={item.name}
                    className="h-36 object-contain rounded-lg"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
                </div>
              ) : (
                <div className="flex justify-center py-6">
                  <span className="text-4xl">{item.emoji || '📦'}</span>
                </div>
              )}
              {false && item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
              {false && item.attributes && <p className="text-xs text-muted-foreground">Atributos: {item.attributes}</p>}

              {itemTagIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {itemTagIds.map((tagId) => (
                    <span key={tagId} className="px-2 py-0.5 rounded text-xs border bg-primary/10 text-primary border-primary/20">
                      {tagName(tagId)}
                    </span>
                  ))}
                </div>
              )}

              {recipesByProduct[item.name.toLowerCase()] && (
                <div className="pt-1">
                  <button onClick={() => toggleRecipe(recipesByProduct[item.name.toLowerCase()].id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Hammer className="size-3" /> Receta de crafting
                  </button>
                  {expandedRecipe.has(recipesByProduct[item.name.toLowerCase()].id) && (
                    <div className="mt-1.5 p-2 rounded-lg bg-muted/30 border text-xs space-y-1">
                      {(() => {
                        const r = recipesByProduct[item.name.toLowerCase()]
                        return (
                          <>
                            <div className="flex gap-2 text-muted-foreground">
                              {r.method && <span>Método: {r.method}</span>}
                              {r.time && <span>Tiempo: {r.time}</span>}
                            </div>
                            {recipeIngredients[r.id] && recipeIngredients[r.id].length > 0 && (
                              <div>
                                <p className="text-muted-foreground mb-0.5">Ingredientes:</p>
                                <div className="space-y-0.5">
                                  {recipeIngredients[r.id].map((ing, i) => (
                                    <div key={i} className="flex items-center gap-1">
                                      <span>{ing.emoji || '•'}</span>
                                      <span>{ing.name}</span>
                                      <span className="text-muted-foreground">x{ing.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
