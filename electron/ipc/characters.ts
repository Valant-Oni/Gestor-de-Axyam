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
    return db.prepare(`
      SELECT ri.item_id as id, i.name, i.emoji, SUM(ri.quantity) as total_needed
      FROM character_items ci
      JOIN recipes r ON r.product_item_id = ci.item_id
      JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      JOIN items i ON i.id = ri.item_id
      WHERE ci.character_id = ?
      GROUP BY ri.item_id
      ORDER BY i.name
    `).all(characterId)
  })

  ipcMain.handle('characterMaterials:getByCharacter', (_event, characterId: number) => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM character_materials WHERE character_id = ?').all(characterId)
  })

  ipcMain.handle('characterMaterials:setOwned', (_event, characterId: number, itemId: number, quantityOwned: number) => {
    const db = getDatabase()
    const existing = db.prepare('SELECT id FROM character_materials WHERE character_id = ? AND item_id = ?').get(characterId, itemId) as any
    if (existing) {
      db.prepare('UPDATE character_materials SET quantity_owned = ? WHERE id = ?').run(quantityOwned, existing.id)
    } else {
      db.prepare('INSERT INTO character_materials (character_id, item_id, quantity_needed, quantity_owned) VALUES (?, ?, 0, ?)').run(characterId, itemId, quantityOwned)
    }
    return { success: true }
  })
}
