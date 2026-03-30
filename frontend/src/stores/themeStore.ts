import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type AccentColor = 'cyan' | 'purple' | 'coral' | 'teal'

const accentMap: Record<AccentColor, { primary: string; glow: string }> = {
  cyan: { primary: '#5BC8F5', glow: 'rgba(91,200,245,0.25)' },
  purple: { primary: '#A78BFA', glow: 'rgba(167,139,250,0.25)' },
  coral: { primary: '#FF6B6B', glow: 'rgba(255,107,107,0.25)' },
  teal: { primary: '#2DD4BF', glow: 'rgba(45,212,191,0.25)' },
}

interface ThemeState {
  theme: Theme
  accentColor: AccentColor
  setTheme: (theme: Theme) => void
  setAccent: (color: AccentColor) => void
}

/** Resolve system preference to 'light' | 'dark' */
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

/** Apply theme to the document root — sets data-theme attribute */
export function applyTheme(theme: Theme, accentColor: AccentColor) {
  const resolved = resolveTheme(theme)
  const root = document.documentElement

  // Set the data-theme attribute for CSS token switching
  root.setAttribute('data-theme', resolved)

  // Apply accent color CSS vars
  const accent = accentMap[accentColor]
  root.style.setProperty('--accent-cyan', accent.primary)
  root.style.setProperty('--shadow-glow-cyan', `0 0 24px ${accent.glow}`)
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      accentColor: 'cyan',

      setTheme: (theme: Theme) => {
        set({ theme })
        applyTheme(theme, get().accentColor)
      },

      setAccent: (color: AccentColor) => {
        set({ accentColor: color })
        applyTheme(get().theme, color)
      },
    }),
    { name: 'edu-nexus-theme' }
  )
)
