import { useQuery } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchNetworkDevices } from '../api/network'
import { useUsage } from '../usage/UsageContext'
import { sessionPeak } from '../usage/types'

const LAB_OPTIONS = [
  'Lab. Informática 1',
  'Lab. Informática 2',
  'Aula 12',
  'Biblioteca',
  'Cuarto de servidores',
]

const AUTO_SNAPSHOT_MS = 5 * 60 * 1000

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

export function UsagePage() {
  const [params] = useSearchParams()
  const activeOnly = params.get('active') === '1'
  const { sessions, activeSessions, startSession, captureSnapshot, endSession } = useUsage()
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const devicesQuery = useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchNetworkDevices,
    refetchInterval: 30_000,
  })

  const devices = devicesQuery.data ?? []
  const onlineNow = devices.filter((d) => d.isOnline).length

  const visible = useMemo(() => {
    const list = activeOnly ? sessions.filter((s) => !s.endedAt) : sessions
    return list
  }, [sessions, activeOnly])

  useEffect(() => {
    if (activeSessions.length === 0) return
    const tick = () => {
      for (const session of activeSessions) {
        captureSnapshot(session.id, devicesQuery.data ?? [])
      }
    }
    const id = window.setInterval(tick, AUTO_SNAPSHOT_MS)
    return () => window.clearInterval(id)
  }, [activeSessions, captureSnapshot, devicesQuery.data])

  async function onStart(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get('title') ?? '').trim()
    const location = String(fd.get('location') ?? '').trim()
    if (!title || !location) {
      setFormError('Indicá nombre de la clase y ubicación.')
      return
    }
    let live = devices
    try {
      live = await fetchNetworkDevices()
    } catch {
      // usa el snapshot en caché si Presence no responde
    }
    const created = startSession({ title, location, devices: live })
    setShowForm(false)
    setExpandedId(created.id)
  }

  async function onManualSnapshot(sessionId: string) {
    let live = devices
    try {
      live = await fetchNetworkDevices()
    } catch {
      /* keep cache */
    }
    captureSnapshot(sessionId, live)
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="bank-section-title">Clases y dispositivos</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
            Uso de dispositivos por clase
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-mute">
            Registrá una clase y capturá qué computadoras estaban en línea (snapshots con Presence).{' '}
            {activeSessions.length} clase(s) activa(s) · {onlineNow} equipo(s) en línea ahora
            {activeOnly ? ' · filtro: activas' : ''}.
          </p>
        </div>
        <button type="button" className="btn-signal" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : 'Iniciar clase'}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onStart} className="bank-card mt-4 space-y-3 p-4">
          <p className="font-display text-base font-bold tracking-[-0.02em]">
            Nueva clase — primer snapshot al iniciar
          </p>
          <label>
            <span className="field-label">Nombre de la clase</span>
            <input
              name="title"
              className="field"
              placeholder="Ej. Programación · 10:00"
              required
            />
          </label>
          <label>
            <span className="field-label">Ubicación / lab</span>
            <select name="location" className="field" defaultValue={LAB_OPTIONS[0]} required>
              {LAB_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-mute">
            Al guardar se registra cuántos equipos están en línea ahora (Presence) y la lista de
            hostnames/IPs. Luego se toma un snapshot automático cada 5 minutos.
          </p>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <button type="submit" className="btn-primary">
            Iniciar y guardar snapshot
          </button>
        </form>
      ) : null}

      <ul className="bank-card mt-4 divide-y divide-line overflow-hidden">
        {visible.map((session) => {
          const open = expandedId === session.id
          const last = session.snapshots[session.snapshots.length - 1]
          const peak = sessionPeak(session)
          return (
            <li key={session.id} className="px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setExpandedId(open ? null : session.id)}
                >
                  <p className="font-display font-bold tracking-[-0.02em]">{session.title}</p>
                  <p className="mt-0.5 text-sm text-mute">
                    {session.location} · inicio {formatWhen(session.startedAt)}
                    {session.endedAt ? ` · fin ${formatWhen(session.endedAt)}` : ' · en curso'}
                  </p>
                  <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-mute">
                    {session.snapshots.length} snapshot(s) · pico {peak} · último{' '}
                    {last ? last.onlineCount : 0} en línea
                  </p>
                </button>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!session.endedAt ? (
                    <>
                      <button
                        type="button"
                        className="btn-secondary !px-3 !py-2 text-[0.65rem]"
                        onClick={() => void onManualSnapshot(session.id)}
                      >
                        Snapshot ahora
                      </button>
                      <button
                        type="button"
                        className="btn-signal !px-3 !py-2 text-[0.65rem]"
                        onClick={() => endSession(session.id)}
                      >
                        Cerrar clase
                      </button>
                    </>
                  ) : (
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-signal">
                      Cerrada
                    </span>
                  )}
                </div>
              </div>

              {open ? (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="bank-section-title mb-2">Snapshots</p>
                  <ul className="space-y-3">
                    {[...session.snapshots].reverse().map((snap, index) => (
                      <li key={snap.id} className="text-sm">
                        <p className="font-semibold text-foam">
                          {formatWhen(snap.capturedAt)} · {snap.onlineCount} equipo(s)
                          {index === session.snapshots.length - 1 ? ' · primero' : ''}
                        </p>
                        {snap.devices.length === 0 ? (
                          <p className="mt-1 text-mute">Ningún equipo en línea en ese momento.</p>
                        ) : (
                          <ul className="mt-1 space-y-0.5 text-mute">
                            {snap.devices.map((d) => (
                              <li key={d.id}>
                                {d.hostname || 'sin-hostname'} · {d.ipAddress}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-mute">
          {activeOnly
            ? 'No hay clases activas. Iniciá una para guardar el primer snapshot.'
            : 'Aún no hay sesiones de uso por clase. Iniciá una clase cuando el lab entre en sesión.'}
        </p>
      ) : null}

      <p className="mt-6 text-sm text-mute">
        Vista en tiempo real de la red:{' '}
        <Link to="/live" className="font-semibold text-foam hover:text-signal">
          En vivo
        </Link>
      </p>
    </div>
  )
}
