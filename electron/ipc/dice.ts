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

  // Parse compound dice expressions like "2d5+1d4", "1d7+1d5", "1d10+2"
  // Extract all dice groups, then a trailing flat bonus
  let remaining = expr
  const rolls: number[] = []
  let breakdownParts: string[] = []
  let bonus = 0

  const diceRegex = /(\d*)d(\d+)/g
  let match: RegExpExecArray | null

  while ((match = diceRegex.exec(remaining)) !== null) {
    const count = match[1] ? parseInt(match[1]) : 1
    const sides = parseInt(match[2])
    const groupRolls: number[] = []

    for (let i = 0; i < count; i++) {
      groupRolls.push(Math.floor(Math.random() * sides) + 1)
    }

    rolls.push(...groupRolls)
    breakdownParts.push(`[${groupRolls.join(', ')}]`)

    // Remove this dice group from remaining to find bonus
    remaining = remaining.replace(match[0], '').replace(/^\+/, '')
  }

  // Check for trailing flat bonus after all dice groups
  remaining = remaining.replace(/\s/g, '')
  if (remaining.startsWith('+')) {
    const bonusPart = remaining.substring(1)
    const bonusMatch = bonusPart.match(/^(\d+)$/)
    if (bonusMatch) {
      bonus = parseInt(bonusMatch[1])
    }
  }

  if (rolls.length > 0) {
    const rollTotal = rolls.reduce((a, b) => a + b, 0)
    const result = rollTotal + bonus

    let breakdown = breakdownParts.join(' + ')
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
