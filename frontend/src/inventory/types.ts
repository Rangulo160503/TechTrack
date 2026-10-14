export type AssetStatus = 'Operational' | 'InMaintenance' | 'OutOfService' | 'Retired'
export type MaintenanceType = 'Preventive' | 'Corrective'
export type MaintenancePriority = 'Low' | 'Medium' | 'High'

export type AssetClassAppearance = {
  name: string
  date: string
}

/** Componente de hardware registrado en la ficha (manual o desde Presence). */
export type InventoryComponent = {
  category: string
  name: string
  detail: string
}

/**
 * Ficha de inventario institucional.
 * Presence/Historial descubren el equipo; en Activos se completan marca, modelo, etc.
 */
export type InventoryAsset = {
  id: string
  /** Código patrimonial / etiqueta del colegio (ej. EQ-LAB-014). */
  code: string
  name: string
  /** Tipo: Computadoras, Red, Impresión, Audiovisual… */
  category: string
  brand: string
  model: string
  /** Ubicación física (Lab 1, Secretaría…), no el nombre de la clase. */
  location: string
  status: AssetStatus
  serialNumber: string
  /** Quién responde por el equipo (encargado, aula, etc.). */
  responsible: string
  notes: string
  tone: string
  updatedAt: string
  /** true = creado a mano; false = apareció por Presence/Historial. */
  isManual: boolean
  macAddress?: string | null
  ipAddress?: string
  osVersion?: string | null
  hardwareProfileJson?: string | null
  /** Componentes de la ficha (editables); Presence puede sugerirlos. */
  components: InventoryComponent[]
  timesSeen?: number
  classCount?: number
  firstSeenAt?: string
  lastSeenAt?: string
  presenceDeviceId?: string
  classHistory?: AssetClassAppearance[]
  /** Cuántos campos clave del inventario están llenos (0–1). */
  completeness: number
}

export type MaintenanceRecord = {
  id: string
  assetId: string
  type: MaintenanceType
  priority: MaintenancePriority
  title: string
  description: string
  status: 'Open' | 'InProgress' | 'Completed'
  createdAt: string
  completedAt?: string
}

export const statusLabel: Record<AssetStatus, string> = {
  Operational: 'Operativo',
  InMaintenance: 'En mantenimiento',
  OutOfService: 'Fuera de servicio',
  Retired: 'Dado de baja',
}

export const CATEGORY_SUGGESTIONS = [
  'Computadoras',
  'Portátiles',
  'Red',
  'Impresión',
  'Audiovisual',
  'Servidores',
  'Periféricos',
  'Otro',
] as const

export const LOCATION_SUGGESTIONS = [
  'Lab. Informática 1',
  'Lab. Informática 2',
  'Secretaría',
  'Biblioteca',
  'Aula',
  'Cuarto de servidores',
  'Dirección',
] as const

export const COMPONENT_CATEGORY_SUGGESTIONS = [
  'Procesador',
  'Memoria',
  'Almacenamiento',
  'Pantalla',
  'Red',
  'Sistema',
  'Otro',
] as const

export const maintenanceTypeLabel: Record<MaintenanceType, string> = {
  Preventive: 'Preventivo',
  Corrective: 'Correctivo',
}

export const priorityLabel: Record<MaintenancePriority, string> = {
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
}

/** Campos mínimos para considerar la ficha “completa” en un inventario escolar. */
export const INVENTORY_CORE_FIELDS = [
  'code',
  'name',
  'category',
  'brand',
  'model',
  'serialNumber',
  'location',
  'status',
] as const

export function computeCompleteness(asset: {
  code: string
  name: string
  category: string
  brand: string
  model: string
  serialNumber: string
  location: string
  status: AssetStatus
}): number {
  const checks = [
    Boolean(asset.code?.trim()) && !asset.code.startsWith('MAC-') && !asset.code.startsWith('EQ-'),
    Boolean(asset.name?.trim()) && !asset.name.startsWith('Equipo '),
    Boolean(asset.category?.trim()) && asset.category !== 'Equipo de red',
    Boolean(asset.brand?.trim()) && asset.brand !== 'Desconocido',
    Boolean(asset.model?.trim()),
    Boolean(asset.serialNumber?.trim()) && !asset.serialNumber.includes(':'),
    Boolean(asset.location?.trim()) && asset.location !== 'Sin clase registrada',
    Boolean(asset.status),
  ]
  const ok = checks.filter(Boolean).length
  return ok / checks.length
}
