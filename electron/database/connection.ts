import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { applyItemReview } from './itemReview'
import { applyTagReview } from './tagReview'

let db: Database.Database | null = null

function csvPath(filename: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'csv', filename)
  }
  return path.join(app.getPath('home'), 'Downloads', filename)
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

const SCHEMA_VERSION = 3

function runMigrations(db: Database.Database): void {
  const hasMigrationTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='data_migration'").get()
  if (hasMigrationTable) {
    const currentVersion = db.prepare('SELECT name FROM data_migration WHERE name = ?').get(`schema_v${SCHEMA_VERSION}`) as any
    if (currentVersion) return
  }

  db.pragma('foreign_keys = OFF')

  // Drop old tables if schema changed
  db.exec(`
    DROP TABLE IF EXISTS character_materials;
    DROP TABLE IF EXISTS character_items;
    DROP TABLE IF EXISTS character_equipment;
    DROP TABLE IF EXISTS recipe_ingredients;
    DROP TABLE IF EXISTS recipes;
    DROP TABLE IF EXISTS item_tags;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS race_restrictions;
    DROP TABLE IF EXISTS race_bonuses;
    DROP TABLE IF EXISTS races;
    DROP TABLE IF EXISTS zones;
    DROP TABLE IF EXISTS characters;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS data_migration;
  `)

  db.exec(`
    CREATE TABLE data_migration (
      name TEXT PRIMARY KEY,
      time_completed INTEGER
    );

    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL
    );

    CREATE TABLE zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE races (
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

    CREATE TABLE race_bonuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id INTEGER NOT NULL REFERENCES races(id),
      condition_type TEXT NOT NULL,
      condition_value TEXT NOT NULL,
      stat_name TEXT NOT NULL,
      bonus_expression TEXT NOT NULL
    );

    CREATE TABLE race_restrictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id INTEGER NOT NULL REFERENCES races(id),
      restricted_stat TEXT NOT NULL,
      max_value INTEGER NOT NULL DEFAULT 0,
      message TEXT
    );

    CREATE TABLE items (
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

    CREATE TABLE tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE item_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id),
      UNIQUE(item_id, tag_id)
    );

    CREATE TABLE recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      method TEXT DEFAULT 'crafting',
      time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE characters (
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
      active_zone TEXT,
      active_blood TEXT,
      wings_open INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE character_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      equipped INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(character_id, item_id)
    );

    CREATE TABLE character_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id),
      quantity_needed INTEGER DEFAULT 0,
      quantity_owned INTEGER DEFAULT 0
    );

    INSERT INTO data_migration (name, time_completed) VALUES ('schema_v${SCHEMA_VERSION}', strftime('%s','now') * 1000);
  `)

  db.pragma('foreign_keys = ON')
}

