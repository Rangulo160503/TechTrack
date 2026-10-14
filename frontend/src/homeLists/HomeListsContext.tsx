import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { NetworkDevice } from '../types/network'
import {
  buildArchiveFromList,
  classDevices,
  isListActiveNow,
  isWindowPastEnd,
  localDateKey,
  occurrenceKey,
  onlineClassDevices,
  reconcileSightings,
  upsertClassDevices,
} from './schedule'
import { buildSeedHomeLists } from './seed'
import type { ClassSessionArchive, HomeList } from './types'

const STORAGE_KEY = 'techtrack.homeLists.v4'
const LEGACY_KEY = 'techtrack.homeLists.v3'

type CreateListInput = {
  name: string
  classDate: string
  startTime: string
  endTime: string
}

type HomeListsStore = {
  lists: HomeList[]
  archives: ClassSessionArchive[]
}

type HomeListsContextValue = {
  lists: HomeList[]
  archives: ClassSessionArchive[]
  createList: (input: CreateListInput) => HomeList
  updateList: (
    id: string,
    patch: Partial<Pick<HomeList, 'name' | 'classDate' | 'startTime' | 'endTime'>>,
  ) => void
  deleteList: (id: string) => void
  ingestPresence: (devices: NetworkDevice[]) => void
  getClassDevices: (list: HomeList) => ReturnType<typeof classDevices>
  getOnlineClassDevices: (list: HomeList) => ReturnType<typeof onlineClassDevices>
  isActiveNow: (list: HomeList) => boolean
  resetLists: () => void
}

const HomeListsContext = createContext<HomeListsContextValue | null>(null)

function newId(): string {
  return `list-${crypto.randomUUID().slice(0, 8)}`
}

function isValidList(value: unknown): value is HomeList {
  if (!value || typeof value !== 'object') return false
  const l = value as HomeList
  return (
    typeof l.id === 'string' &&
    typeof l.name === 'string' &&
    typeof l.classDate === 'string' &&
    typeof l.startTime === 'string' &&
    typeof l.endTime === 'string' &&
    Array.isArray(l.days)
  )
}

function isValidArchive(value: unknown): value is ClassSessionArchive {
  if (!value || typeof value !== 'object') return false
  const a = value as ClassSessionArchive
  return (
    typeof a.id === 'string' &&
    typeof a.occurrenceKey === 'string' &&
    typeof a.name === 'string' &&
    Array.isArray(a.devices)
  )
}

function appendArchive(
  archives: ClassSessionArchive[],
  archive: ClassSessionArchive | null,
): ClassSessionArchive[] {
  if (!archive) return archives
  if (archives.some((a) => a.occurrenceKey === archive.occurrenceKey)) return archives
  return [archive, ...archives].slice(0, 200)
}

function loadStore(): HomeListsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<HomeListsStore>
      if (Array.isArray(parsed.lists) && parsed.lists.every(isValidList)) {
        return {
          lists: parsed.lists,
          archives: Array.isArray(parsed.archives)
            ? parsed.archives.filter(isValidArchive)
            : [],
        }
      }
    }

    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as unknown
      if (Array.isArray(parsed) && parsed.every(isValidList)) {
        return { lists: parsed, archives: [] }
      }
    }
  } catch {
    /* fall through */
  }
  return { lists: buildSeedHomeLists(), archives: [] }
}

