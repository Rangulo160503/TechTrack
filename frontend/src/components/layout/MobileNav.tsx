import { NavLink } from 'react-router-dom'

const primaryLinks = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/live', label: 'En vivo' },
  { to: '/assets', label: 'Activos' },
  { to: '/more', label: 'Más' },
]

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-panel md:hidden"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      aria-label="Navegación principal"
    >
      <ul className="grid grid-cols-4">
        {primaryLinks.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'flex min-h-12 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                  isActive ? 'text-signal' : 'text-mute',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'h-[2px] w-5',
                      isActive ? 'bg-signal' : 'bg-transparent',
                    ].join(' ')}
                    aria-hidden
                  />
                  {link.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
