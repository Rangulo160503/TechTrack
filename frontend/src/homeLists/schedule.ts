import type {
  ClassSessionArchive,
  ClassCloseReason,
  ConnectedDeviceSighting,
  HomeList,
  HomeListDay,
} from './types'

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y!, m! - 1, d!)
  dt.setDate(dt.getDate() + days)
  return localDateKey(dt)
}

/** Minutos desde medianoche local. */
export function minutesFromHm(hm: string): number {
  const [h, m] = hm.split(':').map((p) => Number(p))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

export function isListActiveNow(list: HomeList, now = new Date()): boolean {
  if (list.classDate !== localDateKey(now)) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  const start = minutesFromHm(list.startTime)
  const end = minutesFromHm(list.endTime)
  if (end <= start) {
    return mins >= start || mins < end
  }
  return mins >= start && mins < end
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`
}

/** Franja de la hora en curso: 9:15 → 09:00–10:00. */
export function currentHourSlot(now = new Date()): { startTime: string; endTime: string } {
  const hour = now.getHours()
  const startTime = `${String(hour).padStart(2, '0')}:00`
  const endTime = `${String((hour + 1) % 24).padStart(2, '0')}:00`
  return { startTime, endTime }
}

export function formatCurrentHourSlotLabel(now = new Date()): string {
  const { startTime, endTime } = currentHourSlot(now)
  return `Esta hora (${formatTimeRange(startTime, endTime)})`
}

export function formatClassDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return dateKey
  try {
    return new Intl.DateTimeFormat('es-CR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(y, m - 1, d))
  } catch {
    return dateKey
  }
}

export function classDevices(list: HomeList): ConnectedDeviceSighting[] {
  return list.days.find((d) => d.date === list.classDate)?.devices ?? []
}

export function onlineClassDevices(list: HomeList): ConnectedDeviceSighting[] {
  return classDevices(list).filter((d) => d.isOnline !== false)
}

/**
 * Sincroniza con Presence: alta/actualiza online y marca offline a los que ya no están.
 * No borra el historial de la clase (siguen como isOnline: false).
 */
export type OnlineSightingInput = {
  id: string
  hostname: string | null
  ipAddress: string
  macAddress?: string | null
  vendor?: string | null
  osVersion?: string | null
  hardwareProfileJson?: string | null
}

export function reconcileSightings(
  existing: ConnectedDeviceSighting[],
  online: OnlineSightingInput[],
  atIso: string,
): ConnectedDeviceSighting[] {
  const onlineIds = new Set(online.map((d) => d.id))
  const map = new Map(
    existing.map((d) => [
      d.id,
      {
        ...d,
        isOnline: d.isOnline !== false,
      },
    ]),
  )

  for (const device of online) {
    const prev = map.get(device.id)
    if (prev) {
      map.set(device.id, {
        ...prev,
        hostname: device.hostname ?? prev.hostname,
        ipAddress: device.ipAddress || prev.ipAddress,
        macAddress: device.macAddress ?? prev.macAddress ?? null,
        vendor: device.vendor ?? prev.vendor ?? null,
        osVersion: device.osVersion ?? prev.osVersion ?? null,
        hardwareProfileJson:
          device.hardwareProfileJson ?? prev.hardwareProfileJson ?? null,
        lastSeenAt: atIso,
        isOnline: true,
      })
    } else {
      map.set(device.id, {
        id: device.id,
        hostname: device.hostname,
        ipAddress: device.ipAddress,
        macAddress: device.macAddress ?? null,
        vendor: device.vendor ?? null,
        osVersion: device.osVersion ?? null,
        hardwareProfileJson: device.hardwareProfileJson ?? null,
        firstSeenAt: atIso,
        lastSeenAt: atIso,
        isOnline: true,
      })
    }
  }

  for (const [id, device] of map) {
    if (!onlineIds.has(id) && device.isOnline) {
      map.set(id, { ...device, isOnline: false })
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
    return b.lastSeenAt.localeCompare(a.lastSeenAt)
  })
}

export function upsertClassDevices(
  days: HomeListDay[],
  classDate: string,
  devices: ConnectedDeviceSighting[],
  keepDays = 14,
): HomeListDay[] {
  const without = days.filter((d) => d.date !== classDate)
  const next = [{ date: classDate, devices }, ...without]
  return next.sort((a, b) => b.date.localeCompare(a.date)).slice(0, keepDays)
}

export function occurrenceKey(list: Pick<HomeList, 'id' | 'classDate' | 'startTime' | 'endTime'>): string {
  return `${list.id}|${list.classDate}|${list.startTime}|${list.endTime}`
}

export function peakOnlineCount(devices: ConnectedDeviceSighting[]): number {
  const online = devices.filter((d) => d.isOnline !== false).length
  return Math.max(online, 0)
}

export function buildArchiveFromList(
  list: HomeList,
  reason: ClassCloseReason,
  closedAt = new Date().toISOString(),
): ClassSessionArchive | null {
  const devices = classDevices(list)
  if (devices.length === 0) return null
  const frozen = devices.map((d) => ({ ...d, isOnline: false }))
  return {
    id: `arch-${crypto.randomUUID().slice(0, 8)}`,
    occurrenceKey: occurrenceKey(list),
    sourceListId: list.id,
    name: list.name,
    classDate: list.classDate,
    startTime: list.startTime,
    endTime: list.endTime,
    closedAt,
    closeReason: reason,
    devices: frozen,
    peakOnline: Math.max(
      peakOnlineCount(devices),
      devices.length > 0 ? 1 : 0,
    ),
    totalSeen: devices.length,
  }
}

/** ¿La franja de hoy ya terminó? (misma fecha, hora actual >= fin) */
export function isWindowPastEnd(list: HomeList, now = new Date()): boolean {
  if (list.classDate !== localDateKey(now)) {
    // Fecha distinta: si la fecha de la clase ya pasó, la ventana terminó.
    return list.classDate < localDateKey(now)
  }
  const mins = now.getHours() * 60 + now.getMinutes()
  const end = minutesFromHm(list.endTime)
  const start = minutesFromHm(list.startTime)
  if (end <= start) {
    // Cruza medianoche: terminó cuando ya pasó end y aún no es start del día siguiente… simplificado:
    return mins >= end && mins < start
  }
  return mins >= end
}
