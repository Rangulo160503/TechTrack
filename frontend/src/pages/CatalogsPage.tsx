import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInventory } from '../inventory/InventoryContext'

export function CatalogsPage() {
  const { assets } = useInventory()

  const catalogs = useMemo(() => {
    const categories = new Map<string, number>()
    const brands = new Map<string, number>()
    const locations = new Map<string, number>()
    for (const a of assets) {
      categories.set(a.category, (categories.get(a.category) ?? 0) + 1)
      brands.set(a.brand, (brands.get(a.brand) ?? 0) + 1)
      locations.set(a.location, (locations.get(a.location) ?? 0) + 1)
    }
    return {
      categories: [...categories.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      brands: [...brands.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      locations: [...locations.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    }
  }, [assets])

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <p className="bank-section-title">Referencias</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
        Catálogos del inventario
      </h1>
      <p className="mt-1 text-sm text-mute">
        Derivados del inventario recompilado desde Historial (vendor, tipo, última clase)
      </p>

      <CatalogBlock
        title="Categorías"
        items={catalogs.categories}
        to={(name) => `/assets?q=${encodeURIComponent(name)}`}
      />
      <CatalogBlock
        title="Marcas"
        items={catalogs.brands}
        to={(name) => `/assets?q=${encodeURIComponent(name)}`}
      />
      <CatalogBlock
        title="Ubicaciones"
        items={catalogs.locations}
        to={(name) => `/assets?location=${encodeURIComponent(name)}`}
      />
    </div>
  )
}

function CatalogBlock({
  title,
  items,
  to,
}: {
  title: string
  items: [string, number][]
  to: (name: string) => string
}) {
  return (
    <section className="mt-6">
      <h2 className="bank-section-title mb-2">{title}</h2>
      <ul className="bank-card divide-y divide-line overflow-hidden sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-line">
        {items.map(([name, count]) => (
          <li key={name} className="bg-panel sm:border-0">
            <Link
              to={to(name)}
              className="flex items-center justify-between px-4 py-3 transition hover:bg-ledger"
            >
              <span className="font-semibold tracking-[-0.01em]">{name}</span>
              <span className="text-sm tabular-nums text-mute">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
