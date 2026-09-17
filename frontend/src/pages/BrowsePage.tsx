import { useInventory } from '../inventory/InventoryContext'
import { AssetRow } from '../components/home/AssetRow'
import { HeroBanner } from '../components/home/HeroBanner'

export function BrowsePage() {
  const { rows } = useInventory()

  return (
    <div>
      <HeroBanner />
      <div className="pb-2">
        {rows.map((row) => (
          <AssetRow
            key={row.title}
            title={row.title}
            items={row.items}
            seeAllTo={
              row.title === 'En mantenimiento'
                ? '/assets?status=InMaintenance'
                : row.title.includes('Lab')
                  ? '/assets?location=Lab'
                  : '/assets'
            }
          />
        ))}
      </div>
    </div>
  )
}
