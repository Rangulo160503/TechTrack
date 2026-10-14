import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  addDaysToKey,
  currentHourSlot,
  formatCurrentHourSlotLabel,
  localDateKey,
} from '../../homeLists/schedule'
import { NAME_SUGGESTIONS, TIME_SUGGESTIONS } from '../../homeLists/types'

type CreateListSheetProps = {
  open: boolean
  onClose: () => void
  onCreate: (input: {
    name: string
    classDate: string
    startTime: string
    endTime: string
  }) => void
}

export function CreateListSheet({ open, onClose, onCreate }: CreateListSheetProps) {
  const [name, setName] = useState('')
  const [classDate, setClassDate] = useState(localDateKey())
  const [startTime, setStartTime] = useState('17:00')
  const [endTime, setEndTime] = useState('18:00')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setClassDate(localDateKey())
    setStartTime('17:00')
    setEndTime('18:00')
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open) return null

  const today = localDateKey()
  const tomorrow = addDaysToKey(today, 1)
  const hourSlot = currentHourSlot()
  const isCurrentHour =
    startTime === hourSlot.startTime && endTime === hourSlot.endTime

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !classDate || !startTime || !endTime) return
    onCreate({ name: trimmed, classDate, startTime, endTime })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="create-list-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md border border-line bg-panel shadow-lg sm:mx-4">
        <div className="border-b border-line px-5 py-4">
          <p className="bank-section-title">Nueva clase</p>
          <h2
            id="create-list-title"
            className="mt-1 font-display text-xl font-bold tracking-[-0.03em]"
          >
            Fecha, nombre y horario
          </h2>
          <p className="mt-1 text-sm text-mute">
            Elegí el día en el calendario. Presence solo cuenta conexiones en esa fecha y franja.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <label>
            <span className="field-label">Fecha</span>
            <input
              type="date"
              className="field"
              value={classDate}
              required
              onChange={(e) => setClassDate(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={[
                'border border-line px-3 py-1.5 text-sm font-medium transition',
                classDate === today
                  ? 'border-signal bg-ledger text-foam'
                  : 'bg-stage text-mute hover:border-signal hover:text-foam',
              ].join(' ')}
              onClick={() => setClassDate(today)}
            >
              Hoy
            </button>
            <button
              type="button"
              className={[
                'border border-line px-3 py-1.5 text-sm font-medium transition',
                classDate === tomorrow
                  ? 'border-signal bg-ledger text-foam'
                  : 'bg-stage text-mute hover:border-signal hover:text-foam',
              ].join(' ')}
              onClick={() => setClassDate(tomorrow)}
            >
              Mañana
            </button>
          </div>

          <label>
            <span className="field-label">Nombre</span>
            <input
              ref={inputRef}
              className="field text-lg font-semibold"
              value={name}
              placeholder="Ej. Clase de las 5 pm"
              maxLength={48}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </label>

          <div>
            <p className="field-label mb-2">Sugerencias de nombre</p>
            <div className="flex flex-wrap gap-2">
              {NAME_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={[
                    'border border-line px-3 py-1.5 text-sm font-medium transition',
                    name === suggestion
                      ? 'border-signal bg-ledger text-foam'
                      : 'bg-stage text-mute hover:border-signal hover:text-foam',
                  ].join(' ')}
                  onClick={() => setName(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label mb-2">Horario</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={[
                  'border border-line px-3 py-1.5 text-sm font-medium transition',
                  isCurrentHour
                    ? 'border-signal bg-ledger text-foam'
                    : 'bg-stage text-mute hover:border-signal hover:text-foam',
                ].join(' ')}
                onClick={() => {
                  const slot = currentHourSlot()
                  setClassDate(localDateKey())
                  setStartTime(slot.startTime)
                  setEndTime(slot.endTime)
                }}
              >
                {formatCurrentHourSlotLabel()}
              </button>
              {TIME_SUGGESTIONS.map((slot) => (
                <button
                  key={slot.label}
                  type="button"
                  className={[
                    'border border-line px-3 py-1.5 text-sm font-medium transition',
                    startTime === slot.start && endTime === slot.end
                      ? 'border-signal bg-ledger text-foam'
                      : 'bg-stage text-mute hover:border-signal hover:text-foam',
                  ].join(' ')}
                  onClick={() => {
                    setStartTime(slot.start)
                    setEndTime(slot.end)
                  }}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="field-label">Desde</span>
              <input
                type="time"
                className="field"
                value={startTime}
                required
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">Hasta</span>
              <input
                type="time"
                className="field"
                value={endTime}
                required
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-signal" disabled={!name.trim() || !classDate}>
              Crear clase
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
