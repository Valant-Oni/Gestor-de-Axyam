import { useEffect, useState } from 'react'
import { Recipe, RecipeIngredient } from '@/types'
import { ScrollText, ChevronDown, ChevronRight } from 'lucide-react'

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [ingredients, setIngredients] = useState<Record<number, RecipeIngredient[]>>({})

  useEffect(() => {
    window.electronAPI.recipes.getAll().then((data) => {
      setRecipes(data as Recipe[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const toggleExpand = async (id: number) => {
    if (expanded.has(id)) {
      setExpanded((prev) => { const next = new Set(prev); next.delete(id); return next })
    } else {
      if (!ingredients[id]) {
        const data = await window.electronAPI.recipes.getIngredients(id)
        setIngredients((prev) => ({ ...prev, [id]: data as RecipeIngredient[] }))
      }
      setExpanded((prev) => { const next = new Set(prev); next.add(id); return next })
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Recetas</h1>
        <p className="text-muted-foreground text-sm">Materiales necesarios para crafting</p>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ScrollText className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay recetas cargadas</p>
          <p className="text-sm text-muted-foreground">Carga los datos desde un CSV para ver las recetas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recipes.map((r) => (
            <div key={r.id} className="border rounded-xl bg-card overflow-hidden">
              <button onClick={() => toggleExpand(r.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                {expanded.has(r.id) ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                <span className="text-lg">{r.product_emoji || '📦'}</span>
                <span className="font-medium text-sm flex-1">{r.product_name}</span>
                <span className="text-xs text-muted-foreground">{r.method}</span>
                {r.time && <span className="text-xs text-muted-foreground">{r.time}</span>}
              </button>
              {expanded.has(r.id) && (
                <div className="px-4 pb-3 pt-1 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Ingredientes:</p>
                  <div className="space-y-1">
                    {(ingredients[r.id] || []).map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span>{ing.emoji || '•'}</span>
                        <span>{ing.name}</span>
                        <span className="text-muted-foreground">x{ing.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
