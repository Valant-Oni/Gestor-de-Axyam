import { ipcMain } from 'electron'
import { getDatabase } from '../database/connection'

export function registerRaceHandlers() {
  ipcMain.handle('races:getAll', () => {
    const db = getDatabase()
    const races = db.prepare('SELECT * FROM races ORDER BY parent_race_id IS NOT NULL, name').all() as any[]
    const bonuses = db.prepare('SELECT * FROM race_bonuses').all() as any[]
    const restrictions = db.prepare('SELECT * FROM race_restrictions').all() as any[]

    const bonusesByRace: Record<number, any[]> = {}
    for (const b of bonuses) {
      if (!bonusesByRace[b.race_id]) bonusesByRace[b.race_id] = []
      bonusesByRace[b.race_id].push(b)
    }
    const restrictionsByRace: Record<number, any[]> = {}
    for (const r of restrictions) {
      if (!restrictionsByRace[r.race_id]) restrictionsByRace[r.race_id] = []
      restrictionsByRace[r.race_id].push(r)
    }

    return races.map((r: any) => ({
      ...r,
      bonuses: bonusesByRace[r.id] || [],
      restrictions: restrictionsByRace[r.id] || [],
    }))
  })

  ipcMain.handle('races:getById', (_event, id: number) => {
    const db = getDatabase()
    const race = db.prepare('SELECT * FROM races WHERE id = ?').get(id) as any
    if (race) {
      race.bonuses = db.prepare('SELECT * FROM race_bonuses WHERE race_id = ?').all(id)
      race.restrictions = db.prepare('SELECT * FROM race_restrictions WHERE race_id = ?').all(id)
    }
    return race
  })

  ipcMain.handle('races:getEvolutions', (_event, parentId: number) => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM races WHERE parent_race_id = ? ORDER BY name').all(parentId)
  })

  ipcMain.handle('zones:getAll', () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM zones ORDER BY name').all()
  })
}
