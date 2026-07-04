import { ipcMain } from 'electron'
import { getDatabase } from '../database/connection'

export function registerTagHandlers() {
  ipcMain.handle('tags:getAll', () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM tags ORDER BY name').all()
  })

  ipcMain.handle('tags:create', (_event, name: string) => {
    const db = getDatabase()
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name)
    return { id: result.lastInsertRowid, name }
  })

  ipcMain.handle('tags:delete', (_event, id: number) => {
    const db = getDatabase()
    db.prepare('DELETE FROM item_tags WHERE tag_id = ?').run(id)
    db.prepare('DELETE FROM tags WHERE id = ?').run(id)
  })

  ipcMain.handle('tags:setItemTags', (_event, itemId: number, tagIds: number[]) => {
    const db = getDatabase()
    db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(itemId)
    const insert = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)')
    for (const tagId of tagIds) insert.run(itemId, tagId)
  })

  ipcMain.handle('tags:getItemTags', (_event, itemId: number) => {
    const db = getDatabase()
    const rows = db.prepare('SELECT tag_id FROM item_tags WHERE item_id = ?').all(itemId) as { tag_id: number }[]
    return rows.map((r) => r.tag_id)
  })
}
