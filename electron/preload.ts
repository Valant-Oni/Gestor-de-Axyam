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
  items: {
    getAll: () => ipcRenderer.invoke('items:getAll'),
    getById: (id: number) => ipcRenderer.invoke('items:getById', id),
    seedFromCSV: (rows: any[]) => ipcRenderer.invoke('items:seedFromCSV', rows),
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
  },
  dice: {
    roll: (expr: string) => ipcRenderer.invoke('dice:roll', expr),
    rollStat: (expr: string, bonuses: any[], conditions: Record<string, string>) => ipcRenderer.invoke('dice:rollStat', expr, bonuses, conditions),
  },
})
