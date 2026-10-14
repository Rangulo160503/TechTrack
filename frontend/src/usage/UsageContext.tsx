import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { NetworkDevice } from '../types/network'
import { isLocalToday, type ClassUsageSession, type UsageSnapshot, type UsageSnapshotDevice } from './types'

const STORAGE_KEY = 'techtrack.usage.v1'

type UsageContextValue = {
  sessions: ClassUsageSession[]
  activeSessions: ClassUsageSession[]
  sessionsToday: ClassUsageSession[]
  getSession: (id: string) => ClassUsageSession | undefined
  startSession: (input: {
    title: string
    location: string
    devices: NetworkDevice[]
  }) => ClassUsageSession
  captureSnapshot: (sessionId: string, devices: NetworkDevice[]) => UsageSnapshot
  endSession: (sessionId: string) => void
}

const UsageContext = createContext<UsageContextValue | null>(null)

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function toSnapshotDevices(devices: NetworkDevice[]): UsageSnapshotDevice[] {
  return devices
    .filter((d) => d.isOnline)
    .map((d) => ({
      id: d.id,
      hostname: d.hostname,
      ipAddress: d.ipAddress,
    }))
}

function buildSnapshot(devices: NetworkDevice[]): UsageSnapshot {
  const online = toSnapshotDevices(devices)
  return {
    id: newId('snap'),
    capturedAt: new Date().toISOString(),
    onlineCount: online.length,
    devices: online,
  }
}

function loadSessions(): ClassUsageSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClassUsageSession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function UsageProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ClassUsageSession[]>(() => loadSessions())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions])

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions],
  )

  const startSession = useCallback(
    (input: { title: string; location: string; devices: NetworkDevice[] }) => {
      const first = buildSnapshot(input.devices)
      const session: ClassUsageSession = {
        id: newId('class'),
        title: input.title.trim(),
        location: input.location.trim(),
        startedAt: new Date().toISOString(),
        snapshots: [first],
      }
      setSessions((prev) => [session, ...prev])
      return session
    },
    [],
  )

  const captureSnapshot = useCallback((sessionId: string, devices: NetworkDevice[]) => {
    const snap = buildSnapshot(devices)
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId || s.endedAt) return s
        return { ...s, snapshots: [...s.snapshots, snap] }
      }),
    )
    return snap
  }, [])

  const endSession = useCallback((sessionId: string) => {
    const endedAt = new Date().toISOString()
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId && !s.endedAt ? { ...s, endedAt } : s)),
    )
  }, [])

  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.endedAt),
    [sessions],
  )

  const sessionsToday = useMemo(
    () => sessions.filter((s) => isLocalToday(s.startedAt)),
    [sessions],
  )

  const value = useMemo<UsageContextValue>(
    () => ({
      sessions,
      activeSessions,
      sessionsToday,
      getSession,
      startSession,
      captureSnapshot,
      endSession,
    }),
    [
      sessions,
      activeSessions,
      sessionsToday,
      getSession,
      startSession,
      captureSnapshot,
      endSession,
    ],
  )

  return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>
}

export function useUsage(): UsageContextValue {
  const ctx = useContext(UsageContext)
  if (!ctx) throw new Error('useUsage must be used within UsageProvider')
  return ctx
}
