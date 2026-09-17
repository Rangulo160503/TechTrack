import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applyPageAccent, getPageAccentHue } from './pageAccent'

export type ThemeMode = 'dark' | 'light'

type ThemeContextValue = {
  theme: ThemeMode
  accentHue: number
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

const STORAGE_KEY = 'techtrack.theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyThemeShell(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0c1210' : '#f3f5f2')
  }
  applyPageAccent(theme)
  // Keep theme-color roughly aligned with the tinted canvas.
  if (meta) {
    meta.setAttribute(
      'content',
      getComputedStyle(document.documentElement).getPropertyValue('--tt-ink').trim() ||
        (theme === 'dark' ? '#0c1210' : '#f3f5f2'),
    )
  }
}

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const accentHue = useMemo(() => getPageAccentHue(), [])
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof document === 'undefined') return 'light'
    const initial = readStoredTheme()
    applyThemeShell(initial)
    return initial
  })

  useEffect(() => {
    applyThemeShell(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, accentHue, toggleTheme, setTheme }),
    [theme, accentHue, toggleTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
