import { NavLink } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeProvider'
import { BrandMark } from '../brand/BrandMark'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/live', label: 'En vivo' },
  { to: '/assets', label: 'Activos' },
  { to: '/maintenance', label: 'Mantenimiento' },
  { to: '/catalogs', label: 'Catálogos' },
  { to: '/reports', label: 'Reportes' },
]

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[15.5rem] flex-col border-r border-line bg-rail text-foam md:flex">
      <div className="flex h-[4.25rem] items-center gap-3 border-b border-line px-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="font-display text-[1.05rem] font-bold tracking-[-0.03em]">TechTrack</p>
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-mute">
            CTP Santa Eulalia
          </p>
        </div>
      </div>

      <nav className="mt-3 flex flex-1 flex-col gap-0.5 px-3">
        <p className="bank-section-title px-2 pb-2 pt-2">Menú</p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              [
                'border-l-2 px-3 py-2.5 text-[0.875rem] font-medium transition-colors',
                isActive
                  ? 'border-signal bg-ledger text-foam'
                  : 'border-transparent text-mute hover:bg-ledger/70 hover:text-foam',
              ].join(' ')
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-line p-4">
        <button type="button" className="btn-secondary w-full !py-2 text-[0.7rem]" onClick={toggleTheme}>
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <div>
          <p className="bank-section-title">Sesión</p>
          <NavLink to="/profile" className="mt-1 block text-sm font-medium text-foam hover:text-signal">
            Cuenta y preferencias
          </NavLink>
        </div>
      </div>
    </aside>
  )
}
