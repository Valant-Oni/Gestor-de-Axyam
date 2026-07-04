import { ipcMain } from 'electron'
import { getDatabase } from '../database/connection'

export function registerRecipeHandlers() {
  ipcMain.handle('recipes:getAll', () => {
    const db = getDatabase()
    return db.prepare(`
      SELECT r.id, r.method, r.time, r.created_at, i.name as product_name, i.emoji as product_emoji
      FROM recipes r
      JOIN items i ON i.id = r.product_item_id
      ORDER BY i.name
    `).all()
  })

  ipcMain.handle('recipes:getIngredients', (_event, recipeId: number) => {
    const db = getDatabase()
    return db.prepare(`
      SELECT ri.quantity, i.name, i.emoji
      FROM recipe_ingredients ri
      JOIN items i ON i.id = ri.item_id
      WHERE ri.recipe_id = ?
    `).all(recipeId)
  })

  ipcMain.handle('recipes:seedFromCSV', async (_event, rows: any[]) => {
    const db = getDatabase()
    const getItemId = db.prepare('SELECT id FROM items WHERE name = ?')
    const insertRecipe = db.prepare('INSERT INTO recipes (product_item_id, method, time) VALUES (?, ?, ?)')
    const insertIngredient = db.prepare('INSERT INTO recipe_ingredients (recipe_id, item_id, quantity) VALUES (?, ?, ?)')

    const tx = db.transaction((recipes: any[]) => {
      for (const row of recipes) {
        const product = getItemId.get(row.product) as { id: number } | undefined
        if (!product) continue
        const result = insertRecipe.run(product.id, row.method || 'crafting', row.time || null)
        const recipeId = result.lastInsertRowid as number

        const ingredients = row.ingredients.split(',')
        for (const ing of ingredients) {
          const match = ing.trim().match(/^(.+?)x(\d+)$/)
          if (match) {
            const ingName = match[1].trim()
            const qty = parseInt(match[2])
            const item = getItemId.get(ingName) as { id: number } | undefined
            if (item) insertIngredient.run(recipeId, item.id, qty)
          }
        }
      }
    })
    tx(rows)
    return { count: rows.length }
  })
}
