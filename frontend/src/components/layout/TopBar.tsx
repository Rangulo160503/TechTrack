import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeProvider'
import { BrandMark } from '../brand/BrandMark'
import { IconMoon, IconSearch, IconSun } from '../brand/Icons'

const titles: Record<string, string> = {
  '/': 'Inicio',
  '/live': 'En vivo',
  '/assets': 'Activos',
  '/maintenance': 'Mantenimiento',
  '/catalogs': 'Catálogos',
  '/reports': 'Reportes',
  '/more': 'Más',
  '/profile': 'Cuenta',
}

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') ?? '')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const basePath = '/' + (location.pathname.split('/')[1] ?? '')
  const title =
    titles[location.pathname] ??
    titles[basePath === '/' ? '/' : basePath] ??
    (location.pathname.startsWith('/assets/') ? 'Detalle de activo' : 'TechTrack')

  useEffect(() => {
    if (location.pathname === '/assets') {
      setQuery(new URLSearchParams(location.search).get('q') ?? '')
    }
  }, [location.pathname, location.search])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/assets?q=${encodeURIComponent(q)}` : '/assets')
    setMobileSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-panel/95 backdrop-blur-sm px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 md:px-8 md:pt-0 md:pb-0">
      <div className="flex h-14 items-center justify-between gap-3 md:h-[4.25rem]">
        <div className="min-w-0 md:hidden">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark size="sm" />
            <span className="truncate font-display text-[0.95rem] font-bold tracking-[-0.02em] text-foam">
              TechTrack
            </span>
          </Link>
        </div>

        <div className="hidden min-w-0 md:block">
          <p className="bank-section-title">Operaciones</p>
          <h1 className="mt-0.5 font-display text-[1.35rem] font-bold tracking-[-0.03em] text-foam">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:max-w-xl md:flex-1 md:justify-end md:gap-3">
          <form onSubmit={onSearch} className="relative hidden w-full max-w-sm sm:block">
            <label className="sr-only" htmlFor="global-search">
              Buscar activos
            </label>
            <IconSearch className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              id="global-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar código, marca o ubicación"
              className="field-search w-full"
            />
          </form>

          <button
            type="button"
            className="grid h-9 w-9 place-items-center border border-line text-foam sm:hidden"
            aria-label="Abrir búsqueda"
            onClick={() => setMobileSearchOpen((v) => !v)}
          >
            <IconSearch />
          </button>

          <button
            type="button"
            className="grid h-9 w-9 place-items-center border border-line text-foam md:h-10 md:w-10"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>

          <Link
            to="/profile"
            className="grid h-9 min-w-9 place-items-center border border-line px-2 text-[0.7rem] font-bold tracking-[0.08em] text-foam md:h-10"
            aria-label="Cuenta"
          >
            JE
          </Link>
        </div>
      </div>

      {mobileSearchOpen ? (
        <form onSubmit={onSearch} className="relative mt-2 sm:hidden">
          <IconSearch className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar activos"
            className="field-search w-full"
          />
        </form>
      ) : null}
    </header>
  )
}
