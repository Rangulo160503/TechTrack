import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DeviceTroubleshootSheet } from '../components/home/DeviceTroubleshootSheet'
import {
  archiveAdminBlurb,
  closeReasonAdmin,
  friendlyDeviceLabel,
  usageHeadline,
} from '../homeLists/adminCopy'
import { useHomeLists } from '../homeLists/HomeListsContext'
import { formatClassDate, formatTimeRange } from '../homeLists/schedule'
import {
  closeReasonLabel,
  type ClassSessionArchive,
  type ConnectedDeviceSighting,
} from '../homeLists/types'

type DetailMode = 'admin' | 'tech'

const MODE_KEY = 'techtrack.classDetail.mode'

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

function formatClock(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CR', { timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function ClassHistoryPage() {
  const { archives } = useHomeLists()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<DetailMode>(() => {
    try {
      const raw = sessionStorage.getItem(MODE_KEY)
      return raw === 'tech' ? 'tech' : 'admin'
    } catch {
      return 'admin'
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(MODE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  const selected = useMemo(
    () => archives.find((a) => a.id === selectedId) ?? null,
    [archives, selectedId],
  )

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="bank-section-title">Archivo</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
            Historial de clases
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-mute">
            Registro de cómo se usó el laboratorio. Administración ve el resumen; TI puede abrir el
            detalle técnico en la misma pantalla.
          </p>
        </div>
        <Link to="/" className="btn-secondary">
          Volver a Inicio
        </Link>
      </div>

      {archives.length === 0 ? (
        <div className="mt-8 max-w-md border border-dashed border-line bg-stage px-5 py-8">
          <p className="font-display text-lg font-bold">Todavía no hay historial</p>
          <p className="mt-2 text-sm text-mute">
            Cuando una clase con conexiones se edite, termine o se elimine, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          <ul className="bank-card divide-y divide-line overflow-hidden">
            {archives.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={[
                    'w-full px-4 py-3.5 text-left transition hover:bg-ledger',
                    selectedId === item.id ? 'bg-ledger' : '',
                  ].join(' ')}
                  onClick={() => setSelectedId(item.id)}
                >
                  <p className="font-display font-bold tracking-[-0.02em]">{item.name}</p>
                  <p className="mt-0.5 text-sm text-mute">
                    {formatClassDate(item.classDate)} ·{' '}
                    {formatTimeRange(item.startTime, item.endTime)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foam">
                    {usageHeadline(item.totalSeen)}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-mute">
                    {closeReasonLabel[item.closeReason]}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <aside className="bank-card min-h-[16rem] overflow-hidden">
            {selected ? (
              <ArchiveDetail archive={selected} mode={mode} onModeChange={setMode} />
            ) : (
              <p className="px-4 py-8 text-sm text-mute">
                Elegí una clase del listado para ver el resumen o el detalle técnico.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

function ArchiveDetail({
  archive,
  mode,
  onModeChange,
}: {
  archive: ClassSessionArchive
  mode: DetailMode
  onModeChange: (mode: DetailMode) => void
}) {
  const [selectedDevice, setSelectedDevice] = useState<{
    device: ConnectedDeviceSighting
    index: number
  } | null>(null)

  return (
    <div>
      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="bank-section-title">Detalle de clase</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-[-0.02em]">
              {archive.name}
            </h2>
            <p className="mt-1 text-sm text-mute">
              {formatClassDate(archive.classDate)} ·{' '}
              {formatTimeRange(archive.startTime, archive.endTime)}
            </p>
          </div>
          <div
            className="inline-flex border border-line"
            role="group"
            aria-label="Tipo de vista"
          >
            <button
              type="button"
              className={[
                'px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                mode === 'admin' ? 'bg-foam text-ink' : 'bg-panel text-mute hover:text-foam',
              ].join(' ')}
              onClick={() => onModeChange('admin')}
            >
              Resumen
            </button>
            <button
              type="button"
              className={[
                'px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                mode === 'tech' ? 'bg-foam text-ink' : 'bg-panel text-mute hover:text-foam',
              ].join(' ')}
              onClick={() => onModeChange('tech')}
            >
              Técnico
            </button>
          </div>
        </div>
        <p className="mt-2 text-[0.7rem] text-mute">
          {mode === 'admin'
            ? 'Vista para dirección y administración.'
            : 'Vista para soporte / TI (red e identificación).'}
        </p>
      </div>

      {mode === 'admin' ? (
        <AdminBody archive={archive} onOpenDevice={setSelectedDevice} />
      ) : (
        <TechBody archive={archive} onOpenDevice={setSelectedDevice} />
      )}

      {selectedDevice ? (
        <DeviceTroubleshootSheet
          device={selectedDevice.device}
          index={selectedDevice.index}
          onClose={() => setSelectedDevice(null)}
        />
      ) : null}
    </div>
  )
}

function AdminBody({
  archive,
  onOpenDevice,
}: {
  archive: ClassSessionArchive
  onOpenDevice: (pick: { device: ConnectedDeviceSighting; index: number }) => void
}) {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="border border-line bg-stage px-4 py-3">
        <p className="bank-section-title">Qué pasó</p>
        <p className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-foam">
          {usageHeadline(archive.totalSeen)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mute">{archiveAdminBlurb(archive)}</p>
      </div>

      <div className="grid grid-cols-2 gap-px border border-line bg-line">
        <Stat label="Computadoras" value={String(archive.totalSeen)} />
        <Stat label="Cerrada" value={formatWhen(archive.closedAt)} />
      </div>

      <div>
        <p className="bank-section-title mb-2">Por qué quedó en historial</p>
        <p className="text-sm text-foam">{closeReasonAdmin[archive.closeReason]}</p>
      </div>

      <div>
        <p className="bank-section-title mb-2">Equipos (nombres legibles)</p>
        {archive.devices.length === 0 ? (
          <p className="text-sm text-mute">No hubo equipos que mostrar.</p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {archive.devices.map((d, i) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-ledger"
                  onClick={() => onOpenDevice({ device: d, index: i })}
                >
                  <span className="font-semibold text-foam">{friendlyDeviceLabel(d, i)}</span>
                  <span className="shrink-0 text-mute">
                    {formatClock(d.firstSeenAt)} – {formatClock(d.lastSeenAt)} · ficha
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-mute">
          Tocá un equipo para ver MAC, Windows y componentes. La pestaña Técnico muestra IDs crudos.
        </p>
      </div>
    </div>
  )
}

function TechBody({
  archive,
  onOpenDevice,
}: {
  archive: ClassSessionArchive
  onOpenDevice: (pick: { device: ConnectedDeviceSighting; index: number }) => void
}) {
  return (
    <div className="space-y-3 px-4 py-4">
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <TechRow label="closeReason" value={archive.closeReason} />
        <TechRow label="occurrenceKey" value={archive.occurrenceKey} />
        <TechRow label="sourceListId" value={archive.sourceListId} />
        <TechRow label="closedAt (ISO)" value={archive.closedAt} />
        <TechRow label="peakOnline" value={String(archive.peakOnline)} />
        <TechRow label="totalSeen" value={String(archive.totalSeen)} />
      </dl>

      <p className="bank-section-title pt-1">Dispositivos (Presence)</p>
      <ul className="divide-y divide-line border border-line">
        {archive.devices.map((d, i) => (
          <li key={d.id}>
            <button
              type="button"
              className="w-full px-3 py-2.5 text-left font-mono text-[0.75rem] leading-relaxed transition hover:bg-ledger"
              onClick={() => onOpenDevice({ device: d, index: i })}
            >
              <p className="text-foam">{d.hostname || 'null'}</p>
              <p className="text-mute">
                id={d.id.slice(0, 8)}… · {d.ipAddress}
                {d.macAddress ? ` · ${d.macAddress}` : ''}
              </p>
              <p className="text-mute">
                first={d.firstSeenAt} · last={d.lastSeenAt}
              </p>
              <p className="mt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-signal">
                Abrir troubleshooting
              </p>
            </button>
          </li>
        ))}
      </ul>    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel px-3 py-3">
      <p className="bank-section-title">{label}</p>
      <p className="mt-1 font-display text-base font-bold tracking-[-0.02em] text-foam">{value}</p>
    </div>
  )
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-3 py-2">
      <dt className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-mute">{label}</dt>
      <dd className="mt-0.5 break-all font-mono text-[0.75rem] text-foam">{value}</dd>
    </div>
  )
}
