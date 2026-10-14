import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchNetworkDevices } from '../api/network'
import { useHomeLists } from './HomeListsContext'

/** Mientras la app esté abierta, llena las listas cuya ventana horaria esté activa. */
export function HomeListPresenceSync() {
  const { ingestPresence } = useHomeLists()
  const query = useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchNetworkDevices,
    refetchInterval: 10_000,
  })

  useEffect(() => {
    if (query.data) ingestPresence(query.data)
  }, [query.data, ingestPresence])

  useEffect(() => {
    const id = window.setInterval(() => {
      void query.refetch()
    }, 60_000)
    return () => window.clearInterval(id)
  }, [query])

  return null
}
