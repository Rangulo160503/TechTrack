import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  adminBrandModelLine,
  adminCompletenessLine,
  adminLocationLine,
  adminStatusLine,
  friendlyAssetLabel,
  isTechnicalAssetName,
  loadInventoryViewMode,
  saveInventoryViewMode,
  type InventoryViewMode,
} from '../inventory/adminCopy'
import { useInventory } from '../inventory/InventoryContext'
import {
  CATEGORY_SUGGESTIONS,
  COMPONENT_CATEGORY_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  statusLabel,
  type AssetStatus,
  type InventoryComponent,
} from '../inventory/types'

const statuses: AssetStatus[] = ['Operational', 'InMaintenance', 'OutOfService', 'Retired']

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function emptyComponent(): InventoryComponent {
  return { category: 'Procesador', name: '', detail: '' }
}

export function AssetDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { assets, getAsset, updateAsset } = useInventory()
  const asset = getAsset(id)
  const [saved, setSaved] = useState(false)
  const [components, setComponents] = useState<InventoryComponent[]>([])
  const [viewMode, setViewMode] = useState<InventoryViewMode>(() => loadInventoryViewMode())

  useEffect(() => {
    saveInventoryViewMode(viewMode)
  }, [viewMode])

  useEffect(() => {
    if (!asset) return
    setComponents(asset.components?.length ? asset.components : [])
  }, [asset?.id])

  if (!asset) {
    return <Navigate to="/assets" replace />
  }

  const listIndex = Math.max(
    0,
    assets.findIndex((a) => a.id === asset.id),
  )
  const adminTitle = friendlyAssetLabel(asset, listIndex)
  const pct = Math.round(asset.completeness * 100)
  const namePlaceholder = isTechnicalAssetName(asset.name)
    ? adminTitle
    : 'Ej. Equipo 2 · PC Lab 1 puesto 3'

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const codeRaw = String(fd.get('code') ?? '').trim()
    updateAsset(asset!.id, {
      name: String(fd.get('name') ?? ''),
      code: codeRaw || asset!.code,
      category: String(fd.get('category') ?? ''),
      brand: String(fd.get('brand') ?? ''),
      model: String(fd.get('model') ?? ''),
      location: String(fd.get('location') ?? ''),
      serialNumber: String(fd.get('serialNumber') ?? ''),
      responsible: String(fd.get('responsible') ?? ''),
      notes: String(fd.get('notes') ?? ''),
      status: String(fd.get('status') ?? asset!.status) as AssetStatus,
      components: components.filter((c) => c.name.trim() || c.detail.trim()),
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-mute transition hover:text-foam"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
        <div className="inline-flex border border-line" role="group" aria-label="Vista ficha">
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
      </div>

      <div className="bank-card mt-3 overflow-hidden" style={{ background: asset.tone }}>
        <div className="bg-gradient-to-t from-black/70 to-transparent px-4 py-8 md:px-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/70">
            {viewMode === 'admin'
              ? asset.category
              : `${asset.category}${asset.isManual ? ' · manual' : ' · presence'}`}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-white md:text-4xl">
            {viewMode === 'admin' ? adminTitle : asset.name}
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {viewMode === 'admin'
              ? `${adminStatusLine(asset)} · ${adminCompletenessLine(asset)}`
              : `${asset.code} · ${statusLabel[asset.status]} · ficha ${pct}%`}
          </p>
        </div>
      </div>

      {viewMode === 'admin' ? (
        <div className="mt-4 space-y-4">
          <div className="border border-line bg-stage px-4 py-3 text-sm text-mute">
            <p className="font-display font-bold text-foam">Vista resumen (administración)</p>
            <p className="mt-1 leading-relaxed">
              Acá se habla como en el colegio: <span className="text-foam">{adminTitle}</span>.
              Poné un nombre fácil de recordar (Equipo 2, PC Lab 1…). La pestaña Técnico muestra
              MAC, IP y datos de red.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Fact label="Cómo se ve" value={adminTitle} />
            <Fact label="Estado" value={adminStatusLine(asset)} />
            <Fact label="Equipo" value={adminBrandModelLine(asset)} />
            <Fact label="Dónde está" value={adminLocationLine(asset)} />
            <Fact
              label="Responsable"
              value={asset.responsible.trim() || 'Sin asignar'}
            />
            <Fact label="Ficha" value={adminCompletenessLine(asset)} />
          </dl>
          {components.length > 0 ? (
            <div>
              <p className="bank-section-title mb-2">Partes del equipo</p>
              <ul className="divide-y divide-line border border-line">
                {components.map((c, i) => (
                  <li key={i} className="px-3 py-2.5 text-sm">
                    <p className="font-semibold text-foam">
                      {c.category}
                      {c.name ? `: ${c.name}` : ''}
                    </p>
                    {c.detail ? <p className="text-mute">{c.detail}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-mute">
            Vista técnica (TI). Misma ficha; acá salen identificadores de red e inventario crudo.
          </p>
          <dl className="grid grid-cols-1 gap-2 font-mono text-[0.75rem] sm:grid-cols-2">
            <TechFact label="id" value={asset.id} />
            <TechFact label="code" value={asset.code} />
            <TechFact label="macAddress" value={asset.macAddress ?? 'null'} />
            <TechFact label="ipAddress" value={asset.ipAddress ?? 'null'} />
            <TechFact label="osVersion" value={asset.osVersion ?? 'null'} />
            <TechFact label="serialNumber" value={asset.serialNumber} />
            <TechFact label="presenceDeviceId" value={asset.presenceDeviceId ?? 'null'} />
            <TechFact label="isManual" value={String(asset.isManual)} />
            <TechFact
              label="firstSeenAt"
              value={asset.firstSeenAt ? formatWhen(asset.firstSeenAt) : 'null'}
            />
            <TechFact
              label="lastSeenAt"
              value={asset.lastSeenAt ? formatWhen(asset.lastSeenAt) : 'null'}
            />
          </dl>
          {(asset.classHistory?.length ?? 0) > 0 ? (
            <div>
              <p className="bank-section-title mb-2">Clases (Presence)</p>
              <ul className="divide-y divide-line border border-line font-mono text-[0.75rem]">
                {asset.classHistory!.map((c) => (
                  <li
                    key={`${c.name}-${c.date}`}
                    className="flex justify-between gap-3 px-3 py-2 text-foam"
                  >
                    <span>{c.name}</span>
                    <span className="text-mute">{c.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <form onSubmit={onSave} className="mt-6 space-y-5 border border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold tracking-[-0.02em]">
              {viewMode === 'admin' ? 'Completar ficha (colegio)' : 'Editar registro'}
            </h2>
            <p className="mt-0.5 text-sm text-mute">
              {viewMode === 'admin'
                ? 'El nombre es lo que administración va a recordar (Equipo 2, etc.).'
                : 'Incluye código patrimonial, serie y campos técnicos.'}
            </p>
          </div>
          {saved ? <span className="text-sm font-semibold text-signal">Guardado</span> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={viewMode === 'admin' ? 'sm:col-span-2' : undefined}>
            <span className="field-label">
              {viewMode === 'admin' ? 'Cómo lo llamamos' : 'name'}
            </span>
            <input
              name="name"
              className="field"
              defaultValue={isTechnicalAssetName(asset.name) ? adminTitle : asset.name}
              placeholder={namePlaceholder}
              required
              key={`${asset.id}-name-${viewMode}`}
            />
          </label>
          {viewMode === 'tech' ? (
            <label>
              <span className="field-label">code</span>
              <input
                name="code"
                className="field font-mono text-sm"
                defaultValue={asset.code}
                placeholder="EQ-LAB-014"
                required
              />
            </label>
          ) : null}
          <label>
            <span className="field-label">{viewMode === 'admin' ? 'Tipo' : 'category'}</span>
            <input
              name="category"
              className="field"
              list="asset-categories"
              defaultValue={asset.category}
              required
            />
            <datalist id="asset-categories">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            <span className="field-label">{viewMode === 'admin' ? 'Estado' : 'status'}</span>
            <select name="status" className="field" defaultValue={asset.status}>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">{viewMode === 'admin' ? 'Marca' : 'brand'}</span>
            <input
              name="brand"
              className="field"
              defaultValue={asset.brand === 'Desconocido' ? '' : asset.brand}
              placeholder="Dell, HP, Lenovo…"
              required
            />
          </label>
          <label>
            <span className="field-label">{viewMode === 'admin' ? 'Modelo' : 'model'}</span>
            <input
              name="model"
              className="field"
              defaultValue={asset.model}
              placeholder="Latitude 5540"
            />
          </label>
          {viewMode === 'tech' ? (
            <label>
              <span className="field-label">serialNumber</span>
              <input
                name="serialNumber"
                className="field font-mono text-sm"
                defaultValue={
                  asset.serialNumber.includes(':') ? '' : asset.serialNumber
                }
                placeholder="Fabricante"
                required
              />
            </label>
          ) : (
            <label>
              <span className="field-label">Número de serie</span>
              <input
                name="serialNumber"
                className="field"
                defaultValue={
                  asset.serialNumber.includes(':') ? '' : asset.serialNumber
                }
                placeholder="Como en la etiqueta del equipo"
                required
              />
            </label>
          )}
          <label>
            <span className="field-label">
              {viewMode === 'admin' ? 'Dónde está' : 'location'}
            </span>
            <input
              name="location"
              className="field"
              list="asset-locations"
              defaultValue={
                asset.location === 'Sin clase registrada' ? '' : asset.location
              }
              placeholder="Lab. Informática 1"
              required
            />
            <datalist id="asset-locations">
              {LOCATION_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">
              {viewMode === 'admin' ? 'Responsable' : 'responsible'}
            </span>
            <input
              name="responsible"
              className="field"
              defaultValue={asset.responsible}
              placeholder="Coordinación de informática"
            />
          </label>
          {viewMode === 'admin' ? (
            <label className="sm:col-span-2">
              <span className="field-label">Código / etiqueta (opcional en resumen)</span>
              <input
                name="code"
                className="field"
                defaultValue={
                  asset.code.startsWith('MAC-') || asset.code.startsWith('EQ-')
                    ? ''
                    : asset.code
                }
                placeholder="EQ-LAB-014 — si el colegio ya etiquetó el equipo"
              />
            </label>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="field-label mb-0">
                {viewMode === 'admin' ? 'Partes del equipo' : 'components'}
              </p>
              <p className="text-sm text-mute">
                {viewMode === 'admin'
                  ? 'Procesador, memoria, disco… lo que importa para soporte.'
                  : 'Editable; Presence puede prellenar desde hardwareProfileJson.'}
              </p>
            </div>
            <button
              type="button"
              className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-signal hover:underline"
              onClick={() => setComponents((prev) => [...prev, emptyComponent()])}
            >
              + Componente
            </button>
          </div>
          {components.length === 0 ? (
            <p className="border border-dashed border-line px-3 py-4 text-sm text-mute">
              Sin componentes aún.
            </p>
          ) : (
            <ul className="space-y-2">
              {components.map((c, index) => (
                <li
                  key={index}
                  className="grid gap-2 border border-line p-3 sm:grid-cols-[7rem_1fr_1fr_auto]"
                >
                  <input
                    className="field"
                    list="component-categories"
                    value={c.category}
                    onChange={(e) => {
                      const value = e.target.value
                      setComponents((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, category: value } : row,
                        ),
                      )
                    }}
                  />
                  <input
                    className="field"
                    placeholder="Nombre"
                    value={c.name}
                    onChange={(e) => {
                      const value = e.target.value
                      setComponents((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, name: value } : row)),
                      )
                    }}
                  />
                  <input
                    className="field"
                    placeholder="Detalle"
                    value={c.detail}
                    onChange={(e) => {
                      const value = e.target.value
                      setComponents((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, detail: value } : row,
                        ),
                      )
                    }}
                  />
                  <button
                    type="button"
                    className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-mute hover:text-foam"
                    onClick={() =>
                      setComponents((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <datalist id="component-categories">
            {COMPONENT_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <label>
          <span className="field-label">{viewMode === 'admin' ? 'Notas' : 'notes'}</span>
          <textarea
            name="notes"
            className="field min-h-[5rem]"
            defaultValue={asset.notes}
            placeholder="Garantía, daños, cargador…"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-signal">
            Guardar ficha
          </button>
          <Link to="/assets" className="btn-secondary">
            Volver al listado
          </Link>
        </div>
      </form>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-3 py-2">
      <dt className="bank-section-title">{label}</dt>
      <dd className="mt-1 break-all text-sm font-semibold text-foam">{value}</dd>
    </div>
  )
}

function TechFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-3 py-2">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-mute">{label}</p>
      <p className="mt-0.5 break-all text-foam">{value}</p>
    </div>
  )
}
