import { useQuery } from '@tanstack/react-query'
import { startTransition, useCallback, useState } from 'react'
import { fetchNetworkDevices } from '../api/network'
import { usePresenceHub } from '../hooks/usePresenceHub'
import type { NetworkDevice } from '../types/network'

function formatSeen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function mergeDevice(prev: NetworkDevice[], device: NetworkDevice): NetworkDevice[] {
  const index = prev.findIndex((d) => d.id === device.id)
  if (index === -1) {
    return [device, ...prev]
  }
  const next = [...prev]
  next[index] = device
  return next.sort((a, b) => Number(b.isOnline) - Number(a.isOnline))
}

export function LivePage() {
  const [liveDevices, setLiveDevices] = useState<NetworkDevice[] | null>(null)

  const snapshotQuery = useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchNetworkDevices,
  })

  const devices = liveDevices ?? snapshotQuery.data ?? []

  const handleUpsert = useCallback((device: NetworkDevice) => {
    startTransition(() => {
      setLiveDevices((prev) => mergeDevice(prev ?? snapshotQuery.data ?? [], device))
    })
  }, [snapshotQuery.data])

  const handleOffline = useCallback((device: NetworkDevice) => {
    startTransition(() => {
      setLiveDevices((prev) => mergeDevice(prev ?? snapshotQuery.data ?? [], { ...device, isOnline: false }))
    })
  }, [snapshotQuery.data])

  const connectionState = usePresenceHub(handleUpsert, handleOffline)

  const onlineCount = devices.filter((d) => d.isOnline).length

  return (
    <div className="px-4 pt-4 md:px-8 md:pt-6">
      <header className="mb-5 border-b border-line pb-5 md:mb-7">
        <div className="max-w-3xl">
          <p className="bank-section-title text-signal">Presencia en red</p>
          <h1 className="mt-2 font-display text-[1.75rem] font-bold leading-tight tracking-[-0.03em] text-foam md:text-[2.5rem]">
            Equipos en vivo
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mute md:text-[0.95rem]">
            Equipos anunciados por Presence Client en esta WiFi, sin abrir nada en el teléfono.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill
            label={
              connectionState === 'connected'
                ? 'En vivo'
                : connectionState === 'connecting'
                  ? 'Conectando'
                  : 'Sin señal'
            }
            tone={connectionState === 'connected' ? 'ok' : connectionState === 'connecting' ? 'warn' : 'bad'}
          />
          <StatusPill label={`${onlineCount} en línea`} tone="ok" />
          <StatusPill label={`${devices.length} visibles`} tone="neutral" />
        </div>
      </header>

      {snapshotQuery.isLoading && devices.length === 0 ? (
        <p className="text-sm text-mute">Cargando…</p>
      ) : null}

      {snapshotQuery.isError && devices.length === 0 ? (
        <p className="text-sm text-red-700">
          No se pudo cargar el snapshot. Verifica que el API esté en ejecución.
        </p>
      ) : null}

      {devices.length === 0 && !snapshotQuery.isLoading ? (
        <div className="bank-card px-4 py-6 text-sm leading-relaxed text-mute">
          Aún no hay equipos. Ejecutá{' '}
          <code className="text-foam">TechTrack.PresenceClient</code> en las PCs de la red.
        </div>
      ) : (
        <ul className="bank-card divide-y divide-line overflow-hidden">
          {devices.map((device) => (
            <li key={device.id} className="px-3.5 py-3.5 transition-colors hover:bg-ledger md:px-4 md:py-4">
              <div className="flex items-start gap-3">
                <span
                  className={[
                    'mt-1.5 inline-block h-2 w-2 shrink-0',
                    device.isOnline ? 'bg-signal' : 'bg-mute/50',
                  ].join(' ')}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate font-display text-[0.95rem] font-bold tracking-[-0.02em] text-foam">
                      {device.hostname || device.ipAddress}
                    </p>
                    <span
                      className={[
                        'shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                        device.isOnline ? 'text-signal' : 'text-mute',
                      ].join(' ')}
                    >
                      {device.isOnline ? 'En línea' : 'Fuera'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-mute">{device.ipAddress}</p>
                  {(device.macAddress || device.vendor) && (
                    <p className="mt-0.5 truncate text-xs text-mute">
                      {[device.macAddress, device.vendor].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.7rem] text-mute">
                    <span>Visto {formatSeen(device.lastSeenAt)}</span>
                    <span className="truncate">Agente {device.lastSeenByAgentId}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: 'ok' | 'warn' | 'bad' | 'neutral'
}) {
  const toneClass =
    tone === 'ok'
      ? 'border-signal text-signal'
      : tone === 'warn'
        ? 'border-amber-600 text-amber-700'
        : tone === 'bad'
          ? 'border-red-600 text-red-700'
          : 'border-line text-mute'

  return (
    <span
      className={`shrink-0 border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] ${toneClass}`}
    >
      {label}
    </span>
  )
}
