import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useInventory } from '../inventory/InventoryContext'
import { statusLabel, type AssetStatus } from '../inventory/types'

const statuses: AssetStatus[] = ['Operational', 'InMaintenance', 'OutOfService', 'Retired']

export function AssetsPage() {
  const { assets, createAsset, searchAssets } = useInventory()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const q = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const location = params.get('location') ?? ''

  const filtered = useMemo(() => {
    let list = q ? searchAssets(q) : assets
    if (status) list = list.filter((a) => a.status === status)
    if (location) list = list.filter((a) => a.location.toLowerCase().includes(location.toLowerCase()))
    return list
  }, [assets, q, searchAssets, status, location])

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const fd = new FormData(e.currentTarget)
    const code = String(fd.get('code') ?? '').trim()
    const name = String(fd.get('name') ?? '').trim()
    const category = String(fd.get('category') ?? '').trim()
    const brand = String(fd.get('brand') ?? '').trim()
    const loc = String(fd.get('location') ?? '').trim()
    const serialNumber = String(fd.get('serialNumber') ?? '').trim()
    if (!code || !name || !category || !brand || !loc || !serialNumber) {
      setFormError('Completá todos los campos obligatorios.')
      return
    }
    if (assets.some((a) => a.code.toLowerCase() === code.toLowerCase())) {
      setFormError('Ya existe un activo con ese código.')
      return
    }
    const created = createAsset({ code, name, category, brand, location: loc, serialNumber })
    setShowForm(false)
    navigate(`/assets/${created.id}`)
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="bank-section-title">Inventario</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
            Activos
          </h1>
          <p className="mt-1 text-sm text-mute">{filtered.length} resultado(s)</p>
        </div>
        <button type="button" className="btn-signal" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : 'Nuevo activo'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label>
          <span className="field-label">Búsqueda</span>
          <input
            className="field"
            value={q}
            placeholder="Código, marca, ubicación"
            onChange={(e) => {
              const next = new URLSearchParams(params)
              if (e.target.value) next.set('q', e.target.value)
              else next.delete('q')
              setParams(next, { replace: true })
            }}
          />
        </label>
        <label>
          <span className="field-label">Estado</span>
          <select
            className="field"
            value={status}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              if (e.target.value) next.set('status', e.target.value)
              else next.delete('status')
              setParams(next, { replace: true })
            }}
          >
            <option value="">Todos</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Ubicación</span>
          <input
            className="field"
            value={location}
            placeholder="Filtrar ubicación"
            onChange={(e) => {
              const next = new URLSearchParams(params)
              if (e.target.value) next.set('location', e.target.value)
              else next.delete('location')
              setParams(next, { replace: true })
            }}
          />
        </label>
      </div>

      {showForm ? (
        <form onSubmit={onCreate} className="bank-card mt-4 space-y-3 p-4">
          <p className="font-display text-base font-bold tracking-[-0.02em]">Registrar activo</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Código</span>
              <input name="code" className="field" required />
            </label>
            <label>
              <span className="field-label">Nombre</span>
              <input name="name" className="field" required />
            </label>
            <label>
              <span className="field-label">Categoría</span>
              <input name="category" className="field" required />
            </label>
            <label>
              <span className="field-label">Marca</span>
              <input name="brand" className="field" required />
            </label>
            <label>
              <span className="field-label">Ubicación</span>
              <input name="location" className="field" required />
            </label>
            <label>
              <span className="field-label">Nº de serie</span>
              <input name="serialNumber" className="field" required />
            </label>
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <button type="submit" className="btn-primary">
            Guardar activo
          </button>
        </form>
      ) : null}

      <ul className="bank-card mt-4 divide-y divide-line overflow-hidden">
        {filtered.map((asset) => (
          <li key={asset.id}>
            <Link
              to={`/assets/${asset.id}`}
              className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-ledger md:px-4"
            >
              <span
                className="h-11 w-9 shrink-0 border border-line"
                style={{ background: asset.tone }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold tracking-[-0.02em] md:text-[0.95rem]">
                  {asset.name}
                </p>
                <p className="truncate text-xs text-mute md:text-sm">
                  {asset.code} · {asset.location} · {statusLabel[asset.status]}
                </p>
              </div>
              <span className="text-mute" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-mute">No hay activos con esos filtros.</p>
      ) : null}
    </div>
  )
}
