import { Link } from 'react-router-dom'
import type { InventoryAsset } from '../../inventory/types'
import { AssetPoster } from './AssetPoster'

type AssetRowProps = {
  title: string
  items: InventoryAsset[]
  seeAllTo: string
}

export function AssetRow({ title, items, seeAllTo }: AssetRowProps) {
  if (items.length === 0) return null

  return (
    <section className="mt-7 md:mt-9">
      <div className="mb-3 flex items-end justify-between gap-3 px-4 md:px-8">
        <div>
          <p className="bank-section-title">Cartera</p>
          <h3 className="mt-1 font-display text-lg font-bold tracking-[-0.03em] md:text-xl">
            {title}
          </h3>
        </div>
        <Link
          to={seeAllTo}
          className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-signal hover:underline"
        >
          Ver todo
        </Link>
      </div>

      <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:gap-4 md:px-8">
        {items.map((asset) => (
          <AssetPoster key={`${title}-${asset.id}`} asset={asset} />
        ))}
      </div>
    </section>
  )
}