export function HomeListsProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<HomeListsStore>(() => loadStore())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  }, [store])

  const createList = useCallback((input: CreateListInput) => {
    const stamped = new Date().toISOString()
    const list: HomeList = {
      id: newId(),
      name: input.name.trim(),
      classDate: input.classDate || localDateKey(),
      startTime: input.startTime,
      endTime: input.endTime,
      days: [],
      createdAt: stamped,
      updatedAt: stamped,
    }
    setStore((prev) => ({ ...prev, lists: [list, ...prev.lists] }))
    return list
  }, [])

  const updateList = useCallback(
    (
      id: string,
      patch: Partial<Pick<HomeList, 'name' | 'classDate' | 'startTime' | 'endTime'>>,
    ) => {
      const stamped = new Date().toISOString()
      setStore((prev) => {
        let archives = prev.archives
        const lists = prev.lists.map((l) => {
          if (l.id !== id) return l

          const nextName = patch.name !== undefined ? patch.name.trim() || l.name : l.name
          const nextDate = patch.classDate ?? l.classDate
          const nextStart = patch.startTime ?? l.startTime
          const nextEnd = patch.endTime ?? l.endTime

          const scheduleChanged =
            nextDate !== l.classDate || nextStart !== l.startTime || nextEnd !== l.endTime

          let days = l.days
          if (scheduleChanged) {
            const archive = buildArchiveFromList(
              { ...l, name: nextName },
              'schedule_changed',
              stamped,
            )
            archives = appendArchive(archives, archive)
            // La nueva franja empieza limpia; el snapshot quedó en historial.
            days = days.filter((d) => d.date !== l.classDate)
          }

          return {
            ...l,
            name: nextName,
            classDate: nextDate,
            startTime: nextStart,
            endTime: nextEnd,
            days,
            updatedAt: stamped,
          }
        })
        return { lists, archives }
      })
    },
    [],
  )

  const deleteList = useCallback((id: string) => {
    const stamped = new Date().toISOString()
    setStore((prev) => {
      const target = prev.lists.find((l) => l.id === id)
      let archives = prev.archives
      if (target) {
        archives = appendArchive(archives, buildArchiveFromList(target, 'list_deleted', stamped))
      }
      return {
        lists: prev.lists.filter((l) => l.id !== id),
        archives,
      }
    })
  }, [])

  const ingestPresence = useCallback((devices: NetworkDevice[]) => {
    const online = devices.filter((d) => d.isOnline)
    const now = new Date()
    const atIso = now.toISOString()

    setStore((prev) => {
      let changed = false
      let archives = prev.archives
      const lists = prev.lists.map((list) => {
        // Franja terminó con datos → archivar una sola vez
        if (
          !isListActiveNow(list, now) &&
          isWindowPastEnd(list, now) &&
          classDevices(list).length > 0
        ) {
          const key = occurrenceKey(list)
          if (!archives.some((a) => a.occurrenceKey === key)) {
            archives = appendArchive(archives, buildArchiveFromList(list, 'window_ended', atIso))
            changed = true
            return {
              ...list,
              days: list.days.filter((d) => d.date !== list.classDate),
              updatedAt: atIso,
            }
          }
        }

        if (!isListActiveNow(list, now)) return list

        const current = classDevices(list)
        const merged = reconcileSightings(
          current,
          online.map((d) => ({
            id: d.id,
            hostname: d.hostname,
            ipAddress: d.ipAddress,
            macAddress: d.macAddress,
            vendor: d.vendor,
            osVersion: d.osVersion,
            hardwareProfileJson: d.hardwareProfileJson,
          })),
          atIso,
        )
        if (
          merged.length === current.length &&
          merged.every(
            (d, i) =>
              d.id === current[i]?.id &&
              d.lastSeenAt === current[i]?.lastSeenAt &&
              d.isOnline === (current[i]?.isOnline !== false) &&
              d.macAddress === current[i]?.macAddress &&
              d.osVersion === current[i]?.osVersion &&
              d.hardwareProfileJson === current[i]?.hardwareProfileJson,
          )
        ) {
          return list
        }
        changed = true
        return {
          ...list,
          days: upsertClassDevices(list.days, list.classDate, merged),
          updatedAt: atIso,
        }
      })

      if (!changed && archives === prev.archives) return prev
      return { lists, archives }
    })
  }, [])

  const getClassDevices = useCallback((list: HomeList) => classDevices(list), [])
  const getOnlineClassDevices = useCallback((list: HomeList) => onlineClassDevices(list), [])
  const isActiveNow = useCallback((list: HomeList) => isListActiveNow(list), [])

  const resetLists = useCallback(() => {
    setStore({ lists: buildSeedHomeLists(), archives: [] })
  }, [])

  const value = useMemo(
    () => ({
      lists: store.lists,
      archives: store.archives,
      createList,
      updateList,
      deleteList,
      ingestPresence,
      getClassDevices,
      getOnlineClassDevices,
      isActiveNow,
      resetLists,
    }),
    [
      store.lists,
      store.archives,
      createList,
      updateList,
      deleteList,
      ingestPresence,
      getClassDevices,
      getOnlineClassDevices,
      isActiveNow,
      resetLists,
    ],
  )

  return <HomeListsContext.Provider value={value}>{children}</HomeListsContext.Provider>
}

export function useHomeLists(): HomeListsContextValue {
  const ctx = useContext(HomeListsContext)
  if (!ctx) throw new Error('useHomeLists must be used within HomeListsProvider')
  return ctx
}
