import { create } from 'zustand'

interface CharOption {
  id: number
  name: string
}

interface CharacterState {
  selectedCharId: number | null
  characters: CharOption[]
  setSelectedCharId: (id: number | null) => void
  setCharacters: (chars: CharOption[]) => void
}

export const useCharacterStore = create<CharacterState>((set) => {
  const stored = localStorage.getItem('axyam-selected-char')
  const initial = stored ? (parseInt(stored) || null) : null
  return {
    selectedCharId: initial,
    characters: [],
    setSelectedCharId: (id: number | null) => {
      if (id !== null) localStorage.setItem('axyam-selected-char', String(id))
      else localStorage.removeItem('axyam-selected-char')
      set({ selectedCharId: id })
    },
    setCharacters: (chars: CharOption[]) => set({ characters: chars }),
  }
})
