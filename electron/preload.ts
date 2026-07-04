import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  user: {
    get: () => ipcRenderer.invoke('user:get'),
    set: (username: string) => ipcRenderer.invoke('user:set', username),
  },
  races: {
    getAll: () => ipcRenderer.invoke('races:getAll'),
    create: (race: any) => ipcRenderer.invoke('races:create', race),
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
  },
})
