import { useMemo } from 'react'
import { useInventory } from '../inventory/InventoryContext'
import { statusLabel } from '../inventory/types'

export function ReportsPage() {
  const { assets, maintenances } = useInventory()

  const stats = useMemo(() => {
    const byStatus = {
      Operational: assets.filter((a) => a.status === 'Operational').length,
      InMaintenance: assets.filter((a) => a.status === 'InMaintenance').length,
      OutOfService: assets.filter((a) => a.status === 'OutOfService').length,
      Retired: assets.filter((a) => a.status === 'Retired').length,
    }
    return {
      total: assets.length,
      byStatus,
      openMaint: maintenances.filter((m) => m.status !== 'Completed').length,
    }
  }, [assets, maintenances])

  function exportCsv() {
    const header = ['code', 'name', 'category', 'brand', 'location', 'status', 'serialNumber']
    const rows = assets.map((a) =>
      [a.code, a.name, a.category, a.brand, a.location, a.status, a.serialNumber]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `techtrack-inventario-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 pb-4 pt-3 md:px-8 md:pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="bank-section-title">Analítica</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] md:text-[2rem]">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-mute">Indicadores del inventario tecnológico</p>
        </div>
        <button type="button" className="btn-signal" onClick={exportCsv}>
          Exportar CSV
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        <StatCard label="Total activos" value={stats.total} />
        <StatCard label="Operativos" value={stats.byStatus.Operational} />
        <StatCard label="En mantenimiento" value={stats.byStatus.InMaintenance} />
        <StatCard label="Órdenes abiertas" value={stats.openMaint} />
      </div>

      <section className="bank-card mt-6 p-4">
        <h2 className="font-display text-base font-bold tracking-[-0.02em]">Por estado</h2>
        <ul className="mt-3 space-y-3">
          {(Object.keys(stats.byStatus) as (keyof typeof stats.byStatus)[]).map((key) => {
            const value = stats.byStatus[key]
            const pct = stats.total === 0 ? 0 : Math.round((value / stats.total) * 100)
            return (
              <li key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{statusLabel[key]}</span>
                  <span className="tabular-nums text-mute">
                    {value} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden bg-ink">
                  <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-panel px-3 py-4 md:px-4">
      <p className="bank-section-title">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums tracking-[-0.03em]">{value}</p>
    </div>
  )
}
