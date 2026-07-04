import { create } from 'zustand'

interface DiceHistoryItem {
  expr: string
  result: number
  rolls: number[]
  timestamp: number
}

interface DiceState {
  history: DiceHistoryItem[]
  roll: (expr: string) => Promise<void>
}

export const useDiceStore = create<DiceState>((set) => ({
  history: [],
  roll: async (expr: string) => {
    try {
      const res = await window.electronAPI.dice.roll(expr)
      set((state) => ({
        history: [
          { expr: res.expr, result: res.result, rolls: res.rolls, timestamp: Date.now() },
          ...state.history,
        ].slice(0, 50),
      }))
    } catch {
      // silently fail
    }
  },
}))