function seedZonesAndRaces(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) as count FROM races').get() as { count: number }
  if (existing.count > 0) return

  const insertRace = db.prepare('INSERT INTO races (name, vida, ataque, ataque_magico, defensa, mana, estamina, agilidad, robo, sigilo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertBonus = db.prepare('INSERT INTO race_bonuses (race_id, condition_type, condition_value, stat_name, bonus_expression) VALUES (?, ?, ?, ?, ?)')
  const insertRestriction = db.prepare('INSERT INTO race_restrictions (race_id, restricted_stat, max_value, message) VALUES (?, ?, ?, ?)')
  const insertZone = db.prepare('INSERT OR IGNORE INTO zones (name) VALUES (?)')

  for (const z of ['Bosque', 'Montañas', 'Paraíso', 'Agua', 'Noche', 'Mazmorra']) insertZone.run(z)

  const raceData: Record<string, any> = {
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
      restrictions: [{ stat: 'estamina', max: 0, msg: 'Las bestias espectrales no pueden tener estamina' }]
    },
    AngelCaido: { vida: '41', ataque: '1d13', ataque_magico: '1d13', defensa: '1d5', mana: '4', estamina: '4', agilidad: '1d11', robo: '1d10', sigilo: '1d10' },
    Varu: { vida: '40', ataque: '1d13', ataque_magico: '1d13', defensa: '1d5', mana: '6', estamina: '5', agilidad: '1d12', robo: '1d10', sigilo: '1d10',
      bonuses: [{ type: 'zone', value: 'Agua', stat: 'agilidad', expr: '1d15' }]
    },
  }

  const evolutions: Record<string, any> = {
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
    for (const [name, data] of Object.entries(raceData)) {
      const result = insertRace.run(name, data.vida, data.ataque, data.ataque_magico, data.defensa, data.mana, data.estamina, data.agilidad, data.robo, data.sigilo)
      raceIds[name] = result.lastInsertRowid as number
    }
    for (const [name, data] of Object.entries(evolutions)) {
      const result = db.prepare('INSERT INTO races (name, parent_race_id, vida, ataque, ataque_magico, defensa, mana, estamina, agilidad, robo, sigilo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        name, raceIds['Goblins'], data.vida, data.ataque, data.ataque_magico, data.defensa, data.mana, data.estamina, data.agilidad, data.robo, data.sigilo
      )
      raceIds[name] = result.lastInsertRowid as number
    }
    for (const [name, data] of Object.entries(raceData)) {
      if (data.bonuses) for (const b of data.bonuses) insertBonus.run(raceIds[name], b.type, b.value, b.stat, b.expr)
      if (data.restrictions) for (const r of data.restrictions) insertRestriction.run(raceIds[name], r.stat, r.max, r.msg)
    }
    for (const [name, data] of Object.entries(evolutions)) {
      if (data.restrictions) for (const r of data.restrictions) insertRestriction.run(raceIds[name], r.stat, r.max, r.msg)
    }
  })
  tx()
}

function seedItemsAndRecipes(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number }
  if (count.count > 0) return

  const fs = require('fs')
  const Papa = require('papaparse')

  const itemsPath = csvPath('items.csv')
  const recipesPath = csvPath('recipes.csv')

  if (!fs.existsSync(itemsPath) || !fs.existsSync(recipesPath)) {
    console.log('CSV files not found, skipping seed')
    return
  }

  const itemsData = Papa.parse(fs.readFileSync(itemsPath, 'utf-8'), { header: true, skipEmptyLines: true }).data
  const recipesData = Papa.parse(fs.readFileSync(recipesPath, 'utf-8'), { header: true, skipEmptyLines: true }).data

  const insertItem = db.prepare('INSERT OR IGNORE INTO items (type, name, description, use_text, image, emoji, template, tags, attributes, required_race, required_class, required_gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertRecipe = db.prepare('INSERT OR IGNORE INTO recipes (product_item_id, method, time) VALUES (?, ?, ?)')
  const insertIngredient = db.prepare('INSERT INTO recipe_ingredients (recipe_id, item_id, quantity) VALUES (?, ?, ?)')
  const getItemId = db.prepare('SELECT id FROM items WHERE name = ?')

  const tx = db.transaction(() => {
    for (const row of itemsData) {
      insertItem.run(row.type || null, row.name, row.description || null, row.use || null, row.image || null, row.emoji || null, row.template || null, row.tags || null, row.attributes || null, row.required_race || null, row.required_class || null, row.required_gender || null)
    }
    for (const row of recipesData) {
      if (!row.product) continue
      const m = row.product.match(/^(.+?)x(\d+)$/)
      if (!m) continue
      const product = getItemId.get(m[1].trim()) as { id: number } | undefined
      if (!product) continue
      const result = insertRecipe.run(product.id, row.method || 'crafting', row.time || null)
      const recipeId = result.lastInsertRowid as number
      if (row.ingredients) {
        for (const part of row.ingredients.split(',')) {
          const im = part.trim().match(/^(.+?)x(\d+)$/)
          if (im) {
            const item = getItemId.get(im[1].trim()) as { id: number } | undefined
            if (item) insertIngredient.run(recipeId, item.id, parseInt(im[2]))
          }
        }
      }
    }
  })
  tx()
  console.log(`Seeded ${itemsData.length} items and ${recipesData.length} recipes`)
}

