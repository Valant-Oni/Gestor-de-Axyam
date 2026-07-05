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

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function showErrorDialog(title: string, message: string): void {
  const safeTitle = escapeHtml(title)
  const safeMessage = escapeHtml(message)

  const win = new BrowserWindow({
    width: 640,
    height: 440,
    resizable: true,
    title: safeTitle,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
    },
  })

  const html = '<!DOCTYPE html>' +
'<html><head><meta charset="utf-8">' +
'<style>' +
'*{margin:0;padding:0;box-sizing:border-box}' +
'body{font-family:system-ui,-apple-system,sans-serif;padding:24px;background:#1e1e2e;color:#cdd6f4}' +
'h2{font-size:16px;font-weight:600;margin-bottom:12px;color:#f38ba8}' +
'textarea{width:100%;height:240px;background:#181825;color:#cdd6f4;border:1px solid #45475a;border-radius:6px;padding:10px;font-family:"Cascadia Code","Fira Code",Consolas,monospace;font-size:13px;resize:vertical;outline:none}' +
'textarea:focus{border-color:#89b4fa}' +
'.buttons{margin-top:14px;display:flex;gap:8px}' +
'button{padding:8px 18px;font-size:13px;border:none;border-radius:6px;cursor:pointer;font-family:inherit}' +
'.btn-copy{background:#89b4fa;color:#1e1e2e;font-weight:500}' +
'.btn-copy:hover{background:#74c7ec}' +
'.btn-close{background:#45475a;color:#cdd6f4}' +
'.btn-close:hover{background:#585b70}' +
'.copied{background:#a6e3a1!important;color:#1e1e2e}' +
'</style></head><body>' +
'<h2>' + safeTitle + '</h2>' +
'<textarea readonly id="errorText" spellcheck="false">' + safeMessage + '</textarea>' +
'<div class="buttons">' +
'<button class="btn-copy" id="copyBtn">Copiar al portapapeles</button>' +
'<button class="btn-close" onclick="window.close()">Cerrar</button>' +
'</div>' +
'<script>' +
'document.getElementById("copyBtn").addEventListener("click",function(){' +
'navigator.clipboard.writeText(document.getElementById("errorText").value).then(function(){' +
'var b=document.getElementById("copyBtn");b.textContent="Copiado!";b.classList.add("copied");' +
'setTimeout(function(){b.textContent="Copiar al portapapeles";b.classList.remove("copied")},2000)' +
'})})' +
'</script></body></html>'

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
}

process.on('uncaughtException', (err) => {
  showErrorDialog('Error fatal', `Error no capturado:\n${err.message}\n\n${err.stack || ''}`)
})

process.on('unhandledRejection', (reason) => {
  showErrorDialog('Error fatal', `Promesa rechazada sin capturar:\n${String(reason)}`)
})

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

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    showErrorDialog('Error al cargar la interfaz', `Código: ${errorCode}\nDescripción: ${errorDescription}`)
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.whenReady().then(() => {
  try {
    initDatabase()
    registerUserHandlers()
    registerRaceHandlers()
    registerItemHandlers()
    registerRecipeHandlers()
    registerCharacterHandlers()
    registerDiceHandlers()
    registerTagHandlers()
    createWindow()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? (err.stack || '') : ''
    showErrorDialog('Error al iniciar', `Error:\n${msg}\n\n${stack}`)
    return
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}).catch((err) => {
  showErrorDialog('Error al iniciar', `Error no capturado:\n${String(err)}`)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
