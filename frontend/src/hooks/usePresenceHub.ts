import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useEffect, useRef, useState } from 'react'
import type { NetworkDevice } from '../types/network'

function resolveHubUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (apiBase) {
    return `${apiBase.replace(/\/$/, '')}/hubs/presence`
  }
  return '/hubs/presence'
}

export function usePresenceHub(
  onUpsert: (device: NetworkDevice) => void,
  onOffline: (device: NetworkDevice) => void,
) {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>(
    'connecting',
  )
  const upsertRef = useRef(onUpsert)
  const offlineRef = useRef(onOffline)
  upsertRef.current = onUpsert
  offlineRef.current = onOffline

  useEffect(() => {
    let cancelled = false
    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(resolveHubUrl())
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('deviceUpserted', (device: NetworkDevice) => {
      upsertRef.current(device)
    })
    connection.on('deviceOffline', (device: NetworkDevice) => {
      offlineRef.current(device)
    })

    const syncState = () => {
      if (cancelled) return
      if (connection.state === HubConnectionState.Connected) {
        setConnectionState('connected')
      } else if (connection.state === HubConnectionState.Disconnected) {
        setConnectionState('disconnected')
      } else {
        setConnectionState('connecting')
      }
    }

    connection.onreconnecting(() => setConnectionState('connecting'))
    connection.onreconnected(() => setConnectionState('connected'))
    connection.onclose(() => setConnectionState('disconnected'))

    void (async () => {
      try {
        await connection.start()
        if (!cancelled) {
          setConnectionState('connected')
        }
      } catch {
        if (!cancelled) {
          setConnectionState('disconnected')
        }
      }
    })()

    syncState()

    return () => {
      cancelled = true
      void connection.stop()
    }
  }, [])

  return connectionState
}
