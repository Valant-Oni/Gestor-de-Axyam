import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDatabase } from './database/connection'
import { registerUserHandlers } from './ipc/users'
import { registerRaceHandlers } from './ipc/races'
import { registerItemHandlers } from './ipc/items'
import { registerRecipeHandlers } from './ipc/recipes'
import { registerCharacterHandlers } from './ipc/characters'
import { registerDiceHandlers } from './ipc/dice'
import { registerTagHandlers } from './ipc/tags'

process.env.DIST_ELECTRON = path.join(__dirname)
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  registerUserHandlers()
  registerRaceHandlers()
  registerItemHandlers()
  registerRecipeHandlers()
  registerCharacterHandlers()
  registerDiceHandlers()
  registerTagHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
