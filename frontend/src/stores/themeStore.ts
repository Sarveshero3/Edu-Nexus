import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type AccentColor = 'cyan' | 'purple' | 'coral' | 'teal'

const accentMap: Record<AccentColor, string> = {
  cyan: '#5BC8F5',
  purple: '#A78BFA',
  coral: '#FF6B6B',
  teal: '#2DD4BF',
}

interface ThemeState {
  theme: Theme
  accentColor: AccentColor
  setTheme: (theme: Theme) => void
  setAccent: (color: AccentColor) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: 'cyan',

      setTheme: (theme: Theme) => {
        set({ theme })
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        if (theme === 'system') {
          const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.classList.add(sys)
        } else {
          root.classList.add(theme)
        }
      },

      setAccent: (color: AccentColor) => {
        set({ accentColor: color })
        document.documentElement.style.setProperty('--accent-primary', accentMap[color])
      },
    }),
    { name: 'edu-nexus-theme' }
  )
)
