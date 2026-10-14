import { useState } from 'react'
import { friendlyDeviceLabel, usageHeadline, usageNarrative } from '../../homeLists/adminCopy'
import {
  currentHourSlot,
  formatClassDate,
  formatCurrentHourSlotLabel,
  formatTimeRange,
  localDateKey,
} from '../../homeLists/schedule'
import type { ConnectedDeviceSighting, HomeList } from '../../homeLists/types'
import { DeviceTroubleshootSheet } from './DeviceTroubleshootSheet'

type ManageListSheetProps = {
  list: HomeList
  classDevices: ConnectedDeviceSighting[]
  activeNow: boolean
  onClose: () => void
  onSave: (patch: {
    name: string
    classDate: string
    startTime: string
    endTime: string
  }) => void
  onDelete: () => void
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CR', { timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function ManageListSheet({
  list,
  classDevices,
  activeNow,
  onClose,
  onSave,
  onDelete,
}: ManageListSheetProps) {
  const [name, setName] = useState(list.name)
  const [classDate, setClassDate] = useState(list.classDate)
  const [startTime, setStartTime] = useState(list.startTime)
  const [endTime, setEndTime] = useState(list.endTime)
  const hourSlot = currentHourSlot()
  const isCurrentHour =
    startTime === hourSlot.startTime && endTime === hourSlot.endTime
  const [deviceView, setDeviceView] = useState<'admin' | 'tech'>('admin')
  const [selectedDevice, setSelectedDevice] = useState<{
    device: ConnectedDeviceSighting
    index: number
  } | null>(null)
  const onlineCount = classDevices.filter((d) => d.isOnline !== false).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="manage-list-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col border border-line bg-panel shadow-lg sm:mx-4">
        <div className="border-b border-line px-5 py-4">
          <p className="bank-section-title">Editar clase</p>
          <h2 id="manage-list-title" className="mt-1 font-display text-xl font-bold tracking-[-0.03em]">
            {list.name}
          </h2>
          <p className="mt-1 text-sm text-mute">
            {formatClassDate(list.classDate)} · {formatTimeRange(list.startTime, list.endTime)}
            {activeNow ? ' · en curso ahora' : ''}
          </p>
        </div>

        <div className="space-y-3 border-b border-line px-5 py-4">
          <label>
            <span className="field-label">Fecha</span>
            <input
              type="date"
              className="field"
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
            />
          </label>
          <label>
            <span className="field-label">Nombre</span>
            <input
              className="field font-display text-lg font-bold"
              value={name}
              maxLength={48}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div>
            <p className="field-label mb-2">Horario rápido</p>
            <button
              type="button"
              className={[
                'border border-line px-3 py-1.5 text-sm font-medium transition',
                isCurrentHour
                  ? 'border-signal bg-ledger text-foam'
                  : 'bg-stage text-mute hover:border-signal hover:text-foam',
              ].join(' ')}
              onClick={() => {
                const slot = currentHourSlot()
                setClassDate(localDateKey())
                setStartTime(slot.startTime)
                setEndTime(slot.endTime)
              }}
            >
              {formatCurrentHourSlotLabel()}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="field-label">Desde</span>
              <input
                type="time"
                className="field"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Hasta</span>
              <input
                type="time"
                className="field"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
          <p className="text-sm text-mute">
            Los equipos aparecen solos cuando Presence los ve en esta fecha y franja. Si cambiás
            fecha u hora y ya hay conexiones, esa interacción se guarda en{' '}
            <span className="font-semibold text-foam">Historial</span> y la clase viva empieza
            limpia.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="bank-section-title">Uso en esta clase</p>
              <p className="mt-1 font-display text-base font-bold tracking-[-0.02em]">
                {usageHeadline(onlineCount)}
                {classDevices.length > onlineCount
                  ? ` · ${classDevices.length} vistos en total`
                  : ''}
              </p>
            </div>
            <div className="inline-flex border border-line" role="group" aria-label="Vista equipos">
              <button
                type="button"
                className={[
                  'px-2.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                  deviceView === 'admin' ? 'bg-foam text-ink' : 'bg-panel text-mute',
                ].join(' ')}
                onClick={() => setDeviceView('admin')}
              >
                Resumen
              </button>
              <button
                type="button"
                className={[
                  'px-2.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                  deviceView === 'tech' ? 'bg-foam text-ink' : 'bg-panel text-mute',
                ].join(' ')}
                onClick={() => setDeviceView('tech')}
              >
                Técnico
              </button>
            </div>
          </div>

          {classDevices.length === 0 ? (
            <p className="text-sm text-mute">
              Aún no hay conexiones. Presence las agregará cuando haya PCs en la red.
            </p>
          ) : deviceView === 'admin' ? (
            <>
              <p className="mb-3 text-sm text-mute">{usageNarrative(onlineCount)}</p>
              <ul className="divide-y divide-line border border-line">
                {classDevices.map((d, i) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      className="flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-ledger"
                      onClick={() => setSelectedDevice({ device: d, index: i })}
                    >
                      <span className="font-semibold text-foam">{friendlyDeviceLabel(d, i)}</span>
                      <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-mute">
                        {d.isOnline !== false ? 'En uso' : 'Ya no'} · ficha
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ul className="divide-y divide-line border border-line">
              {classDevices.map((d, i) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left font-mono text-[0.75rem] transition hover:bg-ledger"
                    onClick={() => setSelectedDevice({ device: d, index: i })}
                  >
                    <p className="text-foam">{d.hostname || 'null'}</p>
                    <p className="text-mute">
                      {d.ipAddress}
                      {d.macAddress ? ` · ${d.macAddress}` : ''} ·{' '}
                      {d.isOnline !== false ? 'online' : 'offline'} ·{' '}
                      {formatWhen(d.firstSeenAt)}–{formatWhen(d.lastSeenAt)}
                    </p>
                    <p className="mt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-signal">
                      Abrir troubleshooting
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedDevice ? (
          <DeviceTroubleshootSheet
            device={selectedDevice.device}
            index={selectedDevice.index}
            onClose={() => setSelectedDevice(null)}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
          <button
            type="button"
            className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-red-600 hover:underline"
            onClick={() => {
              if (window.confirm(`¿Eliminar la clase “${list.name}”?`)) {
                onDelete()
                onClose()
              }
            }}
          >
            Eliminar
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-signal"
              onClick={() => {
                onSave({
                  name: name.trim() || list.name,
                  classDate: classDate || list.classDate,
                  startTime,
                  endTime,
                })
                onClose()
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
