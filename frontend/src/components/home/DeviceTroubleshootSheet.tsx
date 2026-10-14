import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchNetworkDevices } from '../../api/network'
import { friendlyDeviceLabel } from '../../homeLists/adminCopy'
import type { ConnectedDeviceSighting } from '../../homeLists/types'
import { deviceInventoryKey } from '../../inventory/compileFromHistory'
import { useInventory } from '../../inventory/InventoryContext'
import { statusLabel } from '../../inventory/types'
import { parseHardwareProfile } from '../../types/network'

type DeviceTroubleshootSheetProps = {
  device: ConnectedDeviceSighting
  index?: number
  onClose: () => void
}

type ViewMode = 'admin' | 'tech'

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

export function DeviceTroubleshootSheet({
  device,
  index = 0,
  onClose,
}: DeviceTroubleshootSheetProps) {
  const [mode, setMode] = useState<ViewMode>('admin')
  const { assets } = useInventory()
  const devicesQuery = useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchNetworkDevices,
  })

  const live = useMemo(
    () => (devicesQuery.data ?? []).find((d) => d.id === device.id) ?? null,
    [devicesQuery.data, device.id],
  )

  const mac = live?.macAddress ?? device.macAddress ?? null

  const inventoryMatch = useMemo(() => {
    const key = deviceInventoryKey({
      ...device,
      macAddress: mac ?? device.macAddress,
      hostname: live?.hostname ?? device.hostname,
    })
    const byKey = assets.find((a) => a.id === key)
    if (byKey) return byKey
    const host = (live?.hostname ?? device.hostname ?? '').toLowerCase()
    if (!host) return null
    return (
      assets.find(
        (a) =>
          a.name.toLowerCase() === host ||
          a.name.toLowerCase().includes(host) ||
          (a.presenceDeviceId && a.presenceDeviceId === device.id),
      ) ?? null
    )
  }, [assets, device, live?.hostname, mac])

  const vendor = live?.vendor ?? device.vendor ?? null
  const osVersion = live?.osVersion ?? device.osVersion ?? null
  const components = parseHardwareProfile(
    live?.hardwareProfileJson ?? device.hardwareProfileJson ?? null,
  )
  const online = live?.isOnline ?? device.isOnline !== false
  const title = friendlyDeviceLabel(
    {
      ...device,
      hostname: live?.hostname ?? device.hostname,
    },
    index,
  )

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="device-troubleshoot-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col border border-line bg-panel shadow-lg sm:mx-4">
        <div className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="bank-section-title">Ficha de equipo</p>
              <h2
                id="device-troubleshoot-title"
                className="mt-1 font-display text-xl font-bold tracking-[-0.03em]"
              >
                {title}
              </h2>
              <p className="mt-1 text-sm text-mute">
                {online ? 'En red ahora' : 'No está en red ahora'} · para diagnóstico
              </p>
            </div>
            <div className="inline-flex border border-line" role="group" aria-label="Vista ficha">
              <button
                type="button"
                className={[
                  'px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                  mode === 'admin' ? 'bg-foam text-ink' : 'bg-panel text-mute hover:text-foam',
                ].join(' ')}
                onClick={() => setMode('admin')}
              >
                Resumen
              </button>
              <button
                type="button"
                className={[
                  'px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                  mode === 'tech' ? 'bg-foam text-ink' : 'bg-panel text-mute hover:text-foam',
                ].join(' ')}
                onClick={() => setMode('tech')}
              >
                Técnico
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {mode === 'admin' ? (
            <div className="space-y-4">
              <div className="border border-line bg-stage px-4 py-3">
                <p className="bank-section-title">Estado</p>
                <p className="mt-2 text-sm leading-relaxed text-mute">
                  {online
                    ? 'Este equipo está conectado a la red del colegio en este momento.'
                    : 'Este equipo se vio en la clase, pero ya no responde en la red.'}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Fact label="Nombre en red" value={live?.hostname ?? device.hostname ?? 'Sin nombre'} />
                <Fact label="Dirección MAC" value={mac ?? 'No reportada aún'} />
                <Fact label="Sistema" value={osVersion ?? 'Pendiente (Presence Client)'} />
                <Fact label="Fabricante / tipo" value={vendor ?? 'Desconocido'} />
              </dl>

              {inventoryMatch ? (
                <div className="border border-line px-4 py-3">
                  <p className="bank-section-title">En inventario (desde Historial)</p>
                  <p className="mt-2 font-display font-bold">{inventoryMatch.name}</p>
                  <p className="mt-1 text-sm text-mute">
                    {inventoryMatch.code} · {inventoryMatch.location} ·{' '}
                    {statusLabel[inventoryMatch.status]}
                  </p>
                  <p className="mt-1 text-sm text-mute">
                    {inventoryMatch.macAddress ?? inventoryMatch.serialNumber}
                    {inventoryMatch.classCount != null
                      ? ` · ${inventoryMatch.classCount} clase(s)`
                      : ''}
                  </p>
                  <Link
                    to={`/assets/${inventoryMatch.id}`}
                    className="mt-3 inline-block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-signal hover:underline"
                  >
                    Abrir ficha de inventario
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-mute">
                  Este equipo aún no está en Activos. Cuando aparezca en una clase o en el
                  Historial, se recompilará solo.
                </p>
              )}

              <div>
                <p className="bank-section-title mb-2">Componentes</p>
                {components.length === 0 ? (
                  <p className="text-sm text-mute">
                    El listado completo (CPU, RAM, discos, versión de Windows) aparece cuando el
                    Presence Client corre en esa PC y reporta el perfil. Los vecinos solo por red
                    muestran IP/MAC.
                  </p>
                ) : (
                  <ul className="divide-y divide-line border border-line">
                    {components.map((c, i) => (
                      <li key={`${c.category}-${c.name}-${i}`} className="px-3 py-2.5 text-sm">
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-mute">
                          {c.category}
                        </p>
                        <p className="font-semibold text-foam">{c.name}</p>
                        <p className="text-mute">{c.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-[0.75rem]">
              <TechLine label="id" value={device.id} />
              <TechLine label="hostname" value={live?.hostname ?? device.hostname} />
              <TechLine label="ipAddress" value={live?.ipAddress ?? device.ipAddress} />
              <TechLine label="macAddress" value={mac} />
              <TechLine label="vendor" value={vendor} />
              <TechLine label="osVersion" value={osVersion} />
              <TechLine label="isOnline" value={String(online)} />
              <TechLine label="lastSeenByAgentId" value={live?.lastSeenByAgentId ?? null} />
              <TechLine
                label="firstSeenAt"
                value={live?.firstSeenAt ?? device.firstSeenAt}
              />
              <TechLine label="lastSeenAt" value={live?.lastSeenAt ?? device.lastSeenAt} />
              <TechLine
                label="hardwareProfileJson"
                value={live?.hardwareProfileJson ?? device.hardwareProfileJson ?? null}
              />
              {components.length > 0 ? (
                <div className="border border-line">
                  <p className="border-b border-line px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-mute">
                    parsed components ({components.length})
                  </p>
                  <ul className="divide-y divide-line">
                    {components.map((c, i) => (
                      <li key={i} className="px-3 py-2 text-foam">
                        [{c.category}] {c.name}: {c.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-line px-5 py-3">
          <button type="button" className="btn-signal" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-3 py-2">
      <dt className="bank-section-title">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foam">{value}</dd>
    </div>
  )
}

function TechLine({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border border-line px-3 py-2">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-mute">{label}</p>
      <p className="mt-0.5 break-all text-foam">{value ?? 'null'}</p>
      {label.includes('SeenAt') && value ? (
        <p className="mt-0.5 text-mute">{formatWhen(value)}</p>
      ) : null}
    </div>
  )
}
