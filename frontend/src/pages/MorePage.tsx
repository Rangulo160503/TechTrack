import { Link } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { profileNav, secondaryNav } from '../components/layout/nav'

const items = [...secondaryNav, profileNav]

export function MorePage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="px-4 pb-4 pt-3 md:px-8">
      <p className="bank-section-title">Menú</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-foam">
        Más opciones
      </h1>
      <p className="mt-1 max-w-md text-sm text-mute">
        Uso de dispositivos por clase, historial, catálogos y cuenta. Lo diario está en la barra
        inferior.
      </p>

      <ul className="mt-5 divide-y divide-line border border-line">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-ledger"
            >
              <div className="min-w-0">
                <p className="font-display text-base font-bold tracking-[-0.02em] text-foam">
                  {item.label}
                </p>
                {item.blurb ? <p className="mt-0.5 text-sm text-mute">{item.blurb}</p> : null}
              </div>
              <span className="text-mute" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-4 text-left text-sm text-mute underline-offset-2 hover:text-foam hover:underline"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      </button>
    </div>
  )
}
