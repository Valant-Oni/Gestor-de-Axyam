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

  ipcMain.handle('characters:create', (_event, char: {
    name: string; race_id?: number; gender?: string; description?: string; notes?: string
    base_vida?: number; base_ataque?: number; base_ataque_magico?: number
    base_defensa?: number; base_mana?: number; base_estamina?: number
    base_agilidad?: number; base_robo?: number; base_sigilo?: number
  }) => {
    const db = getDatabase()
    const result = db.prepare(`INSERT INTO characters (name, race_id, gender, description, notes, base_vida, base_ataque, base_ataque_magico, base_defensa, base_mana, base_estamina, base_agilidad, base_robo, base_sigilo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      char.name, char.race_id || null, char.gender || null, char.description || null, char.notes || null,
      char.base_vida || 0, char.base_ataque || 0, char.base_ataque_magico || 0,
      char.base_defensa || 0, char.base_mana || 0, char.base_estamina || 0,
      char.base_agilidad || 0, char.base_robo || 0, char.base_sigilo || 0
    )
    return { id: result.lastInsertRowid, ...char }
  })

  ipcMain.handle('characters:update', (_event, id: number, char: any) => {
    const db = getDatabase()
    db.prepare(`UPDATE characters SET name=?, race_id=?, gender=?, description=?, notes=?, base_vida=?, base_ataque=?, base_ataque_magico=?, base_defensa=?, base_mana=?, base_estamina=?, base_agilidad=?, base_robo=?, base_sigilo=? WHERE id=?`).run(
      char.name, char.race_id || null, char.gender || null, char.description || null, char.notes || null,
      char.base_vida || 0, char.base_ataque || 0, char.base_ataque_magico || 0,
      char.base_defensa || 0, char.base_mana || 0, char.base_estamina || 0,
      char.base_agilidad || 0, char.base_robo || 0, char.base_sigilo || 0, id
    )
    return { id, ...char }
  })

  ipcMain.handle('characters:delete', (_event, id: number) => {
    const db = getDatabase()
    db.prepare('DELETE FROM character_equipment WHERE character_id = ?').run(id)
    db.prepare('DELETE FROM character_materials WHERE character_id = ?').run(id)
    db.prepare('DELETE FROM characters WHERE id = ?').run(id)
    return { success: true }
  })
}
