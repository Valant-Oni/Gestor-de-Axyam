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

export interface Tag {
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
  item_tags?: string[]
  marked?: boolean
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
  perk_10: string | null
  perk_20: string | null
  description: string | null
  notes: string | null
  active_zone: string | null
  active_blood: string | null
  wings_open: number
  created_at: string
  race_name?: string
}

export interface NeededMaterial {
  id: number
  name: string
  emoji: string | null
  total_needed: number
}

export interface CharacterMaterial {
  id: number
  character_id: number
  item_id: number
  quantity_needed: number
  quantity_owned: number
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
      tags: {
        getAll: () => Promise<Tag[]>
        create: (name: string) => Promise<Tag>
        delete: (id: number) => Promise<void>
        setItemTags: (itemId: number, tagIds: number[]) => Promise<void>
        getItemTags: (itemId: number) => Promise<number[]>
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
        getItems: (id: number) => Promise<any[]>
        markItem: (charId: number, itemId: number) => Promise<void>
        unmarkItem: (charId: number, itemId: number) => Promise<void>
        setEquipped: (charId: number, itemId: number, equipped: boolean) => Promise<void>
      }
      dice: {
        roll: (expr: string) => Promise<DiceResult>
        rollStat: (expr: string, bonuses: any[], conditions: Record<string, string>) => Promise<DiceResult>
      }
      characterMaterials: {
        getNeeded: (characterId: number) => Promise<NeededMaterial[]>
        getByCharacter: (characterId: number) => Promise<CharacterMaterial[]>
        setOwned: (characterId: number, itemId: number, quantityOwned: number) => Promise<{ success: boolean }>
      }
    }
  }
}
