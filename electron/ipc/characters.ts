import { ipcMain } from 'electron'
import { getDatabase } from '../database/connection'

export function registerCharacterHandlers() {
  ipcMain.handle('characters:getAll', () => {
    const db = getDatabase()
    return db.prepare(`
      SELECT c.*, r.name as race_name
      FROM characters c
      LEFT JOIN races r ON r.id = c.race_id
      ORDER BY c.name
    `).all()
  })

  ipcMain.handle('characters:getById', (_event, id: number) => {
    const db = getDatabase()
    return db.prepare(`
      SELECT c.*, r.name as race_name
      FROM characters c
      LEFT JOIN races r ON r.id = c.race_id
      WHERE c.id = ?
    `).get(id)
  })

  ipcMain.handle('characters:create', (_event, char: any) => {
    const db = getDatabase()
    const result = db.prepare(`INSERT INTO characters (name, race_id, gender, level, perk_10, perk_20, description, notes, active_zone, active_blood, wings_open) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      char.name, char.race_id || null, char.gender || null, char.level ?? 1, char.perk_10 || null, char.perk_20 || null, char.description || null, char.notes || null,
      char.active_zone || null, char.active_blood || null, char.wings_open ? 1 : 0
    )
    return { id: result.lastInsertRowid, ...char }
  })

  ipcMain.handle('characters:update', (_event, id: number, char: any) => {
    const db = getDatabase()
    db.prepare(`UPDATE characters SET name=?, race_id=?, gender=?, level=?, perk_10=?, perk_20=?, description=?, notes=?, active_zone=?, active_blood=?, wings_open=? WHERE id=?`).run(
      char.name, char.race_id || null, char.gender || null, char.level ?? 1, char.perk_10 || null, char.perk_20 || null, char.description || null, char.notes || null,
      char.active_zone || null, char.active_blood || null, char.wings_open ? 1 : 0, id
    )
    return { id, ...char }
  })

  ipcMain.handle('characters:delete', (_event, id: number) => {
    const db = getDatabase()
    db.prepare('DELETE FROM character_items WHERE character_id = ?').run(id)
    db.prepare('DELETE FROM character_materials WHERE character_id = ?').run(id)
    db.prepare('DELETE FROM characters WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle('characters:getItems', (_event, id: number) => {
    const db = getDatabase()
    return db.prepare(`
      SELECT ci.id as link_id, ci.equipped, ci.created_at, i.*
      FROM character_items ci
      JOIN items i ON i.id = ci.item_id
      WHERE ci.character_id = ?
      ORDER BY i.name
    `).all(id)
  })

  ipcMain.handle('characters:markItem', (_event, charId: number, itemId: number) => {
    const db = getDatabase()
    db.prepare('INSERT OR IGNORE INTO character_items (character_id, item_id) VALUES (?, ?)').run(charId, itemId)
  })

  ipcMain.handle('characters:unmarkItem', (_event, charId: number, itemId: number) => {
    const db = getDatabase()
    db.prepare('DELETE FROM character_items WHERE character_id = ? AND item_id = ?').run(charId, itemId)
  })

  ipcMain.handle('characters:setEquipped', (_event, charId: number, itemId: number, equipped: boolean) => {
    const db = getDatabase()
    db.prepare('UPDATE character_items SET equipped = ? WHERE character_id = ? AND item_id = ?').run(equipped ? 1 : 0, charId, itemId)
  })

  ipcMain.handle('characterMaterials:getNeeded', (_event, characterId: number) => {
    const db = getDatabase()

    const markedItems = db.prepare('SELECT item_id FROM character_items WHERE character_id = ?').all(characterId) as any[]
    if (markedItems.length === 0) return { roots: [], ownedByPath: {}, ownedByItem: {} }

    const allRecipes = db.prepare('SELECT * FROM recipes').all() as any[]
    const allIngredients = db.prepare('SELECT * FROM recipe_ingredients').all() as any[]

    const ingredientsByRecipe: Record<number, any[]> = {}
    for (const ing of allIngredients) {
      if (!ingredientsByRecipe[ing.recipe_id]) ingredientsByRecipe[ing.recipe_id] = []
      ingredientsByRecipe[ing.recipe_id].push(ing)
    }

    const recipeByProduct: Record<number, any> = {}
    for (const recipe of allRecipes) {
      recipeByProduct[recipe.product_item_id] = recipe
    }

    const allItems = db.prepare('SELECT id, name, emoji, tags FROM items').all() as any[]
    const itemLookup: Record<number, any> = {}
    for (const item of allItems) {
      itemLookup[item.id] = item
    }

    const ownedMaterials = db.prepare('SELECT item_id, quantity_owned, node_path FROM character_materials WHERE character_id = ?').all(characterId) as any[]
    const ownedByPath: Record<string, number> = {}
    const ownedByItem: Record<number, number> = {}
    for (const om of ownedMaterials) {
      const path = om.node_path || ''
      ownedByPath[path] = (ownedByPath[path] || 0) + om.quantity_owned
      ownedByItem[om.item_id] = (ownedByItem[om.item_id] || 0) + om.quantity_owned
    }

    const baseMaterialTags = ['Material', 'Mineral', 'Ingrediente', 'Gema', 'Madera', 'Planta']

    function isBaseMaterial(tags: string | null): boolean {
      if (!tags) return false
      const tagList = tags.split(',').map((t: string) => t.trim())
      return tagList.some((t: string) => baseMaterialTags.includes(t))
    }

    function isCrafted(itemId: number): boolean {
      return !!recipeByProduct[itemId] && (ownedByItem[itemId] || 0) > 0
    }

    function buildTree(itemId: number, quantity: number, visited: Set<number>, path: string): any {
      const item = itemLookup[itemId]
      const recipe = recipeByProduct[itemId]
      const isVisited = visited.has(itemId)
      const newVisited = new Set(visited)
      newVisited.add(itemId)
      const isBase = isBaseMaterial(item?.tags)
      const crafted = isCrafted(itemId)

      const children: any[] = []
      if (recipe && !isVisited && !isBase && !crafted) {
        const ingredients = ingredientsByRecipe[recipe.id] || []
        for (const ing of ingredients) {
          const childPath = path + '>' + ing.item_id
          children.push(buildTree(ing.item_id, quantity * ing.quantity, newVisited, childPath))
        }
      }

      return {
        id: itemId,
        name: item?.name || 'Desconocido',
        emoji: item?.emoji || null,
        quantity,
        children,
        path,
        crafted: recipe && !isBase && crafted,
      }
    }

    function accumulateBase(node: any): Record<string, number> {
      const totals: Record<string, number> = {}
      function walk(n: any) {
        if (n.crafted) return
        if (n.children.length === 0) {
          totals[n.id] = (totals[n.id] || 0) + n.quantity
        } else {
          for (const child of n.children) walk(child)
        }
      }
      walk(node)
      return totals
    }

    const roots = markedItems.map((mark: any) => {
      const path = mark.item_id.toString()
      const tree = buildTree(mark.item_id, 1, new Set(), path)
      const totals = accumulateBase(tree)
      const item = itemLookup[mark.item_id]
      return {
        item: { id: mark.item_id, name: item?.name || 'Desconocido', emoji: item?.emoji || null },
        tree,
        totals,
        crafted: !!recipeByProduct[mark.item_id] && (ownedByItem[mark.item_id] || 0) > 0,
      }
    })

    return { roots, ownedByPath, ownedByItem }
  })

  ipcMain.handle('characterMaterials:getByCharacter', (_event, characterId: number) => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM character_materials WHERE character_id = ?').all(characterId)
  })

  ipcMain.handle('characterMaterials:setOwned', (_event, characterId: number, itemId: number, quantityOwned: number, nodePath: string = '') => {
    const db = getDatabase()
    const existing = db.prepare('SELECT id FROM character_materials WHERE character_id = ? AND item_id = ? AND node_path = ?').get(characterId, itemId, nodePath) as any
    if (existing) {
      db.prepare('UPDATE character_materials SET quantity_owned = ? WHERE id = ?').run(quantityOwned, existing.id)
    } else {
      db.prepare('INSERT INTO character_materials (character_id, item_id, quantity_needed, quantity_owned, node_path) VALUES (?, ?, 0, ?, ?)').run(characterId, itemId, quantityOwned, nodePath)
    }
    return { success: true }
  })
}
