import { ipcMain } from 'electron'

export interface DiceResult {
  result: number
  rolls: number[]
  expr: string
  breakdown: string
}

export function parseAndRoll(expr: string): DiceResult {
  expr = expr.trim().toLowerCase()

  // Fixed number (e.g., "12", "0", "43")
  const fixedMatch = expr.match(/^(\d+)$/)
  if (fixedMatch) {
    const val = parseInt(fixedMatch[1])
    return { result: val, rolls: [val], expr, breakdown: `${val}` }
  }

  // Expression like "1d3+2", "1d10+2", "2d6+3"
  const fullMatch = expr.match(/^(\d*)d(\d+)(?:\s*\+\s*(\d+))?$/)
  if (fullMatch) {
    const count = fullMatch[1] ? parseInt(fullMatch[1]) : 1
    const sides = parseInt(fullMatch[2])
    const bonus = fullMatch[3] ? parseInt(fullMatch[3]) : 0
    const rolls: number[] = []

    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1)
    }

    const rollTotal = rolls.reduce((a, b) => a + b, 0)
    const result = rollTotal + bonus

    let breakdown = `[${rolls.join(', ')}]`
    if (bonus > 0) breakdown += ` + ${bonus}`
    breakdown += ` = ${result}`

    return { result, rolls, expr, breakdown }
  }

  return { result: 0, rolls: [], expr, breakdown: '0 (expresión inválida)' }
}

export function getStatValue(expression: string, bonuses: { condition_type: string; condition_value: string; stat_name: string; bonus_expression: string }[], activeConditions: Record<string, string>): DiceResult {
  let activeExpr = expression

  // Apply relevant bonuses
  for (const b of bonuses) {
    let conditionMet = false
    if (b.condition_type === 'zone' && activeConditions.zone === b.condition_value) conditionMet = true
    if (b.condition_type === 'wings' && activeConditions.wings === b.condition_value) conditionMet = true
    if (b.condition_type === 'blood' && activeConditions.blood === b.condition_value) {
      conditionMet = true
      activeExpr = applyBloodBonus(activeExpr, b.bonus_expression)
    }
    if (conditionMet && b.bonus_expression.startsWith('1d')) {
      activeExpr = b.bonus_expression
    }
  }

  return parseAndRoll(activeExpr)
}

function applyBloodBonus(currentExpr: string, bloodBonus: string): string {
  if (bloodBonus.startsWith('+')) {
    const bonus = parseInt(bloodBonus)
    const match = currentExpr.match(/^(\d+)d(\d+)$/)
    if (match) {
      return `${match[1]}d${match[2]}+${bonus}`
    }
    const fixedMatch = currentExpr.match(/^(\d+)$/)
    if (fixedMatch) {
      return `${parseInt(fixedMatch[1]) + bonus}`
    }
  }
  return currentExpr
}

export function registerDiceHandlers() {
  ipcMain.handle('dice:roll', (_event, expression: string) => {
    return parseAndRoll(expression)
  })

  ipcMain.handle('dice:rollStat', (_event, expression: string, bonuses: any[], conditions: Record<string, string>) => {
    return getStatValue(expression, bonuses, conditions)
  })
}
