import { ipcMain } from 'electron'
import { getDatabase } from '../database/connection'

export function registerItemHandlers() {
  ipcMain.handle('items:getAll', () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM items ORDER BY name').all()
  })

  ipcMain.handle('items:getById', (_event, id: number) => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM items WHERE id = ?').get(id)
  })

  ipcMain.handle('items:seedFromCSV', async (_event, rows: any[]) => {
    const db = getDatabase()
    const insert = db.prepare(`INSERT OR IGNORE INTO items (type, name, description, use_text, image, emoji, template, tags, attributes, required_race, required_class, required_gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    const tx = db.transaction((items: any[]) => {
      for (const item of items) {
        insert.run(item.type, item.name, item.description, item.use, item.image, item.emoji, item.template, item.tags, item.attributes, item.required_race || null, item.required_class || null, item.required_gender || null)
      }
    })
    tx(rows)
    return { count: rows.length }
  })
}
