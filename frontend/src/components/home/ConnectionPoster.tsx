import type { ConnectedDeviceSighting } from '../../homeLists/types'

type ConnectionPosterProps = {
  device: ConnectedDeviceSighting
  onOpen?: () => void
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CR', { timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function ConnectionPoster({ device, onOpen }: ConnectionPosterProps) {
  const online = device.isOnline !== false
  const className = [
    'w-[11.5rem] shrink-0 snap-start border border-line bg-panel text-left transition sm:w-[13rem] md:w-[14.5rem]',
    online ? '' : 'opacity-55',
    onOpen ? 'cursor-pointer hover:border-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal' : '',
  ].join(' ')

  const body = (
    <>
      <div className="relative h-20 border-b border-line bg-stage">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 30% 40%, var(--tt-signal), transparent 55%), linear-gradient(135deg, var(--tt-ledger), var(--tt-panel))',
          }}
          aria-hidden
        />
        <span className="absolute left-2 top-2 bg-panel/90 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-foam">
          {online ? 'En red' : 'Fuera'}
        </span>
      </div>
      <div className="space-y-1 px-3 py-3">
        <p className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-bold leading-snug tracking-[-0.02em] text-foam">
          {device.hostname || 'Equipo sin nombre'}
        </p>
        <p className="truncate text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-mute">
          {device.ipAddress}
          {device.macAddress ? ` · ${device.macAddress}` : ''}
        </p>
        <p className="truncate text-xs text-mute">
          {formatWhen(device.firstSeenAt)} → {formatWhen(device.lastSeenAt)}
        </p>
        {onOpen ? (
          <p className="pt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-signal">
            Ver ficha
          </p>
        ) : null}
      </div>
    </>
  )

  if (onOpen) {
    return (
      <button
        type="button"
        className={className}
        onClick={onOpen}
        aria-label={`Abrir ficha de ${device.hostname || device.ipAddress}`}
      >
        {body}
      </button>
    )
  }

  return <article className={className}>{body}</article>
}
