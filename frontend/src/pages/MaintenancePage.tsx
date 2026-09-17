import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import { useInventory } from '../inventory/InventoryContext'
import {
  maintenanceTypeLabel,
  priorityLabel,
  type MaintenancePriority,
  type MaintenanceType,
} from '../inventory/types'

export function MaintenancePage() {
  const isNew = Boolean(useMatch('/maintenance/new'))
  const { maintenances, assets, createMaintenance, completeMaintenance, getAsset } = useInventory()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const preselected = params.get('assetId') ?? ''

  const openCount = useMemo(
    () => maintenances.filter((m) => m.status !== 'Completed').length,
    [maintenances],
  )

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const assetId = String(fd.get('assetId') ?? '')
    const title = String(fd.get('title') ?? '').trim()
    const description = String(fd.get('description') ?? '').trim()
    const type = String(fd.get('type') ?? 'Corrective') as MaintenanceType
    const priority = String(fd.get('priority') ?? 'Medium') as MaintenancePriority
    if (!assetId || !title || !description) {
      setError('Completá activo, título y descripción.')
      return
    }
    createMaintenance({ assetId, title, description, type, priority })
    navigate('/maintenance')
  }

  if (isNew) {
    return (
      <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
        <Link
          to="/maintenance"
          className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-mute hover:text-foam"
        >
          Volver
        </Link>
        <p className="bank-section-title mt-4">Gestión</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
          Nuevo mantenimiento
        </h1>
        <form
          key={location.search}
          onSubmit={onCreate}
          className="bank-card mt-4 space-y-3 p-4"
        >
          <label>
            <span className="field-label">Activo</span>
            <select name="assetId" className="field" defaultValue={preselected} required>
              <option value="">Seleccionar…</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Título</span>
            <input name="title" className="field" required />
          </label>
          <label>
            <span className="field-label">Descripción</span>
            <textarea name="description" className="field min-h-24" required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Tipo</span>
              <select name="type" className="field" defaultValue="Corrective">
                <option value="Preventive">Preventivo</option>
                <option value="Corrective">Correctivo</option>
              </select>
            </label>
            <label>
              <span className="field-label">Prioridad</span>
              <select name="priority" className="field" defaultValue="Medium">
                <option value="Low">Baja</option>
                <option value="Medium">Media</option>
                <option value="High">Alta</option>
              </select>
            </label>
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="btn-primary">
            Crear registro
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="bank-section-title">Operaciones</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
            Mantenimiento
          </h1>
          <p className="mt-1 text-sm text-mute">
            {openCount} abiertos · {maintenances.length} total
          </p>
        </div>
        <Link to="/maintenance/new" className="btn-signal">
          Nuevo
        </Link>
      </div>

      <ul className="bank-card mt-4 divide-y divide-line overflow-hidden">
        {maintenances.map((m) => {
          const asset = getAsset(m.assetId)
          return (
            <li key={m.id} className="px-4 py-3.5 hover:bg-ledger">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-bold tracking-[-0.02em]">{m.title}</p>
                  <p className="mt-0.5 text-sm text-mute">
                    {asset ? (
                      <Link className="hover:text-foam" to={`/assets/${asset.id}`}>
                        {asset.code} · {asset.name}
                      </Link>
                    ) : (
                      'Activo eliminado'
                    )}
                  </p>
                  <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-mute">
                    {maintenanceTypeLabel[m.type]} · Prioridad {priorityLabel[m.priority]} ·{' '}
                    {m.status}
                  </p>
                  <p className="mt-2 text-sm text-foam/85">{m.description}</p>
                </div>
                {m.status !== 'Completed' ? (
                  <button
                    type="button"
                    className="btn-secondary shrink-0 !px-3 !py-2 text-[0.65rem]"
                    onClick={() => completeMaintenance(m.id)}
                  >
                    Completar
                  </button>
                ) : (
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-signal">
                    Completado
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {maintenances.length === 0 ? (
        <p className="mt-8 text-sm text-mute">No hay mantenimientos registrados.</p>
      ) : null}
    </div>
  )
}
