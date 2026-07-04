import { ipcMain } from 'electron'

function rollDice(expr: string): { result: number; rolls: number[]; expr: string } {
  const match = expr.match(/^(\d*)d(\d+)$/i)
  if (!match) return { result: 0, rolls: [], expr }

  const count = match[1] ? parseInt(match[1]) : 1
  const sides = parseInt(match[2])
  const rolls: number[] = []

  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1)
  }

  const result = rolls.reduce((a, b) => a + b, 0)
  return { result, rolls, expr }
}

export function registerDiceHandlers() {
  ipcMain.handle('dice:roll', (_event, expression: string) => {
    return rollDice(expression)
  })
}
