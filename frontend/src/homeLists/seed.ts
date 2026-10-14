import { localDateKey } from './schedule'
import type { HomeList } from './types'

const now = () => new Date().toISOString()
const today = () => localDateKey()

/** Ejemplos del día; Presence llena conexiones solo en esa fecha + franja. */
export function buildSeedHomeLists(): HomeList[] {
  const classDate = today()
  const stamped = now()
  return [
    {
      id: 'list-es',
      name: 'Español',
      classDate,
      startTime: '10:00',
      endTime: '11:00',
      days: [],
      createdAt: stamped,
      updatedAt: stamped,
    },
    {
      id: 'list-en',
      name: 'Inglés',
      classDate,
      startTime: '14:00',
      endTime: '15:00',
      days: [],
      createdAt: stamped,
      updatedAt: stamped,
    },
    {
      id: 'list-5pm',
      name: 'Clase de las 5 pm',
      classDate,
      startTime: '17:00',
      endTime: '18:00',
      days: [],
      createdAt: stamped,
      updatedAt: stamped,
    },
  ]
}
