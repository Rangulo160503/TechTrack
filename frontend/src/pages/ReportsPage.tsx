import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fetchNetworkDevices } from '../api/network'
import {
  archiveAdminBlurb,
  closeReasonAdmin,
  usageHeadline,
  usageNarrative,
} from '../homeLists/adminCopy'
import { useHomeLists } from '../homeLists/HomeListsContext'
import { formatClassDate, formatTimeRange } from '../homeLists/schedule'
import { closeReasonLabel, type ClassSessionArchive } from '../homeLists/types'
import {
  loadInventoryViewMode,
  saveInventoryViewMode,
  type InventoryViewMode,
} from '../inventory/adminCopy'
import { useInventory } from '../inventory/InventoryContext'

type PanelId =
  | 'completadas'
  | 'ahora'
  | 'historial'
  | 'tecnico'

const PANEL_STORAGE = 'techtrack.reports.panels.v1'

function loadOpenPanels(): Record<PanelId, boolean> {
  const defaults: Record<PanelId, boolean> = {
    completadas: true,
    ahora: false,
    historial: false,
    tecnico: false,
  }
  try {
    const raw = sessionStorage.getItem(PANEL_STORAGE)
    if (!raw) return defaults
    return { ...defaults, ...(JSON.parse(raw) as Partial<Record<PanelId, boolean>>) }
  } catch {
    return defaults
  }
}

function onlineHeadline(count: number): string {
  if (count <= 0) return 'Nadie conectado ahora'
  if (count === 1) return '1 computadora en línea'
  return `${count} computadoras en línea`
}

function onlineNarrative(count: number): string {
  if (count <= 0) {
    return 'En este momento no hay equipos respondiendo en la red del colegio.'
  }
  if (count <= 5) {
    return `Poco movimiento: ${count} equipo(s) conectado(s).`
  }
  if (count <= 15) {
    return `Actividad normal: ${count} computadoras en línea.`
  }
  return `Uso intenso: ${count} computadoras en línea.`
}

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

