import { classDevices } from '../homeLists/schedule'
import type {
  ClassSessionArchive,
  ConnectedDeviceSighting,
  HomeList,
} from '../homeLists/types'
import { parseHardwareProfile } from '../types/network'
import {
  computeCompleteness,
  type AssetStatus,
  type InventoryAsset,
  type InventoryComponent,
} from './types'

/** Datos que el colegio llena en Activos (se guardan localmente). */
export type AssetOverlay = {
  displayName?: string
  code?: string
  category?: string
  brand?: string
  model?: string
  location?: string
  serialNumber?: string
  responsible?: string
  notes?: string
  status?: AssetStatus
  components?: InventoryComponent[]
}

type SightingHit = {
  device: ConnectedDeviceSighting
  className: string
  classDate: string
}

function normalizeMac(mac: string | null | undefined): string | null {
  if (!mac) return null
  const hex = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase()
  return hex.length >= 12 ? hex.slice(0, 12) : null
}

export function deviceInventoryKey(device: ConnectedDeviceSighting): string {
  const mac = normalizeMac(device.macAddress)
  if (mac) return `mac-${mac}`
  return `dev-${device.id}`
}

function formatMac(hex: string): string {
  return hex.match(/.{1,2}/g)?.join(':') ?? hex
}

function toneForKey(key: string): string {
  const tones = [
    'linear-gradient(135deg, #1a3a2a 0%, #0d1f16 45%, #121212 100%)',
    'linear-gradient(145deg, #1e2a3a 0%, #121820 55%, #0a0a0a 100%)',
    'linear-gradient(145deg, #3a2a1a 0%, #1c140c 55%, #0a0a0a 100%)',
    'linear-gradient(145deg, #2a1a3a 0%, #160e1c 55%, #0a0a0a 100%)',
  ]
  let h = 0
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return tones[h % tones.length]!
}

function collectHits(lists: HomeList[], archives: ClassSessionArchive[]): SightingHit[] {
  const hits: SightingHit[] = []
  for (const archive of archives) {
    for (const device of archive.devices) {
      hits.push({ device, className: archive.name, classDate: archive.classDate })
    }
  }
  for (const list of lists) {
    for (const device of classDevices(list)) {
      hits.push({ device, className: list.name, classDate: list.classDate })
    }
  }
  return hits
}

function inferStatus(lastSeenAt: string): AssetStatus {
  const last = new Date(lastSeenAt).getTime()
  if (Number.isNaN(last)) return 'OutOfService'
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24)
  if (days <= 14) return 'Operational'
  if (days <= 45) return 'InMaintenance'
  return 'OutOfService'
}

function mergeComponents(
  fromPresence: InventoryComponent[],
  fromOverlay: InventoryComponent[] | undefined,
): InventoryComponent[] {
  if (fromOverlay && fromOverlay.length > 0) return fromOverlay
  return fromPresence
}

