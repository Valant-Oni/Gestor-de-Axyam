import { create } from 'zustand'

interface UserState {
  username: string | null
  loaded: boolean
  load: () => Promise<void>
  setUsername: (name: string) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  username: null,
  loaded: false,
  load: async () => {
    try {
      const user = await window.electronAPI.user.get()
      set({ username: user?.username ?? null, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  setUsername: async (name: string) => {
    await window.electronAPI.user.set(name)
    set({ username: name })
  },
}))
