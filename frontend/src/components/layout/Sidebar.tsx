import { NavLink } from 'react-router-dom'
import { BrandMark } from '../brand/BrandMark'
import { primaryNav, profileNav, secondaryNav, type NavItem } from './nav'

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'block border-l-2 px-3 py-2 text-[0.8125rem] leading-snug transition-colors',
          isActive
            ? 'border-signal bg-ledger font-semibold text-foam'
            : 'border-transparent font-medium text-mute hover:border-line hover:text-foam',
        ].join(' ')
      }
    >
      {item.label}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col border-r border-line bg-rail text-foam md:flex">
      <div className="flex h-[4.25rem] items-center gap-3 border-b border-line px-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="font-display text-[1.05rem] font-bold tracking-[-0.03em]">TechTrack</p>
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-mute">
            CTP Santa Eulalia
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Principal">
        <div>
          <p className="bank-section-title px-3 pb-2">Principal</p>
          <div className="flex flex-col gap-0.5">
            {primaryNav.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </div>
        </div>

        <div>
          <p className="bank-section-title px-3 pb-2">Más</p>
          <div className="flex flex-col gap-0.5">
            {secondaryNav.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-line px-5 py-4">
        <NavLink
          to={profileNav.to}
          className={({ isActive }) =>
            [
              'text-sm transition-colors',
              isActive ? 'font-semibold text-foam' : 'text-mute hover:text-foam',
            ].join(' ')
          }
        >
          {profileNav.label}
        </NavLink>
      </div>
    </aside>
  )
}
