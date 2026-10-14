export type ConnectedDeviceSighting = {
  id: string
  hostname: string | null
  ipAddress: string
  firstSeenAt: string
  lastSeenAt: string
  /** false = visto en la clase pero ya no responde / no está en Presence online */
  isOnline: boolean
  macAddress?: string | null
  vendor?: string | null
  osVersion?: string | null
  hardwareProfileJson?: string | null
}

export type HomeListDay = {
  /** Fecha local YYYY-MM-DD */
  date: string
  devices: ConnectedDeviceSighting[]
}

/** Lista = clase con fecha + horario. Los equipos llegan solos vía Presence en esa ventana. */
export type HomeList = {
  id: string
  name: string
  /** Fecha calendario local YYYY-MM-DD */
  classDate: string
  /** HH:mm local */
  startTime: string
  /** HH:mm local */
  endTime: string
  days: HomeListDay[]
  createdAt: string
  updatedAt: string
}

/** Motivo por el que se congeló una interacción (no se borra). */
export type ClassCloseReason =
  | 'schedule_changed'
  | 'window_ended'
  | 'list_deleted'
  | 'manual'

/**
 * Instantánea inmutable de una clase ya cerrada.
 * Sobrevive a editar fecha/hora o borrar la lista viva.
 */
export type ClassSessionArchive = {
  id: string
  /** Clave única de esa ocurrencia (lista+fecha+horario) para no duplicar. */
  occurrenceKey: string
  sourceListId: string
  name: string
  classDate: string
  startTime: string
  endTime: string
  closedAt: string
  closeReason: ClassCloseReason
  devices: ConnectedDeviceSighting[]
  peakOnline: number
  totalSeen: number
}

export const closeReasonLabel: Record<ClassCloseReason, string> = {
  schedule_changed: 'Horario o fecha editados',
  window_ended: 'Franja horaria terminó',
  list_deleted: 'Clase eliminada',
  manual: 'Cerrada manualmente',
}

export const NAME_SUGGESTIONS = [
  'Español',
  'Inglés',
  'Matemáticas',
  'Clase de las 5 pm',
  'Lab. Informática 1',
  'Lab. Informática 2',
] as const

export const TIME_SUGGESTIONS = [
  { start: '07:00', end: '08:00', label: '7:00' },
  { start: '08:00', end: '09:00', label: '8:00' },
  { start: '10:00', end: '11:00', label: '10:00' },
  { start: '13:00', end: '14:00', label: '1:00 pm' },
  { start: '14:00', end: '15:00', label: '2:00 pm' },
  { start: '15:00', end: '16:00', label: '3:00 pm' },
  { start: '17:00', end: '18:00', label: '5:00 pm' },
] as const