export function compileInventoryFromHistory(
  lists: HomeList[],
  archives: ClassSessionArchive[],
  overlays: Record<string, AssetOverlay> = {},
  manualAssets: InventoryAsset[] = [],
): InventoryAsset[] {
  const hits = collectHits(lists, archives)
  const byKey = new Map<
    string,
    {
      key: string
      deviceId: string
      hostname: string | null
      ipAddress: string
      macAddress: string | null
      vendor: string | null
      osVersion: string | null
      hardwareProfileJson: string | null
      firstSeenAt: string
      lastSeenAt: string
      timesSeen: number
      classes: Map<string, { name: string; date: string }>
    }
  >()

  for (const hit of hits) {
    const key = deviceInventoryKey(hit.device)
    const prev = byKey.get(key)
    const mac = normalizeMac(hit.device.macAddress)

    if (!prev) {
      byKey.set(key, {
        key,
        deviceId: hit.device.id,
        hostname: hit.device.hostname,
        ipAddress: hit.device.ipAddress,
        macAddress: mac ? formatMac(mac) : hit.device.macAddress ?? null,
        vendor: hit.device.vendor ?? null,
        osVersion: hit.device.osVersion ?? null,
        hardwareProfileJson: hit.device.hardwareProfileJson ?? null,
        firstSeenAt: hit.device.firstSeenAt,
        lastSeenAt: hit.device.lastSeenAt,
        timesSeen: 1,
        classes: new Map([
          [`${hit.className}|${hit.classDate}`, { name: hit.className, date: hit.classDate }],
        ]),
      })
      continue
    }

    prev.timesSeen += 1
    prev.classes.set(`${hit.className}|${hit.classDate}`, {
      name: hit.className,
      date: hit.classDate,
    })
    if (hit.device.lastSeenAt > prev.lastSeenAt) {
      prev.lastSeenAt = hit.device.lastSeenAt
      prev.hostname = hit.device.hostname ?? prev.hostname
      prev.ipAddress = hit.device.ipAddress || prev.ipAddress
      prev.vendor = hit.device.vendor ?? prev.vendor
      prev.osVersion = hit.device.osVersion ?? prev.osVersion
      prev.hardwareProfileJson =
        hit.device.hardwareProfileJson ?? prev.hardwareProfileJson
      if (hit.device.macAddress) {
        const m = normalizeMac(hit.device.macAddress)
        prev.macAddress = m ? formatMac(m) : hit.device.macAddress
      }
    }
    if (hit.device.firstSeenAt < prev.firstSeenAt) {
      prev.firstSeenAt = hit.device.firstSeenAt
    }
  }

  const discovered: InventoryAsset[] = [...byKey.values()].map((row) => {
    const overlay = overlays[row.key] ?? {}
    const classList = [...row.classes.values()].sort((a, b) => b.date.localeCompare(a.date))
    const lastClass = classList[0]
    const macHex = normalizeMac(row.macAddress)
    const defaultCode = macHex
      ? `MAC-${macHex.slice(-6)}`
      : `EQ-${row.deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`
    const defaultName =
      row.hostname?.trim() || (row.macAddress ? `Equipo ${row.macAddress}` : defaultCode)
    const presenceComponents = parseHardwareProfile(row.hardwareProfileJson)
    const components = mergeComponents(presenceComponents, overlay.components)

    const draft = {
      code: overlay.code?.trim() || defaultCode,
      name: overlay.displayName?.trim() || defaultName,
      category: overlay.category?.trim() || (row.osVersion ? 'Computadoras' : 'Equipo de red'),
      brand: overlay.brand?.trim() || row.vendor?.trim() || 'Desconocido',
      model: overlay.model?.trim() || '',
      serialNumber: overlay.serialNumber?.trim() || row.macAddress || row.deviceId,
      location: overlay.location?.trim() || lastClass?.name || 'Sin clase registrada',
      status: overlay.status ?? inferStatus(row.lastSeenAt),
    }

    return {
      id: row.key,
      ...draft,
      responsible: overlay.responsible?.trim() || '',
      notes: overlay.notes ?? '',
      tone: toneForKey(row.key),
      updatedAt: overlay.code || overlay.displayName ? new Date().toISOString() : row.lastSeenAt,
      isManual: false,
      macAddress: row.macAddress,
      ipAddress: row.ipAddress,
      osVersion: row.osVersion,
      hardwareProfileJson: row.hardwareProfileJson,
      components,
      timesSeen: row.timesSeen,
      classCount: classList.length,
      firstSeenAt: row.firstSeenAt,
      lastSeenAt: row.lastSeenAt,
      presenceDeviceId: row.deviceId,
      classHistory: classList,
      completeness: computeCompleteness(draft),
    }
  })

  const discoveredIds = new Set(discovered.map((a) => a.id))
  const manuals = manualAssets
    .filter((a) => !discoveredIds.has(a.id))
    .map((a) => {
      const overlay = overlays[a.id] ?? {}
      const draft = {
        code: overlay.code?.trim() || a.code,
        name: overlay.displayName?.trim() || a.name,
        category: overlay.category?.trim() || a.category,
        brand: overlay.brand?.trim() || a.brand,
        model: overlay.model?.trim() || a.model,
        serialNumber: overlay.serialNumber?.trim() || a.serialNumber,
        location: overlay.location?.trim() || a.location,
        status: overlay.status ?? a.status,
      }
      return {
        ...a,
        ...draft,
        responsible: overlay.responsible?.trim() ?? a.responsible,
        notes: overlay.notes ?? a.notes,
        components: overlay.components ?? a.components,
        isManual: true,
        completeness: computeCompleteness(draft),
        updatedAt: a.updatedAt,
      }
    })

  return [...manuals, ...discovered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
