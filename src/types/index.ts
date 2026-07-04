export interface RaceBonus {
  id: number
  race_id: number
  condition_type: string
  condition_value: string
  stat_name: string
  bonus_expression: string
}

export interface RaceRestriction {
  id: number
  race_id: number
  restricted_stat: string
  max_value: number
  message: string
}

export interface Race {
  id: number
  name: string
  parent_race_id: number | null
  vida: string
  ataque: string
  ataque_magico: string
  defensa: string
  mana: string
  estamina: string
  agilidad: string
  robo: string
  sigilo: string
  created_at: string
  bonuses: RaceBonus[]
  restrictions: RaceRestriction[]
}

export interface Zone {
  id: number
  name: string
}

export interface Item {
  id: number
  type: string
  name: string
  description: string | null
  use_text: string | null
  image: string | null
  emoji: string | null
  template: string | null
  tags: string | null
  attributes: string | null
  required_race: string | null
  required_class: string | null
  required_gender: string | null
  created_at: string
}

export interface Recipe {
  id: number
  method: string
  time: string | null
  created_at: string
  product_name: string
  product_emoji: string | null
}

export interface RecipeIngredient {
  quantity: number
  name: string
  emoji: string | null
}

export interface Character {
  id: number
  name: string
  race_id: number | null
  gender: string | null
  level: number
  base_vida: number
  base_ataque: number
  base_ataque_magico: number
  base_defensa: number
  base_mana: number
  base_estamina: number
  base_agilidad: number
  base_robo: number
  base_sigilo: number
  description: string | null
  notes: string | null
  created_at: string
  race_name?: string
}

export interface DiceResult {
  result: number
  rolls: number[]
  expr: string
  breakdown: string
}

declare global {
  interface Window {
    electronAPI: {
      platform: string
      user: {
        get: () => Promise<{ id: number; username: string } | undefined>
        set: (username: string) => Promise<{ id: number; username: string }>
      }
      races: {
        getAll: () => Promise<Race[]>
        getById: (id: number) => Promise<Race | undefined>
        getEvolutions: (parentId: number) => Promise<Race[]>
      }
      zones: {
        getAll: () => Promise<Zone[]>
      }
      items: {
        getAll: () => Promise<Item[]>
        getById: (id: number) => Promise<Item | undefined>
        seedFromCSV: (rows: any[]) => Promise<{ count: number }>
      }
      recipes: {
        getAll: () => Promise<Recipe[]>
        getIngredients: (id: number) => Promise<RecipeIngredient[]>
        seedFromCSV: (rows: any[]) => Promise<{ count: number }>
      }
      characters: {
        getAll: () => Promise<Character[]>
        getById: (id: number) => Promise<Character | undefined>
        create: (char: any) => Promise<any>
        update: (id: number, char: any) => Promise<any>
        delete: (id: number) => Promise<{ success: boolean }>
      }
      dice: {
        roll: (expr: string) => Promise<DiceResult>
        rollStat: (expr: string, bonuses: any[], conditions: Record<string, string>) => Promise<DiceResult>
      }
    }
  }
}
