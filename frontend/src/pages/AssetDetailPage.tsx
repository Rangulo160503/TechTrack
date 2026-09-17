import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useInventory } from '../inventory/InventoryContext'
import { statusLabel, type AssetStatus } from '../inventory/types'

const statuses: AssetStatus[] = ['Operational', 'InMaintenance', 'OutOfService', 'Retired']

export function AssetDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { getAsset, updateAsset, maintenances } = useInventory()
  const asset = getAsset(id)
  const [saved, setSaved] = useState(false)

  if (!asset) {
    return <Navigate to="/assets" replace />
  }

  const related = maintenances.filter((m) => m.assetId === asset.id)

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    updateAsset(asset!.id, {
      name: String(fd.get('name') ?? ''),
      category: String(fd.get('category') ?? ''),
      brand: String(fd.get('brand') ?? ''),
      location: String(fd.get('location') ?? ''),
      serialNumber: String(fd.get('serialNumber') ?? ''),
      notes: String(fd.get('notes') ?? ''),
      status: String(fd.get('status') ?? asset!.status) as AssetStatus,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <button
        type="button"
        className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-mute transition hover:text-foam"
        onClick={() => navigate(-1)}
      >
        Volver
      </button>

      <div className="bank-card mt-3 overflow-hidden" style={{ background: asset.tone }}>
        <div className="bg-gradient-to-t from-black/70 to-transparent px-4 py-8 md:px-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/70">
            {asset.category}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-white md:text-4xl">
            {asset.name}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {asset.code} · {statusLabel[asset.status]}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/maintenance/new?assetId=${asset.id}`} className="btn-signal">
          Registrar mantenimiento
        </Link>
        <Link to="/assets" className="btn-secondary">
          Ver inventario
        </Link>
      </div>

      <form onSubmit={onSave} className="bank-card mt-6 space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold tracking-[-0.02em]">Ficha del activo</h2>
          {saved ? <span className="text-sm font-semibold text-signal">Guardado</span> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="field-label">Nombre</span>
            <input name="name" className="field" defaultValue={asset.name} required />
          </label>
          <label>
            <span className="field-label">Estado</span>
            <select name="status" className="field" defaultValue={asset.status}>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Categoría</span>
            <input name="category" className="field" defaultValue={asset.category} required />
          </label>
          <label>
            <span className="field-label">Marca</span>
            <input name="brand" className="field" defaultValue={asset.brand} required />
          </label>
          <label>
            <span className="field-label">Ubicación</span>
            <input name="location" className="field" defaultValue={asset.location} required />
          </label>
          <label>
            <span className="field-label">Nº de serie</span>
            <input name="serialNumber" className="field" defaultValue={asset.serialNumber} required />
          </label>
        </div>
        <label>
          <span className="field-label">Notas</span>
          <textarea name="notes" className="field min-h-24" defaultValue={asset.notes} />
        </label>
        <button type="submit" className="btn-primary">
          Guardar cambios
        </button>
      </form>

      <section className="mt-6">
        <h2 className="bank-section-title">Mantenimientos</h2>
        {related.length === 0 ? (
          <p className="mt-2 text-sm text-mute">Sin registros aún.</p>
        ) : (
          <ul className="bank-card mt-2 divide-y divide-line overflow-hidden">
            {related.map((m) => (
              <li key={m.id} className="px-4 py-3">
                <p className="font-semibold">{m.title}</p>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-mute">
                  {m.status} · {m.type} · {m.priority}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
