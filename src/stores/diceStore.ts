import { create } from 'zustand'

interface DiceHistoryItem {
  expr: string
  result: number
  rolls: number[]
  timestamp: number
}

interface DiceState {
  history: DiceHistoryItem[]
  roll: (expr: string) => Promise<DiceResult>
}

interface DiceResult {
  result: number
  rolls: number[]
  expr: string
}

export const useDiceStore = create<DiceState>((set) => ({
  history: [],
  roll: async (expr: string) => {
    const result = await window.electronAPI.dice.roll(expr)
    set((state) => ({
      history: [{ ...result, timestamp: Date.now() }, ...state.history].slice(0, 50),
    }))
    return result
  },
}))
