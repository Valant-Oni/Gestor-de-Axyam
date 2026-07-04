import { ipcMain } from 'electron'
import { getDatabase } from '../database/connection'

export function registerRaceHandlers() {
  ipcMain.handle('races:getAll', () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM races ORDER BY name').all()
  })

  ipcMain.handle('races:create', (_event, race: { name: string; vida: string; ataque: string; ataque_magico: string; defensa: string; mana: string; estamina: string; agilidad: string; robo: string; sigilo: string }) => {
    const db = getDatabase()
    db.prepare(`INSERT INTO races (name, vida, ataque, ataque_magico, defensa, mana, estamina, agilidad, robo, sigilo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      race.name, race.vida, race.ataque, race.ataque_magico, race.defensa, race.mana, race.estamina, race.agilidad, race.robo, race.sigilo
    )
    return race
  })
}
