import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { featuredAssetId, homeRows, seedAssets, seedMaintenances } from './seed'
import type {
  AssetStatus,
  InventoryAsset,
  MaintenancePriority,
  MaintenanceRecord,
  MaintenanceType,
} from './types'

const STORAGE_KEY = 'techtrack.inventory.v1'

type InventoryState = {
  assets: InventoryAsset[]
  maintenances: MaintenanceRecord[]
}

type CreateAssetInput = {
  code: string
  name: string
  category: string
  brand: string
  location: string
  serialNumber: string
  notes?: string
  status?: AssetStatus
}

type CreateMaintenanceInput = {
  assetId: string
  type: MaintenanceType
  priority: MaintenancePriority
  title: string
  description: string
}

type InventoryContextValue = {
  assets: InventoryAsset[]
  maintenances: MaintenanceRecord[]
  featuredAsset: InventoryAsset
  rows: { title: string; items: InventoryAsset[] }[]
  getAsset: (id: string) => InventoryAsset | undefined
  searchAssets: (query: string) => InventoryAsset[]
  createAsset: (input: CreateAssetInput) => InventoryAsset
  updateAsset: (id: string, patch: Partial<InventoryAsset>) => void
  createMaintenance: (input: CreateMaintenanceInput) => MaintenanceRecord
  completeMaintenance: (id: string) => void
  resetInventory: () => void
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

function loadState(): InventoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        assets: structuredClone(seedAssets),
        maintenances: structuredClone(seedMaintenances),
      }
    }
    const parsed = JSON.parse(raw) as InventoryState
    if (!Array.isArray(parsed.assets) || !Array.isArray(parsed.maintenances)) {
      return {
        assets: structuredClone(seedAssets),
        maintenances: structuredClone(seedMaintenances),
      }
    }
    return parsed
  } catch {
    return {
      assets: structuredClone(seedAssets),
      maintenances: structuredClone(seedMaintenances),
    }
  }
}

function randomTone(): string {
  const tones = [
    'linear-gradient(135deg, #1a3a2a 0%, #0d1f16 45%, #121212 100%)',
    'linear-gradient(145deg, #1e2a3a 0%, #121820 55%, #0a0a0a 100%)',
    'linear-gradient(145deg, #3a2a1a 0%, #1c140c 55%, #0a0a0a 100%)',
    'linear-gradient(145deg, #2a1a3a 0%, #160e1c 55%, #0a0a0a 100%)',
  ]
  return tones[Math.floor(Math.random() * tones.length)]!
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(() => loadState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const getAsset = useCallback(
    (id: string) => state.assets.find((a) => a.id === id),
    [state.assets],
  )

  const searchAssets = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return state.assets
      return state.assets.filter((a) =>
        [a.code, a.name, a.category, a.brand, a.location, a.serialNumber, a.status]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    },
    [state.assets],
  )

  const createAsset = useCallback((input: CreateAssetInput) => {
    const asset: InventoryAsset = {
      id: `a-${crypto.randomUUID().slice(0, 8)}`,
      code: input.code.trim(),
      name: input.name.trim(),
      category: input.category.trim(),
      brand: input.brand.trim(),
      location: input.location.trim(),
      serialNumber: input.serialNumber.trim(),
      notes: input.notes?.trim() ?? '',
      status: input.status ?? 'Operational',
      tone: randomTone(),
      updatedAt: new Date().toISOString(),
    }
    setState((prev) => ({ ...prev, assets: [asset, ...prev.assets] }))
    return asset
  }, [])

  const updateAsset = useCallback((id: string, patch: Partial<InventoryAsset>) => {
    setState((prev) => ({
      ...prev,
      assets: prev.assets.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
      ),
    }))
  }, [])

  const createMaintenance = useCallback((input: CreateMaintenanceInput) => {
    const record: MaintenanceRecord = {
      id: `m-${crypto.randomUUID().slice(0, 8)}`,
      assetId: input.assetId,
      type: input.type,
      priority: input.priority,
      title: input.title.trim(),
      description: input.description.trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
    }
    setState((prev) => ({
      assets: prev.assets.map((a) =>
        a.id === input.assetId
          ? { ...a, status: 'InMaintenance', updatedAt: new Date().toISOString() }
          : a,
      ),
      maintenances: [record, ...prev.maintenances],
    }))
    return record
  }, [])

  const completeMaintenance = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.maintenances.find((m) => m.id === id)
      if (!target) return prev
      const maintenances = prev.maintenances.map((m) =>
        m.id === id
          ? { ...m, status: 'Completed' as const, completedAt: new Date().toISOString() }
          : m,
      )
      const stillOpen = maintenances.some(
        (m) => m.assetId === target.assetId && m.status !== 'Completed',
      )
      return {
        maintenances,
        assets: prev.assets.map((a) =>
          a.id === target.assetId && !stillOpen
            ? { ...a, status: 'Operational', updatedAt: new Date().toISOString() }
            : a,
        ),
      }
    })
  }, [])

  const resetInventory = useCallback(() => {
    setState({
      assets: structuredClone(seedAssets),
      maintenances: structuredClone(seedMaintenances),
    })
  }, [])

  const featuredAsset = state.assets.find((a) => a.id === featuredAssetId) ?? state.assets[0]!

  const value = useMemo<InventoryContextValue>(
    () => ({
      assets: state.assets,
      maintenances: state.maintenances,
      featuredAsset,
      rows: homeRows(state.assets),
      getAsset,
      searchAssets,
      createAsset,
      updateAsset,
      createMaintenance,
      completeMaintenance,
      resetInventory,
    }),
    [
      state.assets,
      state.maintenances,
      featuredAsset,
      getAsset,
      searchAssets,
      createAsset,
      updateAsset,
      createMaintenance,
      completeMaintenance,
      resetInventory,
    ],
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider')
  return ctx
}
