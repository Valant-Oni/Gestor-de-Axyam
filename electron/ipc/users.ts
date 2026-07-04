import { ipcMain } from 'electron'
import { getDatabase } from '../database/connection'

export function registerUserHandlers() {
  ipcMain.handle('user:get', () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM users WHERE id = 1').get() as { id: number; username: string } | undefined
  })

  ipcMain.handle('user:set', (_event, username: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM users').run()
    db.prepare('INSERT INTO users (id, username) VALUES (1, ?)').run(username)
    return { id: 1, username }
  })
}
