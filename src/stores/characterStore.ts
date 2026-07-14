import { create } from 'zustand'

interface CharacterState {
  selectedCharId: number | null
  setSelectedCharId: (id: number | null) => void
}

export const useCharacterStore = create<CharacterState>((set) => {
  const stored = localStorage.getItem('axyam-selected-char')
  const initial = stored ? (parseInt(stored) || null) : null
  return {
    selectedCharId: initial,
    setSelectedCharId: (id: number | null) => {
      if (id !== null) localStorage.setItem('axyam-selected-char', String(id))
      else localStorage.removeItem('axyam-selected-char')
      set({ selectedCharId: id })
    },
  }
})
