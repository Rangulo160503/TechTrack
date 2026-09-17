export type ThemeMode = 'dark' | 'light'

declare global {
  interface Window {
    __TT_ACCENT_HUE__?: number
  }
}

/** One accent hue per full page load (refresh). */
let pageAccentHue: number | null = null

function pickRefreshHue(): number {
  // Skip green band so the UI doesn't feel stuck on institutional green.
  const pools = [
    [0, 35],
    [195, 250],
    [265, 320],
    [330, 355],
  ] as const
  const pool = pools[Math.floor(Math.random() * pools.length)]!
  return pool[0] + Math.floor(Math.random() * (pool[1] - pool[0] + 1))
}

export function getPageAccentHue(): number {
  if (pageAccentHue === null) {
    const seeded =
      typeof window !== 'undefined' && typeof window.__TT_ACCENT_HUE__ === 'number'
        ? window.__TT_ACCENT_HUE__
        : pickRefreshHue()
    pageAccentHue = seeded
    if (typeof window !== 'undefined') {
      window.__TT_ACCENT_HUE__ = seeded
    }
  }
  return pageAccentHue
}

/** Paints accent + soft surface tint across the whole app for this page load. */
export function applyPageAccent(theme: ThemeMode, hue = getPageAccentHue()): void {
  const root = document.documentElement
  root.style.setProperty('--tt-accent-hue', String(hue))

  if (theme === 'light') {
    root.style.setProperty('--tt-ink', `hsl(${hue} 18% 96%)`)
    root.style.setProperty('--tt-stage', `hsl(${hue} 30% 100%)`)
    root.style.setProperty('--tt-panel', `hsl(${hue} 40% 100%)`)
    root.style.setProperty('--tt-rail', `hsl(${hue} 22% 99%)`)
    root.style.setProperty('--tt-line', `hsl(${hue} 14% 82%)`)
    root.style.setProperty('--tt-mute', `hsl(${hue} 10% 40%)`)
    root.style.setProperty('--tt-foam', `hsl(${hue} 22% 12%)`)
    root.style.setProperty('--tt-ledger', `hsl(${hue} 20% 93%)`)
    root.style.setProperty('--tt-signal', `hsl(${hue} 72% 36%)`)
    root.style.setProperty('--tt-signal-dim', `hsl(${hue} 74% 28%)`)
  } else {
    root.style.setProperty('--tt-ink', `hsl(${hue} 16% 7%)`)
    root.style.setProperty('--tt-stage', `hsl(${hue} 14% 10%)`)
    root.style.setProperty('--tt-panel', `hsl(${hue} 12% 12%)`)
    root.style.setProperty('--tt-rail', `hsl(${hue} 18% 5%)`)
    root.style.setProperty('--tt-line', `hsl(${hue} 10% 22%)`)
    root.style.setProperty('--tt-mute', `hsl(${hue} 10% 68%)`)
    root.style.setProperty('--tt-foam', `hsl(${hue} 18% 93%)`)
    root.style.setProperty('--tt-ledger', `hsl(${hue} 12% 15%)`)
    root.style.setProperty('--tt-signal', `hsl(${hue} 70% 52%)`)
    root.style.setProperty('--tt-signal-dim', `hsl(${hue} 68% 42%)`)
  }
}