function recipeIngredientFix(db: Database.Database): void {
  const hasFix = db.prepare("SELECT name FROM data_migration WHERE name = 'recipe_ingredient_fix_v2'").get()
  if (hasFix) return

  const fs = require('fs')
  const Papa = require('papaparse')

  const itemsPath = csvPath('items.csv')
  const recipesPath = csvPath('recipes.csv')

  if (!fs.existsSync(itemsPath) || !fs.existsSync(recipesPath)) {
    console.log('CSV files not found, cannot fix recipes')
    return
  }

  const itemsData = Papa.parse(fs.readFileSync(itemsPath, 'utf-8'), { header: true, skipEmptyLines: true }).data
  const recipesData = Papa.parse(fs.readFileSync(recipesPath, 'utf-8'), { header: true, skipEmptyLines: true }).data

  const insertItem = db.prepare('INSERT OR IGNORE INTO items (type, name, description, use_text, image, emoji, template, tags, attributes, required_race, required_class, required_gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertRecipe = db.prepare('INSERT INTO recipes (product_item_id, method, time) VALUES (?, ?, ?)')
  const insertIngredient = db.prepare('INSERT INTO recipe_ingredients (recipe_id, item_id, quantity) VALUES (?, ?, ?)')
  const getItemId = db.prepare('SELECT id FROM items WHERE name = ?')

  const tx = db.transaction(() => {
    // Re-insert any missing items referenced by recipes
    for (const row of recipesData) {
      if (row.ingredients) {
        for (const part of row.ingredients.split(',')) {
          const im = part.trim().match(/^(.+?)x(\d+)$/)
          if (im) {
            const name = im[1].trim()
            if (!getItemId.get(name)) {
              const csvItem = itemsData.find((r: any) => r.name && r.name.trim() === name)
              if (csvItem) {
                insertItem.run(csvItem.type || null, csvItem.name, csvItem.description || null, csvItem.use || null, csvItem.image || null, csvItem.emoji || null, csvItem.template || null, csvItem.tags || null, csvItem.attributes || null, csvItem.required_race || null, csvItem.required_class || null, csvItem.required_gender || null)
                console.log('Restored missing item:', name)
              }
            }
          }
        }
      }
      if (row.product) {
        const m = row.product.match(/^(.+?)x(\d+)$/)
        if (m) {
          const name = m[1].trim()
          if (!getItemId.get(name)) {
            const csvItem = itemsData.find((r: any) => r.name && r.name.trim() === name)
            if (csvItem) {
              insertItem.run(csvItem.type || null, csvItem.name, csvItem.description || null, csvItem.use || null, csvItem.image || null, csvItem.emoji || null, csvItem.template || null, csvItem.tags || null, csvItem.attributes || null, csvItem.required_race || null, csvItem.required_class || null, csvItem.required_gender || null)
              console.log('Restored missing item:', name)
            }
          }
        }
      }
    }

    // Delete all recipes and re-seed from CSV
    db.exec('DELETE FROM recipes')
    let inserted = 0
    for (const row of recipesData) {
      if (!row.product) continue
      const m = row.product.match(/^(.+?)x(\d+)$/)
      if (!m) continue
      const product = getItemId.get(m[1].trim()) as { id: number } | undefined
      if (!product) continue
      const result = insertRecipe.run(product.id, row.method || 'crafting', row.time || null)
      const recipeId = result.lastInsertRowid as number
      if (row.ingredients) {
        for (const part of row.ingredients.split(',')) {
          const im = part.trim().match(/^(.+?)x(\d+)$/)
          if (im) {
            const item = getItemId.get(im[1].trim()) as { id: number } | undefined
            if (item) insertIngredient.run(recipeId, item.id, parseInt(im[2]))
          }
        }
      }
      inserted++
    }

    db.prepare("DELETE FROM data_migration WHERE name = 'recipe_ingredient_fix_v1'").run()
    db.prepare("INSERT INTO data_migration (name, time_completed) VALUES ('recipe_ingredient_fix_v2', strftime('%s','now') * 1000)").run()
    console.log(`Recipe fix applied: ${inserted} recipes re-seeded from CSV`)
  })
  tx()
}

function forceUpdateKnownItems(db: Database.Database): void {
  const hardcoded: Record<string, string> = {
    'Azote de Mundos: Version Cetro': 'ataque_magico+1d10',
    'casco valkiria': 'armadura+8, nulimagia+8, defensa+1',
    'botas protectoras': 'armadura+8, nulimagia+6, mana-3, estamina-1, ataque+2',
    'Azote de Mundos': 'ataque+2d10',
    'anillo de la valkiria': 'estamina+1, mana+2',
    'Excalibur': 'ataque+2d9+3',
  }
  const stmt = db.prepare("UPDATE items SET attributes = ? WHERE name = ?")
  let count = 0
  for (const [name, attrs] of Object.entries(hardcoded)) {
    const result = stmt.run(attrs, name)
    if (result.changes > 0) count++
  }
  if (count > 0) console.log(`  force-updated ${count} known items`)
}

export function extractAttributesFromDescriptions(db: Database.Database, force = false): void {
  if (!force) {
    const hasFix = db.prepare("SELECT name FROM data_migration WHERE name = 'attribute_fix_v4'").get()
    if (hasFix) return
  }

  const updateItem = db.prepare('UPDATE items SET attributes = ? WHERE id = ?')
  const clearItem = db.prepare("UPDATE items SET attributes = NULL WHERE id = ? AND (attributes = '{}' OR attributes IS NULL)")

  const statKeyMap: Record<string, string> = {
    'daño': 'ataque',
    'dano': 'ataque',
    'ataque': 'ataque',
    'defensa': 'defensa',
    'armadura': 'armadura',
    'nulimagia': 'nulimagia',
    'nullimagia': 'nulimagia',
    'mana': 'mana',
    'maná': 'mana',
    'vida': 'vida',
    'estamina': 'estamina',
    'stamina': 'estamina',
    'sigilo': 'sigilo',
    'agilidad': 'agilidad',
    'robo': 'robo',
  }

  let updated = 0
  let cleared = 0

  const statPattern = /\*\*(Ataque|Da[nñ]o|Defensa|Armadura|Nul[li]?magia|Man[áa]|Vida|Estamina|Stamina|Sigilo|Agilidad|Robo):\*\*\s*([^\n*]+)/gi
  const efectoPatterns: [RegExp, string][] = [
    [/aumenta (?:el|la|tu) (?:da[nñ]o base m[aá]gico|da[nñ]o m[aá]gico base) en (\d+)/i, 'ataque_magico'],
    [/aumenta en (\d+) la base de da[nñ]o m[aá]gico/i, 'ataque_magico'],
    [/aumenta (?:el|la|tu) ataque base en (\d+)/i, 'ataque'],
    [/aumenta (?:el|la|tu) (?:dado de defensa base|defensa base|def base) en (\d+)/i, 'defensa'],
    [/aumenta (?:el|la|tu) (?:dado de ataque base|ataque base) en (\d+)/i, 'ataque'],
  ]

  const tx = db.transaction(() => {
    // Re-extract for ALL items (not just {} ones), so cetros and other items
    // that already had attributes from v1/v2/v3 get re-evaluated
    const items = db.prepare("SELECT id, name, description, attributes FROM items").all() as { id: number; name: string; description: string | null; attributes: string | null }[]

    for (const item of items) {
      try {
        if (!item.description) {
          if (item.attributes === '{}' || item.attributes === null) {
            clearItem.run(item.id)
            cleared++
          }
          continue
        }

        const found: string[] = []

        const useMagicalAttack = /cetro/i.test(item.name) ||
          /Utiliza la base de ataque m[aá]gico|Puedes usar tu base de da[nñ]o m[aá]gica/i.test(item.description)

        const pattern = new RegExp(statPattern.source, 'gi')
        let match: RegExpExecArray | null

        while ((match = pattern.exec(item.description)) !== null) {
          const key = match[1].toLowerCase()
          const valueStr = match[2].trim()
          let mappedKey = statKeyMap[key]
          if (!mappedKey) continue

          if (useMagicalAttack && (key === 'daño' || key === 'dano')) {
            mappedKey = 'ataque_magico'
          }

          const fixed = valueStr.replace(/- /g, '-')
          const tokens = fixed.split(/\s+/).filter(Boolean)
          const validTokens: string[] = []
          for (const token of tokens) {
            const cleanToken = token.replace(/^\+/, '')
            if (/^-?\d*d\d+$/.test(cleanToken) || /^-?\d+$/.test(cleanToken)) {
              validTokens.push(cleanToken)
            }
          }

          for (const token of validTokens) {
            found.push(token.startsWith('-') ? `${mappedKey}${token}` : `${mappedKey}+${token}`)
          }
        }

        for (const [reg, stat] of efectoPatterns) {
          const m = item.description.match(reg)
          if (m && !found.some(f => f.startsWith(stat))) {
            found.push(`${stat}+${m[1]}`)
          }
        }

        const newAttrs = found.length > 0 ? found.join(', ') : null
        if (newAttrs !== item.attributes) {
          if (newAttrs) {
            updateItem.run(newAttrs, item.id)
            updated++
          } else if (item.attributes === '{}' || item.attributes === null) {
            clearItem.run(item.id)
            cleared++
          }
        }
      } catch (err: any) {
        console.warn(`Attribute extraction failed for item #${item.id} ("${item.name}"): ${err.message}`)
      }
    }

    db.prepare("DELETE FROM data_migration WHERE name IN ('attribute_fix_v1', 'attribute_fix_v2', 'attribute_fix_v3')").run()
    db.prepare("INSERT INTO data_migration (name, time_completed) VALUES ('attribute_fix_v4', strftime('%s','now') * 1000)").run()
  })

  tx()
  console.log(`Attribute fix v4: ${updated} items updated, ${cleared} items cleared`)
}

function applyLevelSystem(db: Database.Database): void {
  const hasMigration = db.prepare("SELECT name FROM data_migration WHERE name = 'level_system_v1'").get()
  if (hasMigration) return

  try {
    db.exec(`ALTER TABLE characters ADD COLUMN perk_10 TEXT`)
    db.exec(`ALTER TABLE characters ADD COLUMN perk_20 TEXT`)
    db.prepare("INSERT INTO data_migration (name, time_completed) VALUES ('level_system_v1', strftime('%s','now') * 1000)").run()
    console.log('Level system migration: added perk_10, perk_20 columns')
  } catch (err: any) {
    console.warn('Level system migration skipped or already applied:', err.message)
  }
}

function applyMaterialNodePath(db: Database.Database): void {
  const hasMigration = db.prepare("SELECT name FROM data_migration WHERE name = 'material_node_path_v1'").get()
  if (hasMigration) return

  try {
    db.exec(`ALTER TABLE character_materials ADD COLUMN node_path TEXT DEFAULT ''`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_cm_path ON character_materials(character_id, item_id, node_path)`)
    db.prepare("INSERT INTO data_migration (name, time_completed) VALUES ('material_node_path_v1', strftime('%s','now') * 1000)").run()
    console.log('Material node_path migration: added node_path column + index')
  } catch (err: any) {
    console.warn('Material node_path migration skipped or already applied:', err.message)
  }
}

function cleanCSVTags(db: Database.Database): void {
  const hasMigration = db.prepare("SELECT name FROM data_migration WHERE name = 'clean_csv_tags_v1'").get()
  if (hasMigration) return

  const validTagNames = [
    'cabeza','torso','brazos','piernas','anillo de stats','anillo de utilidad',
    'cuello','extra','arma a 1 mano','arma a 2 manos','arma ligera',
    'escudo a 1 mano','escudo a 2 manos','set completo','pociones',
  ]

  const tx = db.transaction(() => {
    const allTags = db.prepare('SELECT id, name FROM tags').all() as { id: number; name: string }[]
    let deletedItems = 0
    let deletedTags = 0
    for (const tag of allTags) {
      if (!validTagNames.includes(tag.name.toLowerCase())) {
        const result = db.prepare('DELETE FROM item_tags WHERE tag_id = ?').run(tag.id)
        if (result.changes > 0) deletedItems += result.changes
        db.prepare('DELETE FROM tags WHERE id = ?').run(tag.id)
        deletedTags++
      }
    }
    db.prepare("INSERT INTO data_migration (name, time_completed) VALUES ('clean_csv_tags_v1', strftime('%s','now') * 1000)").run()
    console.log(`Cleaned CSV tags: ${deletedItems} item_tags removed, ${deletedTags} tags deleted`)
  })
  tx()
}

function seedBundledTags(db: Database.Database): void {
  const hasMigration = db.prepare("SELECT name FROM data_migration WHERE name = 'seed_bundled_tags_v1'").get()
  if (hasMigration) return

  const fs = require('fs')
  const seedPath = app.isPackaged
    ? path.join(process.resourcesPath, 'item_tags_seed.json')
    : path.join(__dirname, '..', '..', 'resources', 'item_tags_seed.json')

  if (!fs.existsSync(seedPath)) {
    console.log('item_tags_seed.json not found, skipping bundled tag seed')
    return
  }

  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as { name: string; tags: string[] }[]

  const tx = db.transaction(() => {
    db.exec('DELETE FROM item_tags')
    db.exec('DELETE FROM tags')

    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
    const getTag = db.prepare('SELECT id FROM tags WHERE name = ?')
    const findItem = db.prepare('SELECT id FROM items WHERE name = ?')
    const insertItemTag = db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)')

    let tagged = 0
    for (const entry of seedData) {
      const itemRow = findItem.get(entry.name) as { id: number } | undefined
      if (!itemRow) continue
      for (const tagName of entry.tags) {
        insertTag.run(tagName)
        const tagRow = getTag.get(tagName) as { id: number } | undefined
        if (tagRow) {
          insertItemTag.run(itemRow.id, tagRow.id)
          tagged++
        }
      }
    }

    db.exec("DELETE FROM data_migration WHERE name = 'tag_review_v1'")
    db.exec("DELETE FROM data_migration WHERE name = 'tag_review_v2'")
    db.exec("DELETE FROM data_migration WHERE name = 'clean_csv_tags_v1'")
    db.exec("DELETE FROM data_migration WHERE name = 'import_tags_from_csv_v1'")
    db.prepare("INSERT INTO data_migration (name, time_completed) VALUES ('seed_bundled_tags_v1', strftime('%s','now') * 1000)").run()
    console.log(`Bundled tags seeded: ${tagged} item_tags for ${seedData.length} items`)
  })
  tx()
}

function seedBundledAttributes(db: Database.Database): void {
  const hasMigration = db.prepare("SELECT name FROM data_migration WHERE name = 'seed_bundled_attributes_v3'").get()
  if (hasMigration) return

  const fs = require('fs')
  const seedPath = app.isPackaged
    ? path.join(process.resourcesPath, 'item_attributes_seed.json')
    : path.join(__dirname, '..', '..', 'resources', 'item_attributes_seed.json')

  if (!fs.existsSync(seedPath)) {
    console.log('item_attributes_seed.json not found, skipping bundled attribute seed')
    return
  }

  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as { name: string; attributes: string | null }[]

  const tx = db.transaction(() => {
    const findItem = db.prepare('SELECT id FROM items WHERE name = ?')
    const updateItem = db.prepare('UPDATE items SET attributes = ? WHERE id = ?')

    let updated = 0
    for (const entry of seedData) {
      if (!entry.attributes) continue
      const row = findItem.get(entry.name) as { id: number } | undefined
      if (!row) continue
      const result = updateItem.run(entry.attributes, row.id)
      if (result.changes > 0) updated++
    }

    db.exec("UPDATE items SET attributes = NULL WHERE attributes = '{}'")

    db.exec("DELETE FROM data_migration WHERE name = 'seed_bundled_attributes_v1'")
    db.exec("DELETE FROM data_migration WHERE name = 'seed_bundled_attributes_v2'")
    db.exec("DELETE FROM data_migration WHERE name = 'item_review_v1'")

    db.prepare("INSERT INTO data_migration (name, time_completed) VALUES ('seed_bundled_attributes_v3', strftime('%s','now') * 1000)").run()
    console.log(`Bundled attributes seeded: ${updated} items updated from snapshot`)
  })
  tx()
}

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'axyam.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  seedZonesAndRaces(db)
  seedItemsAndRecipes(db)
  applyItemReview(db)
  cleanCSVTags(db)
  recipeIngredientFix(db)
  seedBundledTags(db)
  extractAttributesFromDescriptions(db)
  seedBundledAttributes(db)
  forceUpdateKnownItems(db)
  applyLevelSystem(db)
  applyMaterialNodePath(db)
}
