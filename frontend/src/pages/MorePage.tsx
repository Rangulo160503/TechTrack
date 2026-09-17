import { Link } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'

const secondary = [
  {
    to: '/maintenance',
    title: 'Mantenimiento',
    blurb: 'Preventivos y correctivos',
  },
  {
    to: '/catalogs',
    title: 'Catálogos',
    blurb: 'Categorías, marcas y ubicaciones',
  },
  {
    to: '/reports',
    title: 'Reportes',
    blurb: 'Indicadores y exportación CSV',
  },
  {
    to: '/profile',
    title: 'Cuenta',
    blurb: 'Tema y preferencias',
  },
]

export function MorePage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="px-4 pb-4 pt-3 md:px-8">
      <p className="bank-section-title">Menú</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-foam">Más</h1>

      <button type="button" className="btn-secondary mt-4 w-full" onClick={toggleTheme}>
        {theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      </button>

      <ul className="bank-card mt-4 divide-y divide-line overflow-hidden">
        {secondary.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="flex items-center justify-between gap-3 px-4 py-4 transition hover:bg-ledger"
            >
              <div className="min-w-0">
                <p className="font-display text-base font-bold tracking-[-0.02em] text-foam">
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm text-mute">{item.blurb}</p>
              </div>
              <span className="text-mute" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
