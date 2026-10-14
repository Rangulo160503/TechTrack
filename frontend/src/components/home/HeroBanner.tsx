import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchNetworkDevices } from '../../api/network'
import { useHomeLists } from '../../homeLists/HomeListsContext'
import { useInventory } from '../../inventory/InventoryContext'
import { useUsage } from '../../usage/UsageContext'
import { isLocalToday } from '../../usage/types'

export function HeroBanner() {
  const { assets } = useInventory()
  const { archives } = useHomeLists()
  const { activeSessions, sessionsToday } = useUsage()
  const devicesQuery = useQuery({
    queryKey: ['network-devices'],
    queryFn: fetchNetworkDevices,
    refetchInterval: 30_000,
  })

  const onlineDevices = (devicesQuery.data ?? []).filter((d) => d.isOnline).length
  const seenToday = assets.filter((a) => a.lastSeenAt && isLocalToday(a.lastSeenAt)).length

  const rows: { label: string; value: string; to: string }[] = [
    {
      label: 'Clases en uso ahora',
      value: String(activeSessions.length),
      to: '/usos?active=1',
    },
    {
      label: 'Sesiones de uso hoy',
      value: String(sessionsToday.length),
      to: '/usos',
    },
    {
      label: 'Equipos en vivo',
      value: devicesQuery.isLoading && !devicesQuery.data ? '…' : String(onlineDevices),
      to: '/live',
    },
    {
      label: 'Inventario de activos',
      value: String(assets.length),
      to: '/assets',
    },
    {
      label: 'Vistos hoy en inventario',
      value: String(seenToday),
      to: '/assets?updatedToday=1',
    },
    {
      label: 'Historial de clases',
      value: String(archives.length),
      to: '/historial-clases',
    },
  ]

  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-panel">
      <div
        className="pointer-events-none absolute right-[-8%] top-[-30%] h-[140%] w-[48%] opacity-[0.22]"
        style={{
          background: 'url(/brand/liquid-core.jpg) center / cover no-repeat',
          filter: 'blur(28px) saturate(1.1)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 70%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,var(--tt-panel)_0%,var(--tt-panel)_52%,transparent_82%)]"
        aria-hidden
      />

      <div className="relative grid gap-8 px-4 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-end md:px-8 md:py-12">
        <div className="max-w-2xl">
          <h2 className="font-display text-[2.1rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-foam md:text-[3.25rem]">
            TechTrack
          </h2>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-mute md:text-base">
            Inventario tecnológico del CTP Santa Eulalia: Presence llena las clases; el Historial
            recompila los activos reales.
          </p>
        </div>

        <div>
          <p className="bank-section-title mb-3">Resumen del día</p>
          <ul className="divide-y divide-line border border-line bg-panel/80 backdrop-blur-sm">
            {rows.map((row) => (
              <li key={row.label}>
                <Link
                  to={row.to}
                  className="flex items-baseline justify-between gap-3 px-3.5 py-2.5 transition hover:bg-ledger"
                >
                  <span className="text-sm text-mute">{row.label}</span>
                  <span className="font-display text-base font-bold tracking-[-0.02em] text-foam">
                    {row.value}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
