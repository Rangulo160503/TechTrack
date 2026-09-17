import { Link } from 'react-router-dom'
import type { InventoryAsset } from '../../inventory/types'
import { statusLabel } from '../../inventory/types'

type AssetPosterProps = {
  asset: InventoryAsset
}

export function AssetPoster({ asset }: AssetPosterProps) {
  return (
    <article className="w-[11.5rem] shrink-0 snap-start sm:w-[13rem] md:w-[14.5rem]">
      <Link
        to={`/assets/${asset.id}`}
        className="bank-card block overflow-hidden outline-none transition hover:border-signal focus-visible:ring-2 focus-visible:ring-signal"
      >
        <div
          className="relative h-24 border-b border-line"
          style={{ background: asset.tone }}
          aria-hidden
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.35))]" />
          <span className="absolute left-2 top-2 bg-panel/90 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-foam">
            {asset.category}
          </span>
        </div>
        <div className="space-y-1 px-3 py-3">
          <p className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-bold leading-snug tracking-[-0.02em] text-foam">
            {asset.name}
          </p>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-mute">
            {asset.code}
          </p>
          <p className="truncate text-xs text-mute">
            {statusLabel[asset.status]} · {asset.location}
          </p>
        </div>
      </Link>
    </article>
  )
}
