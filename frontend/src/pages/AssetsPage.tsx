import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  adminAssetBlurb,
  adminCompletenessLine,
  friendlyAssetLabel,
  loadInventoryViewMode,
  saveInventoryViewMode,
  type InventoryViewMode,
} from '../inventory/adminCopy'
import { useInventory } from '../inventory/InventoryContext'
import {
  CATEGORY_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  statusLabel,
  type AssetStatus,
} from '../inventory/types'

const statuses: AssetStatus[] = ['Operational', 'InMaintenance', 'OutOfService', 'Retired']

export function AssetsPage() {
  const { assets, createAsset, searchAssets } = useInventory()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<InventoryViewMode>(() => loadInventoryViewMode())

  useEffect(() => {
    saveInventoryViewMode(viewMode)
  }, [viewMode])

  const q = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const statusIn = params.get('statusIn') ?? ''
  const location = params.get('location') ?? ''
  const updatedToday = params.get('updatedToday') === '1'
  const incomplete = params.get('incomplete') === '1'

  const filtered = useMemo(() => {
    let list = q ? searchAssets(q) : assets
    if (statusIn) {
      const allowed = new Set(statusIn.split(',').map((s) => s.trim()).filter(Boolean))
      list = list.filter((a) => allowed.has(a.status))
    } else if (status) {
      list = list.filter((a) => a.status === status)
    }
    if (location) list = list.filter((a) => a.location.toLowerCase().includes(location.toLowerCase()))
    if (updatedToday) {
      const now = new Date()
      list = list.filter((a) => {
        const d = new Date(a.lastSeenAt ?? a.updatedAt)
        if (Number.isNaN(d.getTime())) return false
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        )
      })
    }
    if (incomplete) list = list.filter((a) => a.completeness < 1)
    return list
  }, [assets, q, searchAssets, status, statusIn, location, updatedToday, incomplete])

  const avgCompleteness =
    assets.length === 0
      ? 0
      : Math.round(
          (assets.reduce((sum, a) => sum + a.completeness, 0) / assets.length) * 100,
        )

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const fd = new FormData(e.currentTarget)
    const code = String(fd.get('code') ?? '').trim()
    const name = String(fd.get('name') ?? '').trim()
    const category = String(fd.get('category') ?? '').trim()
    const brand = String(fd.get('brand') ?? '').trim()
    const model = String(fd.get('model') ?? '').trim()
    const loc = String(fd.get('location') ?? '').trim()
    const serialNumber = String(fd.get('serialNumber') ?? '').trim()
    if (!code || !name || !category || !brand || !loc || !serialNumber) {
      setFormError('Completá los campos obligatorios del inventario.')
      return
    }
    if (assets.some((a) => a.code.toLowerCase() === code.toLowerCase())) {
      setFormError('Ya existe un activo con ese código.')
      return
    }
    const created = createAsset({
      code,
      name,
      category,
      brand,
      model,
      location: loc,
      serialNumber,
    })
    setShowForm(false)
    navigate(`/assets/${created.id}`)
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="bank-section-title">Inventario</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
            Inventario de activos
          </h1>
          <p className="mt-1 max-w-xl text-sm text-mute">
            {viewMode === 'admin'
              ? 'Vista para dirección: nombres claros (Equipo 1, Equipo 2…). Completá la ficha sin jerga de red.'
              : 'Vista para TI: código, MAC, IP y datos de Presence junto al inventario.'}{' '}
            {filtered.length} resultado(s)
            {assets.length > 0 ? ` · fichas ~${avgCompleteness}%` : ''}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-line" role="group" aria-label="Vista inventario">
            <button
              type="button"
              className={[
                'px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                viewMode === 'admin' ? 'bg-foam text-ink' : 'bg-panel text-mute hover:text-foam',
              ].join(' ')}
              onClick={() => setViewMode('admin')}
            >
              Resumen
            </button>
            <button
              type="button"
              className={[
                'px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                viewMode === 'tech' ? 'bg-foam text-ink' : 'bg-panel text-mute hover:text-foam',
              ].join(' ')}
              onClick={() => setViewMode('tech')}
            >
              Técnico
            </button>
          </div>
          <Link to="/historial-clases" className="btn-secondary">
            Historial de clases
          </Link>
          <button type="button" className="btn-signal" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancelar' : 'Nuevo activo'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label>
          <span className="field-label">Búsqueda</span>
          <input
            className="field"
            value={q}
            placeholder="Código, marca, MAC, ubicación"
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
            value={
              incomplete
                ? '__incomplete'
                : statusIn === 'InMaintenance,OutOfService'
                  ? '__attention'
                  : status
            }
            onChange={(e) => {
              const next = new URLSearchParams(params)
              next.delete('status')
              next.delete('statusIn')
              next.delete('incomplete')
              if (e.target.value === '__attention') {
                next.set('statusIn', 'InMaintenance,OutOfService')
              } else if (e.target.value === '__incomplete') {
                next.set('incomplete', '1')
              } else if (e.target.value) {
                next.set('status', e.target.value)
              }
              setParams(next, { replace: true })
            }}
          >
            <option value="">Todos</option>
            <option value="__incomplete">Ficha incompleta</option>
            <option value="__attention">Mantenimiento / fuera de servicio</option>
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
            placeholder="Lab, Secretaría…"
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
        <form onSubmit={onCreate} className="mt-4 space-y-3 border border-line p-4">
          <p className="font-display text-base font-bold tracking-[-0.02em]">
            Registrar activo (sin Presence)
          </p>
          <p className="text-sm text-mute">
            Para impresoras, proyectores u equipos que no salen en la red. Las PCs detectadas
            aparecen solas desde el Historial; abrilas y completá su ficha.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Código / etiqueta</span>
              <input name="code" className="field" placeholder="EQ-PRN-008" required />
            </label>
            <label>
              <span className="field-label">Nombre</span>
              <input name="name" className="field" placeholder="Impresora Secretaría" required />
            </label>
            <label>
              <span className="field-label">Tipo</span>
              <input
                name="category"
                className="field"
                list="new-categories"
                placeholder="Impresión"
                required
              />
              <datalist id="new-categories">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label>
              <span className="field-label">Marca</span>
              <input name="brand" className="field" placeholder="HP" required />
            </label>
            <label>
              <span className="field-label">Modelo</span>
              <input name="model" className="field" placeholder="LaserJet Pro" />
            </label>
            <label>
              <span className="field-label">Nº de serie</span>
              <input name="serialNumber" className="field" required />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Ubicación física</span>
              <input
                name="location"
                className="field"
                list="new-locations"
                placeholder="Secretaría"
                required
              />
              <datalist id="new-locations">
                {LOCATION_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <button type="submit" className="btn-primary">
            Crear y completar ficha
          </button>
        </form>
      ) : null}

      {assets.length === 0 && !showForm ? (
        <div className="mt-8 max-w-lg border border-dashed border-line bg-stage px-5 py-8">
          <p className="font-display text-lg font-bold">Empezá el inventario</p>
          <p className="mt-2 text-sm text-mute">
            1) Corré clases con Presence para que aparezcan PCs, o 2) registrá un activo a mano
            (impresora, proyector…). Luego abrí cada ficha y llená marca, modelo y serie.
          </p>
          <button type="button" className="btn-signal mt-5" onClick={() => setShowForm(true)}>
            Nuevo activo
          </button>
        </div>
      ) : (
        <ul className="bank-card mt-4 divide-y divide-line overflow-hidden">
          {filtered.map((asset, index) => {
            const pct = Math.round(asset.completeness * 100)
            const adminTitle = friendlyAssetLabel(asset, index)
            return (
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
                    {viewMode === 'admin' ? (
                      <>
                        <p className="truncate font-display text-sm font-bold tracking-[-0.02em] md:text-[0.95rem]">
                          {adminTitle}
                        </p>
                        <p className="truncate text-xs text-mute md:text-sm">
                          {adminAssetBlurb(asset)}
                        </p>
                        <p className="mt-0.5 truncate text-[0.7rem] text-mute">
                          {adminCompletenessLine(asset)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="truncate font-mono text-[0.8rem] font-semibold text-foam">
                          {asset.name}
                        </p>
                        <p className="truncate font-mono text-[0.7rem] text-mute">
                          {asset.code}
                          {asset.macAddress ? ` · ${asset.macAddress}` : ''}
                          {asset.ipAddress ? ` · ${asset.ipAddress}` : ''}
                        </p>
                        <p className="mt-0.5 truncate text-[0.7rem] text-mute">
                          {statusLabel[asset.status]} · ficha {pct}%
                          {asset.isManual ? ' · manual' : ' · presence'}
                          {asset.osVersion ? ` · ${asset.osVersion}` : ''}
                        </p>
                      </>
                    )}
                  </div>
                  <span className="text-mute" aria-hidden>
                    ›
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {assets.length > 0 && filtered.length === 0 ? (
        <p className="mt-8 text-sm text-mute">No hay activos con esos filtros.</p>
      ) : null}
    </div>
  )
}
