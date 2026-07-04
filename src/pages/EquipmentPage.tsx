import { useEffect, useState } from 'react'
import { Item } from '@/types'
import { Package, Search } from 'lucide-react'

export function EquipmentPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    window.electronAPI.items.getAll().then((data) => {
      setItems(data as Item[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const types = [...new Set(items.map((i) => i.type).filter(Boolean))]
  const filtered = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter && i.type !== typeFilter) return false
    return true
  })

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Equipamiento</h1>
        <p className="text-muted-foreground text-sm">Catálogo de objetos disponibles</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar objetos..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todos los tipos</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay objetos disponibles</p>
          <p className="text-sm text-muted-foreground">Carga los datos desde un CSV para ver el catálogo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="border rounded-xl p-4 bg-card space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.emoji || '📦'}</span>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.type && <p className="text-xs text-muted-foreground">{item.type}</p>}
                </div>
              </div>
              {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
              {item.attributes && <p className="text-xs text-muted-foreground">Atributos: {item.attributes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
