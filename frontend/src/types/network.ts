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
}
