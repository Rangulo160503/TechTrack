export type NetworkDevice = {
  id: string
  ipAddress: string
  macAddress: string | null
  hostname: string | null
  vendor: string | null
  firstSeenAt: string
  lastSeenAt: string
  isOnline: boolean
  lastSeenByAgentId: string
  osVersion?: string | null
  hardwareProfileJson?: string | null
}

export type HardwareComponent = {
  category: string
  name: string
  detail: string
}

export function parseHardwareProfile(json: string | null | undefined): HardwareComponent[] {
  if (!json) return []
  try {
    const raw = JSON.parse(json) as Array<{
      category?: string
      Category?: string
      name?: string
      Name?: string
      detail?: string
      Detail?: string
    }>
    if (!Array.isArray(raw)) return []
    return raw.map((row) => ({
      category: row.category ?? row.Category ?? 'General',
      name: row.name ?? row.Name ?? 'Componente',
      detail: row.detail ?? row.Detail ?? '',
    }))
  } catch {
    return []
  }
}
