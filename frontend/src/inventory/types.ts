export type AssetStatus = 'Operational' | 'InMaintenance' | 'OutOfService' | 'Retired'
export type MaintenanceType = 'Preventive' | 'Corrective'
export type MaintenancePriority = 'Low' | 'Medium' | 'High'

export type InventoryAsset = {
  id: string
  code: string
  name: string
  category: string
  brand: string
  location: string
  status: AssetStatus
  serialNumber: string
  notes: string
  tone: string
  updatedAt: string
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
  InMaintenance: 'Mantenimiento',
  OutOfService: 'Fuera de servicio',
  Retired: 'Dado de baja',
}

export const maintenanceTypeLabel: Record<MaintenanceType, string> = {
  Preventive: 'Preventivo',
  Corrective: 'Correctivo',
}

export const priorityLabel: Record<MaintenancePriority, string> = {
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
}
