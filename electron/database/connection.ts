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

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS races (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      parent_race_id INTEGER REFERENCES races(id),
      vida TEXT NOT NULL DEFAULT '0',
      ataque TEXT NOT NULL DEFAULT '0',
      ataque_magico TEXT NOT NULL DEFAULT '0',
      defensa TEXT NOT NULL DEFAULT '0',
      mana TEXT NOT NULL DEFAULT '0',
      estamina TEXT NOT NULL DEFAULT '0',
      agilidad TEXT NOT NULL DEFAULT '0',
      robo TEXT NOT NULL DEFAULT '0',
      sigilo TEXT NOT NULL DEFAULT '0',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS race_bonuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id INTEGER NOT NULL REFERENCES races(id),
      condition_type TEXT NOT NULL,
      condition_value TEXT NOT NULL,
      stat_name TEXT NOT NULL,
      bonus_expression TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS race_restrictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id INTEGER NOT NULL REFERENCES races(id),
      restricted_stat TEXT NOT NULL,
      max_value INTEGER NOT NULL DEFAULT 0,
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_item_id INTEGER NOT NULL REFERENCES items(id),
      method TEXT DEFAULT 'crafting',
      time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      equipped BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS character_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity_needed INTEGER DEFAULT 0,
      quantity_owned INTEGER DEFAULT 0
    );
  `)
}

function seedRaces(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) as count FROM races').get() as { count: number }
  if (existing.count > 0) return

  const insertRace = db.prepare('INSERT INTO races (name, vida, ataque, ataque_magico, defensa, mana, estamina, agilidad, robo, sigilo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertBonus = db.prepare('INSERT INTO race_bonuses (race_id, condition_type, condition_value, stat_name, bonus_expression) VALUES (?, ?, ?, ?, ?)')
  const insertRestriction = db.prepare('INSERT INTO race_restrictions (race_id, restricted_stat, max_value, message) VALUES (?, ?, ?, ?)')
  const insertZone = db.prepare('INSERT OR IGNORE INTO zones (name) VALUES (?)')

  const zones = ['Bosque', 'Montañas', 'Paraíso', 'Agua', 'Noche', 'Mazmorra']
  for (const z of zones) insertZone.run(z)

  const races: Record<string, { vida: string; ataque: string; ataque_magico: string; defensa: string; mana: string; estamina: string; agilidad: string; robo: string; sigilo: string; parent?: string; bonuses?: { type: string; value: string; stat: string; expr: string }[]; restrictions?: { stat: string; max: number; msg: string }[] }> = {
    Humanos: { vida: '43', ataque: '1d13', ataque_magico: '1d13', defensa: '1d5', mana: '6', estamina: '4', agilidad: '1d10', robo: '1d10', sigilo: '1d10' },
    Elfos: { vida: '36', ataque: '1d15', ataque_magico: '1d15', defensa: '1d4', mana: '8', estamina: '4', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      bonuses: [{ type: 'zone', value: 'Bosque', stat: 'ataque', expr: '1d17' }, { type: 'zone', value: 'Bosque', stat: 'ataque_magico', expr: '1d17' }, { type: 'zone', value: 'Bosque', stat: 'sigilo', expr: '1d12' }]
    },
    Bestias: { vida: '42', ataque: '1d13', ataque_magico: '0', defensa: '1d6', mana: '0', estamina: '6', agilidad: '1d11', robo: '1d10', sigilo: '1d10',
      bonuses: [{ type: 'zone', value: 'Bosque', stat: 'sigilo', expr: '1d11' }],
      restrictions: [{ stat: 'mana', max: 0, msg: 'Las bestias no pueden tener mana' }]
    },
    Licantropos: { vida: '40', ataque: '1d12', ataque_magico: '1d12', defensa: '1d6', mana: '6', estamina: '6', agilidad: '1d10', robo: '1d10', sigilo: '1d10' },
    Vampiros: { vida: '45', ataque: '1d13', ataque_magico: '1d13', defensa: '1d5', mana: '6', estamina: '4', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      bonuses: [
        { type: 'blood', value: 'vampiro', stat: 'vida', expr: '+7' },
        { type: 'blood', value: 'licantropo', stat: 'ataque', expr: '+3' },
        { type: 'blood', value: 'enana', stat: 'defensa', expr: '+3' },
        { type: 'blood', value: 'bestia', stat: 'estamina', expr: '+2' },
        { type: 'blood', value: 'elfa', stat: 'mana', expr: '+5' },
        { type: 'blood', value: 'goblin', stat: 'agilidad', expr: '+2' },
      ]
    },
    Demonios: { vida: '40', ataque: '1d12', ataque_magico: '1d12', defensa: '1d6', mana: '6', estamina: '4', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      bonuses: [{ type: 'wings', value: 'alas', stat: 'agilidad', expr: '1d11' }]
    },
    Goblins: { vida: '23', ataque: '1d9', ataque_magico: '1d9', defensa: '1d3', mana: '5', estamina: '4', agilidad: '1d10', robo: '1d10+2', sigilo: '1d12' },
    Angel: { vida: '42', ataque: '1d12', ataque_magico: '1d12', defensa: '1d6', mana: '5', estamina: '5', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      bonuses: [
        { type: 'zone', value: 'Paraiso', stat: 'ataque', expr: '1d15' },
        { type: 'zone', value: 'Paraiso', stat: 'ataque_magico', expr: '1d15' },
        { type: 'zone', value: 'Paraiso', stat: 'defensa', expr: '1d9' },
        { type: 'wings', value: 'alas', stat: 'agilidad', expr: '1d11' },
      ]
    },
    Enano: { vida: '48', ataque: '1d12', ataque_magico: '1d7', defensa: '1d7', mana: '1', estamina: '5', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      bonuses: [{ type: 'zone', value: 'Montañas', stat: 'vida', expr: '+10' }]
    },
    Draconido: { vida: '50', ataque: '1d11', ataque_magico: '0', defensa: '1d5', mana: '7', estamina: '5', agilidad: '1d11', robo: '1d10', sigilo: '1d10' },
    BestiaEspectral: { vida: '42', ataque: '0', ataque_magico: '1d10', defensa: '1d5', mana: '12', estamina: '0', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      restrictions: [
        { stat: 'estamina', max: 0, msg: 'Las bestias espectrales no pueden tener estamina' },
        { stat: 'mana_over_12', max: 999, msg: 'Cada 8 de mana sobre 12, ganan 4 de vida' }
      ]
    },
    AngelCaido: { vida: '41', ataque: '1d13', ataque_magico: '1d13', defensa: '1d5', mana: '4', estamina: '4', agilidad: '1d11', robo: '1d10', sigilo: '1d10' },
    Varu: { vida: '40', ataque: '1d13', ataque_magico: '1d13', defensa: '1d5', mana: '6', estamina: '5', agilidad: '1d12', robo: '1d10', sigilo: '1d10',
      bonuses: [{ type: 'zone', value: 'Agua', stat: 'agilidad', expr: '1d15' }]
    },
  }

  const evolutions: Record<string, { vida: string; ataque: string; ataque_magico: string; defensa: string; mana: string; estamina: string; agilidad: string; robo: string; sigilo: string; restrictions?: { stat: string; max: number; msg: string }[] }> = {
    Orco: { vida: '52', ataque: '1d14', ataque_magico: '0', defensa: '1d7', mana: '0', estamina: '6', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      restrictions: [{ stat: 'mana', max: 0, msg: 'Los orcos no pueden tener mana' }]
    },
    Sombra: { vida: '28', ataque: '1d15', ataque_magico: '0', defensa: '1d4', mana: '0', estamina: '5', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      restrictions: [{ stat: 'mana', max: 0, msg: 'Las sombras no pueden tener mana' }]
    },
    Brujo: { vida: '38', ataque: '1d9', ataque_magico: '1d14', defensa: '1d5', mana: '11', estamina: '0', agilidad: '1d10', robo: '1d10', sigilo: '1d10',
      restrictions: [{ stat: 'estamina', max: 0, msg: 'Los brujos no pueden tener estamina' }]
    },
  }

  const tx = db.transaction(() => {
    const raceIds: Record<string, number> = {}
    for (const [name, data] of Object.entries(races)) {
      const result = insertRace.run(name, data.vida, data.ataque, data.ataque_magico, data.defensa, data.mana, data.estamina, data.agilidad, data.robo, data.sigilo)
      raceIds[name] = result.lastInsertRowid as number
    }

    for (const [name, data] of Object.entries(evolutions)) {
      const parentId = raceIds['Goblins']
      const result = db.prepare('INSERT INTO races (name, parent_race_id, vida, ataque, ataque_magico, defensa, mana, estamina, agilidad, robo, sigilo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        name, parentId, data.vida, data.ataque, data.ataque_magico, data.defensa, data.mana, data.estamina, data.agilidad, data.robo, data.sigilo
      )
      raceIds[name] = result.lastInsertRowid as number
    }

    for (const [name, data] of Object.entries(races)) {
      const id = raceIds[name]
      if (data.bonuses) {
        for (const b of data.bonuses) {
          insertBonus.run(id, b.type, b.value, b.stat, b.expr)
        }
      }
      if (data.restrictions) {
        for (const r of data.restrictions) {
          insertRestriction.run(id, r.stat, r.max, r.msg)
        }
      }
    }
    for (const [name, data] of Object.entries(evolutions)) {
      const id = raceIds[name]
      if (data.restrictions) {
        for (const r of data.restrictions) {
          insertRestriction.run(id, r.stat, r.max, r.msg)
        }
      }
    }
  })
  tx()
}

function seedItemsAndRecipes(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number }
  if (count.count > 0) return

  const fs = require('fs')
  const Papa = require('papaparse')
  const downloads = path.join(app.getPath('home'), 'Downloads')

  const itemsPath = path.join(downloads, 'items.csv')
  const recipesPath = path.join(downloads, 'recipes.csv')

  if (!fs.existsSync(itemsPath) || !fs.existsSync(recipesPath)) {
    console.log('CSV files not found in Downloads, skipping seed')
    return
  }

  const itemsCsv = fs.readFileSync(itemsPath, 'utf-8')
  const recipesCsv = fs.readFileSync(recipesPath, 'utf-8')

  const itemsData = Papa.parse(itemsCsv, { header: true, skipEmptyLines: true }).data
  const recipesData = Papa.parse(recipesCsv, { header: true, skipEmptyLines: true }).data

  const insertItem = db.prepare(`INSERT OR IGNORE INTO items (type, name, description, use_text, image, emoji, template, tags, attributes, required_race, required_class, required_gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertRecipe = db.prepare('INSERT OR IGNORE INTO recipes (product_item_id, method, time) VALUES (?, ?, ?)')
  const insertIngredient = db.prepare('INSERT INTO recipe_ingredients (recipe_id, item_id, quantity) VALUES (?, ?, ?)')
  const getItemId = db.prepare('SELECT id FROM items WHERE name = ?')

  const tx = db.transaction(() => {
    for (const row of itemsData) {
      insertItem.run(row.type || null, row.name, row.description || null, row.use || null, row.image || null, row.emoji || null, row.template || null, row.tags || null, row.attributes || null, row.required_race || null, row.required_class || null, row.required_gender || null)
    }

    for (const row of recipesData) {
      if (!row.product) continue
      const productMatch = row.product.match(/^(.+?)x(\d+)$/)
      if (!productMatch) continue
      const productName = productMatch[1].trim()
      const product = getItemId.get(productName) as { id: number } | undefined
      if (!product) continue

      const result = insertRecipe.run(product.id, row.method || 'crafting', row.time || null)
      const recipeId = result.lastInsertRowid as number

      if (row.ingredients) {
        const parts = row.ingredients.split(',')
        for (const part of parts) {
          const match = part.trim().match(/^(.+?)x(\d+)$/)
          if (match) {
            const ingName = match[1].trim()
            const qty = parseInt(match[2])
            const item = getItemId.get(ingName) as { id: number } | undefined
            if (item) insertIngredient.run(recipeId, item.id, qty)
          }
        }
      }
    }
  })
  tx()
  console.log(`Seeded ${itemsData.length} items and ${recipesData.length} recipes`)
}

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'axyam.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  seedRaces(db)
  seedItemsAndRecipes(db)
}