function CollapsiblePanel({
  id,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  summary: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="border border-line">
      <h2 className="m-0">
        <button
          type="button"
          id={`${id}-header`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-ledger"
          onClick={onToggle}
        >
          <span className="min-w-0">
            <span className="block font-display text-base font-bold tracking-[-0.02em] text-foam md:text-lg">
              {title}
            </span>
            <span className="mt-0.5 block text-sm text-mute">{summary}</span>
          </span>
          <span
            className="mt-1 shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-mute"
            aria-hidden
          >
            {open ? '▾ Ocultar' : '▸ Ver'}
          </span>
        </button>
      </h2>
      {open ? (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-header`} className="border-t border-line">
          {children}
        </div>
      ) : null}
    </section>
  )
}

function BarRow({
  label,
  sublabel,
  value,
  max,
}: {
  label: string
  sublabel?: string
  value: number
  max: number
}) {
  const pct = max <= 0 ? 0 : Math.round((value / max) * 100)
  return (
    <li className="py-2.5">
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foam">{label}</p>
          {sublabel ? <p className="truncate text-xs text-mute">{sublabel}</p> : null}
        </div>
        <span className="shrink-0 tabular-nums text-mute">{value}</span>
      </div>
      <div className="h-2 overflow-hidden bg-ink">
        <div
          className="h-full bg-signal transition-[width] duration-500"
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </li>
  )
}

function Kpi({
  label,
  value,
  hint,
  to,
}: {
  label: string
  value: string
  hint?: string
  to?: string
}) {
  const body = (
    <>
      <p className="bank-section-title">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums tracking-[-0.03em] text-foam">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs leading-snug text-mute">{hint}</p> : null}
    </>
  )
  if (to) {
    return (
      <Link to={to} className="block bg-panel px-3 py-4 transition hover:bg-ledger md:px-4">
        {body}
      </Link>
    )
  }
  return <div className="bg-panel px-3 py-4 md:px-4">{body}</div>
}

export function ReportsPage() {
  const { assets } = useInventory()
  const { archives, lists, isActiveNow, getOnlineClassDevices } = useHomeLists()
  const [viewMode, setViewMode] = useState<InventoryViewMode>(() => loadInventoryViewMode())
  const [openPanels, setOpenPanels] = useState<Record<PanelId, boolean>>(() => loadOpenPanels())

  useEffect(() => {
    saveInventoryViewMode(viewMode)
  }, [viewMode])

  useEffect(() => {
    try {
      sessionStorage.setItem(PANEL_STORAGE, JSON.stringify(openPanels))
    } catch {
      /* ignore */
    }
  }, [openPanels])

  function togglePanel(id: PanelId) {
    setOpenPanels((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function setAll(open: boolean) {
    setOpenPanels({
      completadas: open,
      ahora: open,
      historial: open,
      tecnico: open && viewMode === 'tech',
    })
  }

  const devicesQuery = useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchNetworkDevices,
    refetchInterval: 15_000,
  })

  const onlineNow = useMemo(
    () => (devicesQuery.data ?? []).filter((d) => d.isOnline).length,
    [devicesQuery.data],
  )

  const activeLists = useMemo(
    () => lists.filter((l) => isActiveNow(l)),
    [lists, isActiveNow],
  )

  const onlineInActiveClasses = useMemo(
    () =>
      activeLists.reduce((sum, list) => sum + getOnlineClassDevices(list).length, 0),
    [activeLists, getOnlineClassDevices],
  )

  /** Horario cumplido al 100% → logro de finalización. */
  const completedFullSchedule = useMemo(
    () =>
      archives
        .filter((a) => a.closeReason === 'window_ended')
        .sort((a, b) => b.closedAt.localeCompare(a.closedAt)),
    [archives],
  )

  const otherArchives = useMemo(
    () =>
      archives
        .filter((a) => a.closeReason !== 'window_ended')
        .sort((a, b) => b.closedAt.localeCompare(a.closedAt)),
    [archives],
  )

  const recentForBars = useMemo(
    () => [...archives].sort((a, b) => b.closedAt.localeCompare(a.closedAt)).slice(0, 8),
    [archives],
  )

  const maxSeen = useMemo(
    () => Math.max(1, ...recentForBars.map((a) => a.totalSeen), 0),
    [recentForBars],
  )

  const historialTotals = useMemo(() => {
    const classes = archives.length
    const sightings = archives.reduce((s, a) => s + a.totalSeen, 0)
    const peak = archives.length === 0 ? 0 : Math.max(...archives.map((a) => a.peakOnline))
    const avg =
      archives.length === 0
        ? 0
        : Math.round(archives.reduce((s, a) => s + a.totalSeen, 0) / archives.length)
    return { classes, sightings, peak, avg }
  }, [archives])

  function exportCsv() {
    const header = [
      'code',
      'name',
      'category',
      'brand',
      'model',
      'serial',
      'location',
      'responsible',
      'status',
      'mac',
      'completeness',
      'lastSeenAt',
    ]
    const rows = assets.map((a) =>
      [
        a.code,
        a.name,
        a.category,
        a.brand,
        a.model,
        a.serialNumber,
        a.location,
        a.responsible,
        a.status,
        a.macAddress ?? '',
        String(Math.round(a.completeness * 100)),
        a.lastSeenAt ?? a.updatedAt,
      ]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `techtrack-inventario-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="bank-section-title">Tablero</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
            Reportes de uso
          </h1>
          <p className="mt-1 max-w-xl text-sm text-mute">
            Abrí solo lo que necesitás. Las clases que terminaron su horario al 100% aparecen como
            logro de finalización.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => setAll(true)}>
            Expandir todo
          </button>
          <button type="button" className="btn-secondary" onClick={() => setAll(false)}>
            Colapsar todo
          </button>
          <div className="inline-flex border border-line" role="group" aria-label="Vista reportes">
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
              onClick={() => {
                setViewMode('tech')
                setOpenPanels((p) => ({ ...p, tecnico: true }))
              }}
            >
              Técnico
            </button>
          </div>
          <button type="button" className="btn-signal" onClick={exportCsv}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <CollapsiblePanel
          id="completadas"
          title="Clases completadas al 100% del horario"
          summary={
            completedFullSchedule.length === 0
              ? 'Aún no hay logros: aparecen cuando una clase llega al final de su franja.'
              : `${completedFullSchedule.length} clase(s) finalizaron su horario completo`
          }
          open={openPanels.completadas}
          onToggle={() => togglePanel('completadas')}
        >
          <div className="px-4 py-3">
            <p className="mb-3 text-sm leading-relaxed text-mute">
              Cuando la clase cumple todo el horario esperado (de inicio a fin), TechTrack la
              archiva y la marca aquí como{' '}
              <span className="font-semibold text-foam">finalización completa</span>. No es un
              cierre por editar o borrar: es el horario al 100%.
            </p>
            {completedFullSchedule.length === 0 ? (
              <p className="border border-dashed border-line px-3 py-6 text-sm text-mute">
                Todavía no hay clases que hayan llegado al final de su franja con equipos
                registrados.
              </p>
            ) : (
              <ul className="space-y-2">
                {completedFullSchedule.map((a) => (
                  <li key={a.id}>
                    <AchievementCard archive={a} />
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/historial-clases"
              className="mt-4 inline-block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-signal hover:underline"
            >
              Ver historial de clases
            </Link>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          id="ahora"
          title="Situación ahora en la red"
          summary={
            devicesQuery.isLoading && !devicesQuery.data
              ? 'Consultando…'
              : onlineHeadline(onlineNow)
          }
          open={openPanels.ahora}
          onToggle={() => togglePanel('ahora')}
        >
          <div className="border-b border-line bg-stage px-4 py-3">
            <p className="text-sm leading-relaxed text-mute">{onlineNarrative(onlineNow)}</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            <Kpi
              label="En línea ahora"
              value={devicesQuery.isLoading && !devicesQuery.data ? '…' : String(onlineNow)}
              hint="Computadoras respondiendo"
              to="/live"
            />
            <Kpi
              label="Clases en curso"
              value={String(activeLists.length)}
              hint="Franjas activas en Inicio"
              to="/"
            />
            <Kpi
              label="Equipos en esas clases"
              value={String(onlineInActiveClasses)}
              hint="Vistos en la franja actual"
              to="/"
            />
            <Kpi
              label="Clases en el tablero"
              value={String(lists.length)}
              hint="Programadas en Inicio"
              to="/"
            />
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          id="historial"
          title="Movimiento del historial de clases"
          summary={
            archives.length === 0
              ? 'Sin clases cerradas todavía'
              : `${historialTotals.classes} clase(s) · pico ${historialTotals.peak} equipos`
          }
          open={openPanels.historial}
          onToggle={() => togglePanel('historial')}
        >
          <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            <Kpi label="Clases registradas" value={String(historialTotals.classes)} />
            <Kpi
              label="Apariciones totales"
              value={String(historialTotals.sightings)}
              hint="Equipos vistos sumados"
            />
            <Kpi
              label="Pico más alto"
              value={String(historialTotals.peak)}
              hint="Máximo en una clase"
            />
            <Kpi
              label="Promedio por clase"
              value={String(historialTotals.avg)}
              hint="Equipos vistos en promedio"
            />
          </div>
          <div className="px-4 py-3">
            <p className="bank-section-title mb-2">Últimas clases (equipos vistos)</p>
            {recentForBars.length === 0 ? (
              <p className="border border-dashed border-line px-3 py-6 text-sm text-mute">
                Sin datos aún.
              </p>
            ) : (
              <ul className="divide-y divide-line border border-line px-3">
                {recentForBars.map((a) => (
                  <BarRow
                    key={a.id}
                    label={a.name}
                    sublabel={`${formatClassDate(a.classDate)} · ${formatTimeRange(a.startTime, a.endTime)} · ${usageHeadline(a.totalSeen)}${a.closeReason === 'window_ended' ? ' · 100% horario' : ''}`}
                    value={a.totalSeen}
                    max={maxSeen}
                  />
                ))}
              </ul>
            )}
            {otherArchives.length > 0 ? (
              <p className="mt-3 text-xs text-mute">
                Otras cierres (edición, borrado, etc.): {otherArchives.length}. Detalle en{' '}
                <Link to="/historial-clases" className="text-signal hover:underline">
                  Historial de clases
                </Link>
                .
              </p>
            ) : null}
          </div>
        </CollapsiblePanel>

        {viewMode === 'tech' ? (
          <CollapsiblePanel
            id="tecnico"
            title="Detalle técnico (TI)"
            summary={`${archives.length} archives · ${lists.length} lists · onlineNow=${onlineNow}`}
            open={openPanels.tecnico}
            onToggle={() => togglePanel('tecnico')}
          >
            <div className="space-y-3 p-4 font-mono text-[0.75rem]">
              <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
                <Kpi label="onlineNow" value={String(onlineNow)} />
                <Kpi label="window_ended" value={String(completedFullSchedule.length)} />
                <Kpi label="archives" value={String(archives.length)} />
                <Kpi label="activeLists" value={String(activeLists.length)} />
              </div>
              <ul className="divide-y divide-line border border-line">
                {archives.length === 0 ? (
                  <li className="px-3 py-4 text-mute">[]</li>
                ) : (
                  archives.map((a) => (
                    <li key={a.id} className="px-3 py-2.5 text-foam">
                      <p>
                        {a.name} · {a.classDate} {a.startTime}-{a.endTime}
                      </p>
                      <p className="text-mute">
                        peakOnline={a.peakOnline} · totalSeen={a.totalSeen} · closeReason=
                        {a.closeReason} ({closeReasonLabel[a.closeReason]})
                      </p>
                      <p className="text-mute">{usageNarrative(a.totalSeen)}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </CollapsiblePanel>
        ) : null}
      </div>
    </div>
  )
}

function AchievementCard({ archive }: { archive: ClassSessionArchive }) {
  return (
    <div className="border border-signal/40 bg-stage px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-signal">
            Finalización completa · 100% del horario
          </p>
          <p className="mt-1 font-display text-lg font-bold tracking-[-0.02em] text-foam">
            {archive.name}
          </p>
          <p className="mt-0.5 text-sm text-mute">
            {formatClassDate(archive.classDate)} ·{' '}
            {formatTimeRange(archive.startTime, archive.endTime)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold tabular-nums text-signal">100%</p>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-mute">horario</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden bg-ink">
        <div className="h-full w-full bg-signal" />
      </div>
      <p className="mt-2 text-sm text-mute">
        {usageHeadline(archive.totalSeen)}
        {archive.peakOnline > 0 ? ` · pico ${archive.peakOnline}` : ''} · cerrado{' '}
        {formatWhen(archive.closedAt)}
      </p>
      <p className="mt-1 text-xs text-mute">
        {closeReasonAdmin.window_ended} {archiveAdminBlurb(archive)}
      </p>
    </div>
  )
}
