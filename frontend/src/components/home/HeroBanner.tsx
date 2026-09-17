import { Link } from 'react-router-dom'
import { useInventory } from '../../inventory/InventoryContext'
import { statusLabel } from '../../inventory/types'

export function HeroBanner() {
  const { featuredAsset } = useInventory()

  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-panel">
      <div
        className="pointer-events-none absolute right-[-8%] top-[-30%] h-[140%] w-[48%] opacity-[0.22]"
        style={{
          background: 'url(/brand/liquid-core.jpg) center / cover no-repeat',
          filter: 'blur(28px) saturate(1.1)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 70%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,var(--tt-panel)_0%,var(--tt-panel)_52%,transparent_82%)]"
        aria-hidden
      />

      <div className="relative grid gap-8 px-4 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-end md:px-8 md:py-12">
        <div className="max-w-2xl">
          <p className="bank-section-title mb-3">Producto destacado</p>
          <h2 className="font-display text-[2.1rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-foam md:text-[3.25rem]">
            TechTrack
          </h2>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-mute md:text-base">
            Inventario tecnológico institucional del CTP Santa Eulalia. Consultá fichas, estados y
            mantenimientos con la claridad de una plataforma operativa.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 border border-line bg-stage p-4 sm:grid-cols-3">
            <div>
              <dt className="bank-section-title">Equipo</dt>
              <dd className="mt-1 text-sm font-semibold text-foam">{featuredAsset.name}</dd>
            </div>
            <div>
              <dt className="bank-section-title">Código</dt>
              <dd className="mt-1 text-sm font-semibold text-foam">{featuredAsset.code}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="bank-section-title">Estado</dt>
              <dd className="mt-1 text-sm font-semibold text-signal">
                {statusLabel[featuredAsset.status]}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link to={`/assets/${featuredAsset.id}`} className="btn-signal">
              Ver detalle
            </Link>
            <Link to={`/maintenance/new?assetId=${featuredAsset.id}`} className="btn-secondary">
              Registrar mantenimiento
            </Link>
          </div>
        </div>

        <aside className="bank-card overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <p className="bank-section-title">Resumen de ficha</p>
          </div>
          <div className="space-y-3 px-4 py-4 text-sm">
            <Row label="Ubicación" value={featuredAsset.location} />
            <Row label="Categoría" value={featuredAsset.category} />
            <Row label="Marca" value={featuredAsset.brand} />
            <Row label="Serie" value={featuredAsset.serialNumber} />
          </div>
        </aside>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/70 pb-2 last:border-0 last:pb-0">
      <span className="text-mute">{label}</span>
      <span className="text-right font-semibold text-foam">{value}</span>
    </div>
  )
}
