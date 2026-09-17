import { useTheme } from '../theme/ThemeProvider'
import { useInventory } from '../inventory/InventoryContext'

export function ProfilePage() {
  const { theme, setTheme, toggleTheme } = useTheme()
  const { assets, maintenances, resetInventory } = useInventory()

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <p className="bank-section-title">Preferencias</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
        Cuenta
      </h1>

      <section className="bank-card mt-5 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center border border-line bg-ledger font-display text-sm font-extrabold tracking-[0.06em]">
            JE
          </span>
          <div>
            <p className="font-display font-bold tracking-[-0.02em]">Joel Espinoza</p>
            <p className="text-sm text-mute">Administrador · CTP Santa Eulalia</p>
          </div>
        </div>
      </section>

      <section className="bank-card mt-3 p-4">
        <h2 className="font-display text-base font-bold">Apariencia</h2>
        <p className="mt-1 text-sm text-mute">
          Tema actual: {theme === 'dark' ? 'Oscuro' : 'Claro'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={theme === 'dark' ? 'btn-signal' : 'btn-secondary'}
            onClick={() => setTheme('dark')}
          >
            Oscuro
          </button>
          <button
            type="button"
            className={theme === 'light' ? 'btn-signal' : 'btn-secondary'}
            onClick={() => setTheme('light')}
          >
            Claro
          </button>
          <button type="button" className="btn-secondary" onClick={toggleTheme}>
            Alternar
          </button>
        </div>
      </section>

      <section className="bank-card mt-3 p-4">
        <h2 className="font-display text-base font-bold">Datos locales</h2>
        <p className="mt-1 text-sm text-mute">
          {assets.length} activos · {maintenances.length} mantenimientos (este navegador)
        </p>
        <button
          type="button"
          className="btn-secondary mt-3"
          onClick={() => {
            if (window.confirm('¿Restablecer inventario a los datos iniciales?')) {
              resetInventory()
            }
          }}
        >
          Restablecer inventario
        </button>
      </section>
    </div>
  )
}
