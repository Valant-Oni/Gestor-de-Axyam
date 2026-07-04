import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggle: () => void
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('axyam-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme()
  document.documentElement.classList.toggle('dark', initial === 'dark')
  document.documentElement.classList.toggle('light', initial === 'light')
  return {
    theme: initial,
    toggle: () => set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('axyam-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      document.documentElement.classList.toggle('light', next === 'light')
      return { theme: next }
    }),
  }
})
