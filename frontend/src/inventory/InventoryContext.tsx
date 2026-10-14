import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useHomeLists } from '../homeLists/HomeListsContext'
import {
  compileInventoryFromHistory,
  type AssetOverlay,
} from './compileFromHistory'
import type {
  AssetStatus,
  InventoryAsset,
  InventoryComponent,
  MaintenancePriority,
  MaintenanceRecord,
  MaintenanceType,
} from './types'
import { computeCompleteness } from './types'

const OVERLAY_KEY = 'techtrack.inventory.overlays.v2'
const MANUAL_KEY = 'techtrack.inventory.manual.v1'

export type AssetFormPatch = {
  name?: string
  code?: string
  category?: string
  brand?: string
  model?: string
  location?: string
  serialNumber?: string
  responsible?: string
  notes?: string
  status?: AssetStatus
  components?: InventoryComponent[]
}

export type CreateAssetInput = {
  code: string
  name: string
  category: string
  brand: string
  model?: string
  location: string
  serialNumber: string
  responsible?: string
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
  getAsset: (id: string) => InventoryAsset | undefined
  searchAssets: (query: string) => InventoryAsset[]
  createAsset: (input: CreateAssetInput) => InventoryAsset
  updateAsset: (id: string, patch: AssetFormPatch) => void
  createMaintenance: (input: CreateMaintenanceInput) => MaintenanceRecord
  completeMaintenance: (id: string) => void
  resetInventory: () => void
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

function loadOverlays(): Record<string, AssetOverlay> {
  try {
    const raw = localStorage.getItem(OVERLAY_KEY) ?? localStorage.getItem('techtrack.inventory.overlays.v1')
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, AssetOverlay>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadManual(): InventoryAsset[] {
  try {
    const raw = localStorage.getItem(MANUAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InventoryAsset[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
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

function patchToOverlay(patch: AssetFormPatch): AssetOverlay {
  const next: AssetOverlay = {}
  if (patch.name !== undefined) next.displayName = patch.name
  if (patch.code !== undefined) next.code = patch.code
  if (patch.category !== undefined) next.category = patch.category
  if (patch.brand !== undefined) next.brand = patch.brand
  if (patch.model !== undefined) next.model = patch.model
  if (patch.location !== undefined) next.location = patch.location
  if (patch.serialNumber !== undefined) next.serialNumber = patch.serialNumber
  if (patch.responsible !== undefined) next.responsible = patch.responsible
  if (patch.notes !== undefined) next.notes = patch.notes
  if (patch.status !== undefined) next.status = patch.status
  if (patch.components !== undefined) next.components = patch.components
  return next
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { lists, archives } = useHomeLists()
  const [overlays, setOverlays] = useState<Record<string, AssetOverlay>>(() => loadOverlays())
  const [manualAssets, setManualAssets] = useState<InventoryAsset[]>(() => loadManual())
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([])

  useEffect(() => {
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(overlays))
  }, [overlays])

  useEffect(() => {
    localStorage.setItem(MANUAL_KEY, JSON.stringify(manualAssets))
  }, [manualAssets])

  const assets = useMemo(
    () => compileInventoryFromHistory(lists, archives, overlays, manualAssets),
    [lists, archives, overlays, manualAssets],
  )

  const getAsset = useCallback((id: string) => assets.find((a) => a.id === id), [assets])

  const searchAssets = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) return assets
      return assets.filter((a) =>
        [
          a.code,
          a.name,
          a.category,
          a.brand,
          a.model,
          a.location,
          a.serialNumber,
          a.responsible,
          a.status,
          a.macAddress,
          a.ipAddress,
          a.osVersion,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    },
    [assets],
  )

  const createAsset = useCallback((input: CreateAssetInput) => {
    const id = `manual-${crypto.randomUUID().slice(0, 8)}`
    const draft = {
      code: input.code.trim(),
      name: input.name.trim(),
      category: input.category.trim(),
      brand: input.brand.trim(),
      model: input.model?.trim() ?? '',
      serialNumber: input.serialNumber.trim(),
      location: input.location.trim(),
      status: input.status ?? 'Operational',
    }
    const asset: InventoryAsset = {
      id,
      ...draft,
      responsible: input.responsible?.trim() ?? '',
      notes: input.notes?.trim() ?? '',
      tone: randomTone(),
      updatedAt: new Date().toISOString(),
      isManual: true,
      components: [],
      completeness: computeCompleteness(draft),
    }
    setManualAssets((prev) => [asset, ...prev])
    return asset
  }, [])

  const updateAsset = useCallback((id: string, patch: AssetFormPatch) => {
    const overlayPatch = patchToOverlay(patch)
    setOverlays((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...overlayPatch },
    }))
    setManualAssets((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const next = {
          ...a,
          name: patch.name ?? a.name,
          code: patch.code ?? a.code,
          category: patch.category ?? a.category,
          brand: patch.brand ?? a.brand,
          model: patch.model ?? a.model,
          location: patch.location ?? a.location,
          serialNumber: patch.serialNumber ?? a.serialNumber,
          responsible: patch.responsible ?? a.responsible,
          notes: patch.notes ?? a.notes,
          status: patch.status ?? a.status,
          components: patch.components ?? a.components,
          updatedAt: new Date().toISOString(),
        }
        return {
          ...next,
          completeness: computeCompleteness(next),
        }
      }),
    )
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
    setMaintenances((prev) => [record, ...prev])
    setOverlays((prev) => ({
      ...prev,
      [input.assetId]: { ...prev[input.assetId], status: 'InMaintenance' },
    }))
    return record
  }, [])

  const completeMaintenance = useCallback((id: string) => {
    setMaintenances((prev) => {
      const target = prev.find((m) => m.id === id)
      if (!target) return prev
      const next = prev.map((m) =>
        m.id === id
          ? { ...m, status: 'Completed' as const, completedAt: new Date().toISOString() }
          : m,
      )
      const stillOpen = next.some(
        (m) => m.assetId === target.assetId && m.status !== 'Completed',
      )
      if (!stillOpen) {
        setOverlays((o) => ({
          ...o,
          [target.assetId]: { ...o[target.assetId], status: 'Operational' },
        }))
      }
      return next
    })
  }, [])

  const resetInventory = useCallback(() => {
    setOverlays({})
    setManualAssets([])
    setMaintenances([])
  }, [])

  const value = useMemo<InventoryContextValue>(
    () => ({
      assets,
      maintenances,
      getAsset,
      searchAssets,
      createAsset,
      updateAsset,
      createMaintenance,
      completeMaintenance,
      resetInventory,
    }),
    [
      assets,
      maintenances,
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
