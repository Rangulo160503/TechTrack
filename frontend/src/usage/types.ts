export type UsageSnapshotDevice = {
  id: string
  hostname: string | null
  ipAddress: string
}

export type UsageSnapshot = {
  id: string
  capturedAt: string
  onlineCount: number
  devices: UsageSnapshotDevice[]
}

export type ClassUsageSession = {
  id: string
  title: string
  location: string
  startedAt: string
  endedAt?: string
  snapshots: UsageSnapshot[]
}

export function sessionPeak(session: ClassUsageSession): number {
  if (session.snapshots.length === 0) return 0
  return Math.max(...session.snapshots.map((s) => s.onlineCount))
}

export function isLocalToday(iso: string): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}
