import { useEffect, useRef, useState } from 'react'
import type { ConnectedDeviceSighting } from '../../homeLists/types'
import { IconChevronLeft, IconChevronRight } from '../brand/Icons'
import { ConnectionPoster } from './ConnectionPoster'
import { DeviceTroubleshootSheet } from './DeviceTroubleshootSheet'

type AssetRowProps = {
  title: string
  subtitle: string
  activeNow?: boolean
  devices: ConnectedDeviceSighting[]
  onEdit?: () => void
}

export function AssetRow({ title, subtitle, activeNow, devices, onEdit }: AssetRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const [selected, setSelected] = useState<{
    device: ConnectedDeviceSighting
    index: number
  } | null>(null)

  function updateScrollState() {
    const el = scrollerRef.current
    if (!el) {
      setCanLeft(false)
      setCanRight(false)
      return
    }
    const max = el.scrollWidth - el.clientWidth
    setCanLeft(el.scrollLeft > 4)
    setCanRight(max > 4 && el.scrollLeft < max - 4)
  }

  useEffect(() => {
    updateScrollState()
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => updateScrollState()
    el.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(() => updateScrollState())
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [devices.length, title])

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.max(Math.round(el.clientWidth * 0.8), 260)
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  const showPager = devices.length > 0

  return (
    <section className="mt-7 md:mt-9">
      <div className="mb-3 flex items-end justify-between gap-3 px-4 md:px-8">
        <div className="min-w-0">
          <p className="bank-section-title">Clase{activeNow ? ' · en curso' : ''}</p>
          <h3 className="mt-1 truncate font-display text-lg font-bold tracking-[-0.03em] md:text-xl">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-mute">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showPager ? (
            <div className="inline-flex border border-line" role="group" aria-label="Desplazar equipos">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center text-foam transition hover:bg-ledger disabled:cursor-not-allowed disabled:text-mute/40"
                aria-label="Anterior"
                disabled={!canLeft}
                onClick={() => scrollByDir(-1)}
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <span className="w-px self-stretch bg-line" aria-hidden />
              <button
                type="button"
                className="grid h-9 w-9 place-items-center text-foam transition hover:bg-ledger disabled:cursor-not-allowed disabled:text-mute/40"
                aria-label="Siguiente"
                disabled={!canRight}
                onClick={() => scrollByDir(1)}
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-signal hover:underline"
            >
              Editar
            </button>
          ) : null}
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="mx-4 max-w-md border border-dashed border-line bg-stage px-4 py-6 md:mx-8">
          <p className="font-display text-sm font-bold text-foam">
            {activeNow ? 'Esperando conexiones…' : 'Sin conexiones en esta franja hoy'}
          </p>
          <p className="mt-1 text-sm text-mute">
            {activeNow
              ? 'Las PCs que Presence detecte ahora se agregan solas a esta clase.'
              : 'Cuando sea ese día y horario, y haya equipos en la red, aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:gap-4 md:px-8"
        >
          {devices.map((device, index) => (
            <ConnectionPoster
              key={`${title}-${device.id}`}
              device={device}
              onOpen={() => setSelected({ device, index })}
            />
          ))}
        </div>
      )}

      {selected ? (
        <DeviceTroubleshootSheet
          device={selected.device}
          index={selected.index}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  )
}
