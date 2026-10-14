import { NavLink } from 'react-router-dom'
import { primaryNav } from './nav'

const mobileLinks = [
  ...primaryNav.map((item) => ({
    to: item.to,
    label: item.shortLabel ?? item.label,
    end: item.end,
  })),
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
        {mobileLinks.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={'end' in link ? link.end : undefined}
              className={({ isActive }) =>
                [
                  'flex min-h-12 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.7rem] font-medium tracking-[-0.01em]',
                  isActive ? 'text-foam' : 'text-mute',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'h-[2px] w-4',
                      isActive ? 'bg-signal' : 'bg-transparent',
                    ].join(' ')}
                    aria-hidden
                  />
                  <span className={isActive ? 'font-semibold' : undefined}>{link.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
