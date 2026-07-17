import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  user: {
    get: () => ipcRenderer.invoke('user:get'),
    set: (username: string) => ipcRenderer.invoke('user:set', username),
  },
  races: {
    getAll: () => ipcRenderer.invoke('races:getAll'),
    getById: (id: number) => ipcRenderer.invoke('races:getById', id),
    getEvolutions: (parentId: number) => ipcRenderer.invoke('races:getEvolutions', parentId),
  },
  zones: {
    getAll: () => ipcRenderer.invoke('zones:getAll'),
  },
  tags: {
    getAll: () => ipcRenderer.invoke('tags:getAll'),
    create: (name: string) => ipcRenderer.invoke('tags:create', name),
    delete: (id: number) => ipcRenderer.invoke('tags:delete', id),
    setItemTags: (itemId: number, tagIds: number[]) => ipcRenderer.invoke('tags:setItemTags', itemId, tagIds),
    getItemTags: (itemId: number) => ipcRenderer.invoke('tags:getItemTags', itemId),
  },
  items: {
    getAll: () => ipcRenderer.invoke('items:getAll'),
    getById: (id: number) => ipcRenderer.invoke('items:getById', id),
    seedFromCSV: (rows: any[]) => ipcRenderer.invoke('items:seedFromCSV', rows),
    reExtractAttributes: () => ipcRenderer.invoke('items:reExtractAttributes'),
  },
  recipes: {
    getAll: () => ipcRenderer.invoke('recipes:getAll'),
    getIngredients: (id: number) => ipcRenderer.invoke('recipes:getIngredients', id),
    seedFromCSV: (rows: any[]) => ipcRenderer.invoke('recipes:seedFromCSV', rows),
  },
  characters: {
    getAll: () => ipcRenderer.invoke('characters:getAll'),
    getById: (id: number) => ipcRenderer.invoke('characters:getById', id),
    create: (char: any) => ipcRenderer.invoke('characters:create', char),
    update: (id: number, char: any) => ipcRenderer.invoke('characters:update', id, char),
    delete: (id: number) => ipcRenderer.invoke('characters:delete', id),
    getItems: (id: number) => ipcRenderer.invoke('characters:getItems', id),
    markItem: (charId: number, itemId: number) => ipcRenderer.invoke('characters:markItem', charId, itemId),
    unmarkItem: (charId: number, itemId: number) => ipcRenderer.invoke('characters:unmarkItem', charId, itemId),
    setEquipped: (charId: number, itemId: number, equipped: boolean) => ipcRenderer.invoke('characters:setEquipped', charId, itemId, equipped),
  },
  dice: {
    roll: (expr: string) => ipcRenderer.invoke('dice:roll', expr),
    rollStat: (expr: string, bonuses: any[], conditions: Record<string, string>) => ipcRenderer.invoke('dice:rollStat', expr, bonuses, conditions),
  },
  characterMaterials: {
    getNeeded: (characterId: number) => ipcRenderer.invoke('characterMaterials:getNeeded', characterId),
    getByCharacter: (characterId: number) => ipcRenderer.invoke('characterMaterials:getByCharacter', characterId),
    setOwned: (characterId: number, itemId: number, quantityOwned: number) => ipcRenderer.invoke('characterMaterials:setOwned', characterId, itemId, quantityOwned),
  },
})
