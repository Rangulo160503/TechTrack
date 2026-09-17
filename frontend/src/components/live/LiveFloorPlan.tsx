import { useMemo, useState } from 'react'
import type { NetworkDevice } from '../../types/network'

type Zone = {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
}

const ZONES: Zone[] = [
  { id: 'lab1', label: 'Lab. Inf. 1', x: 4, y: 8, w: 30, h: 36 },
  { id: 'lab2', label: 'Lab. Inf. 2', x: 38, y: 8, w: 28, h: 36 },
  { id: 'serv', label: 'Servidores', x: 70, y: 8, w: 26, h: 22 },
  { id: 'sec', label: 'Secretaría', x: 70, y: 34, w: 26, h: 20 },
  { id: 'aula', label: 'Aulas', x: 4, y: 50, w: 34, h: 28 },
  { id: 'biblio', label: 'Biblioteca', x: 42, y: 50, w: 28, h: 28 },
  { id: 'pasillo', label: 'Pasillo / WiFi', x: 74, y: 58, w: 22, h: 20 },
]

function hashString(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0
  }
  return h
}

function inferZoneId(device: NetworkDevice): string {
  const hay = `${device.hostname ?? ''} ${device.lastSeenByAgentId} ${device.vendor ?? ''}`.toLowerCase()
  if (hay.includes('lab') && (hay.includes('1') || hay.includes('inf1'))) return 'lab1'
  if (hay.includes('lab') && (hay.includes('2') || hay.includes('inf2'))) return 'lab2'
  if (hay.includes('serv') || hay.includes('server') || hay.includes('ups')) return 'serv'
  if (hay.includes('secre') || hay.includes('admin')) return 'sec'
  if (hay.includes('aula') || hay.includes('proy')) return 'aula'
  if (hay.includes('bibl')) return 'biblio'
  if (hay.includes('ap') || hay.includes('wifi') || hay.includes('pasillo')) return 'pasillo'

  const octet = Number(device.ipAddress.split('.').pop() ?? '0')
  if (octet >= 1 && octet <= 40) return 'lab1'
  if (octet <= 80) return 'lab2'
  if (octet <= 110) return 'serv'
  if (octet <= 140) return 'sec'
  if (octet <= 180) return 'aula'
  if (octet <= 210) return 'biblio'
  return 'pasillo'
}

type Marker = {
  device: NetworkDevice
  zone: Zone
  left: number
  top: number
}

type LiveFloorPlanProps = {
  devices: NetworkDevice[]
}

export function LiveFloorPlan({ devices }: LiveFloorPlanProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const markers = useMemo<Marker[]>(() => {
    const byZone = new Map<string, NetworkDevice[]>()
    for (const device of devices) {
      const zoneId = inferZoneId(device)
      const list = byZone.get(zoneId) ?? []
      list.push(device)
      byZone.set(zoneId, list)
    }

    const result: Marker[] = []
    for (const zone of ZONES) {
      const list = byZone.get(zone.id) ?? []
      list.forEach((device, index) => {
        const seed = hashString(device.id)
        const col = index % 3
        const row = Math.floor(index / 3)
        const jitterX = (seed % 7) - 3
        const jitterY = ((seed >> 3) % 7) - 3
        const left = zone.x + 8 + col * 28 + jitterX
        const top = zone.y + 18 + row * 18 + jitterY
        result.push({
          device,
          zone,
          left: Math.min(zone.x + zone.w - 6, Math.max(zone.x + 4, left)),
          top: Math.min(zone.y + zone.h - 6, Math.max(zone.y + 12, top)),
        })
      })
    }
    return result
  }, [devices])

  const selected = markers.find((m) => m.device.id === selectedId)?.device ?? null

  return (
    <div className="space-y-3">
      <div className="bank-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <p className="bank-section-title">Croquis CTP · planta esquemática</p>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-mute">
            {markers.length} marcadores
          </p>
        </div>

        <div className="relative aspect-[4/3] w-full bg-ledger md:aspect-[16/10]">
          <div
            className="absolute inset-3 border border-dashed border-line bg-[repeating-linear-gradient(0deg,transparent,transparent_11px,color-mix(in_srgb,var(--tt-line)_55%,transparent)_12px),repeating-linear-gradient(90deg,transparent,transparent_11px,color-mix(in_srgb,var(--tt-line)_55%,transparent)_12px)]"
            aria-hidden
          />

          {ZONES.map((zone) => (
            <div
              key={zone.id}
              className="absolute border border-foam/25 bg-panel/80"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.w}%`,
                height: `${zone.h}%`,
              }}
            >
              <p className="px-1.5 pt-1 text-[0.58rem] font-bold uppercase tracking-[0.08em] text-mute">
                {zone.label}
              </p>
            </div>
          ))}

          {markers.map((marker) => (
            <button
              key={marker.device.id}
              type="button"
              title={marker.device.hostname || marker.device.ipAddress}
              onClick={() => setSelectedId(marker.device.id)}
              className={[
                'absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 border border-panel shadow-sm transition',
                marker.device.isOnline ? 'bg-signal' : 'bg-mute',
                selectedId === marker.device.id ? 'scale-150 ring-2 ring-foam' : '',
              ].join(' ')}
              style={{ left: `${marker.left}%`, top: `${marker.top}%` }}
              aria-label={marker.device.hostname || marker.device.ipAddress}
            />
          ))}
        </div>
      </div>

      {selected ? (
        <div className="bank-card px-4 py-3 text-sm">
          <p className="font-display font-bold tracking-[-0.02em]">
            {selected.hostname || selected.ipAddress}
          </p>
          <p className="mt-1 text-mute">
            {selected.ipAddress}
            {selected.macAddress ? ` · ${selected.macAddress}` : ''}
          </p>
          <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-mute">
            Zona estimada · {inferZoneId(selected)} · {selected.isOnline ? 'En línea' : 'Fuera'}
          </p>
        </div>
      ) : (
        <p className="text-sm text-mute">Tocá un punto del croquis para ver el detalle.</p>
      )}
    </div>
  )
}
