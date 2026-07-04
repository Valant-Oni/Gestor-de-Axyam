import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'axyam.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  seedRaces(db)
}

function seedRaces(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) as count FROM races').get() as { count: number }
  if (existing.count > 0) return

  db.prepare(`INSERT INTO races (name, vida, ataque, ataque_magico, defensa, mana, estamina, agilidad, robo, sigilo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'Humanos', '43', '1d13', '1d13', '1d5', '6', '4', '1d10', '1d10', '1d10'
  )
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS races (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      vida TEXT NOT NULL DEFAULT '0',
      ataque TEXT NOT NULL DEFAULT '0',
      ataque_magico TEXT NOT NULL DEFAULT '0',
      defensa TEXT NOT NULL DEFAULT '0',
      mana TEXT NOT NULL DEFAULT '0',
      estamina TEXT NOT NULL DEFAULT '0',
      agilidad TEXT NOT NULL DEFAULT '0',
      robo TEXT NOT NULL DEFAULT '0',
      sigilo TEXT NOT NULL DEFAULT '0'
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      type TEXT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      use_text TEXT,
      image TEXT,
      emoji TEXT,
      template TEXT,
      tags TEXT,
      attributes TEXT,
      required_race TEXT,
      required_class TEXT,
      required_gender TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY,
      product_item_id INTEGER NOT NULL REFERENCES items(id),
      method TEXT DEFAULT 'crafting',
      time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      race_id INTEGER REFERENCES races(id),
      gender TEXT,
      level INTEGER DEFAULT 1,
      base_vida INTEGER DEFAULT 0,
      base_ataque INTEGER DEFAULT 0,
      base_ataque_magico INTEGER DEFAULT 0,
      base_defensa INTEGER DEFAULT 0,
      base_mana INTEGER DEFAULT 0,
      base_estamina INTEGER DEFAULT 0,
      base_agilidad INTEGER DEFAULT 0,
      base_robo INTEGER DEFAULT 0,
      base_sigilo INTEGER DEFAULT 0,
      description TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS character_equipment (
      id INTEGER PRIMARY KEY,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      equipped BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS character_materials (
      id INTEGER PRIMARY KEY,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity_needed INTEGER DEFAULT 0,
      quantity_owned INTEGER DEFAULT 0
    );
  `)
}
