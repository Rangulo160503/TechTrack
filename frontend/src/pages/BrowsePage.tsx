import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AssetRow } from '../components/home/AssetRow'
import { CreateListSheet } from '../components/home/CreateListSheet'
import { HeroBanner } from '../components/home/HeroBanner'
import { ManageListSheet } from '../components/home/ManageListSheet'
import { useHomeLists } from '../homeLists/HomeListsContext'
import { formatClassDate, formatTimeRange } from '../homeLists/schedule'

export function BrowsePage() {
  const {
    lists,
    createList,
    updateList,
    deleteList,
    getClassDevices,
    getOnlineClassDevices,
    isActiveNow,
  } = useHomeLists()
  const [creating, setCreating] = useState(false)
  const [managingId, setManagingId] = useState<string | null>(null)

  const managing = managingId ? lists.find((l) => l.id === managingId) : undefined

  return (
    <div>
      <HeroBanner />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 pb-4 pt-6 md:px-8">
        <div>
          <p className="bank-section-title">Clases</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] md:text-2xl">
            Por fecha y horario
          </h2>
          <p className="mt-1 max-w-xl text-sm text-mute">
            Creá una clase con calendario (día + franja). Presence llena la lista solo ese día, con
            las conexiones de esa hora.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/historial-clases" className="btn-secondary">
            Historial de clases
          </Link>
          <button type="button" className="btn-signal" onClick={() => setCreating(true)}>
            Nueva clase
          </button>
        </div>
      </div>

      <div className="pb-4">
        {lists.length === 0 ? (
          <div className="mx-4 mt-8 max-w-md border border-dashed border-line bg-stage px-5 py-8 md:mx-8">
            <p className="font-display text-lg font-bold tracking-[-0.02em]">Todavía no hay clases</p>
            <p className="mt-2 text-sm text-mute">
              Definí fecha, nombre y horario. Presence se encarga cuando haya PCs en la red.
            </p>
            <button type="button" className="btn-signal mt-5" onClick={() => setCreating(true)}>
              Crear clase
            </button>
          </div>
        ) : (
          lists.map((list) => {
            const online = getOnlineClassDevices(list)
            const seen = getClassDevices(list).length
            const active = isActiveNow(list)
            return (
              <AssetRow
                key={list.id}
                title={list.name}
                subtitle={`${formatClassDate(list.classDate)} · ${formatTimeRange(list.startTime, list.endTime)} · ${online.length} en línea${seen > online.length ? ` · ${seen} vistos` : ''}`}
                activeNow={active}
                devices={getClassDevices(list)}
                onEdit={() => setManagingId(list.id)}
              />
            )
          })
        )}
      </div>

      <CreateListSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(input) => {
          createList(input)
        }}
      />

      {managing ? (
        <ManageListSheet
          key={managing.id}
          list={managing}
          classDevices={getClassDevices(managing)}
          activeNow={isActiveNow(managing)}
          onClose={() => setManagingId(null)}
          onSave={(patch) => updateList(managing.id, patch)}
          onDelete={() => deleteList(managing.id)}
        />
      ) : null}
    </div>
  )
}
