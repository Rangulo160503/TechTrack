import type { InventoryAsset } from './types'
import { statusLabel } from './types'

export type InventoryViewMode = 'admin' | 'tech'

const MODE_KEY = 'techtrack.assets.viewMode'

export function loadInventoryViewMode(): InventoryViewMode {
  try {
    return sessionStorage.getItem(MODE_KEY) === 'tech' ? 'tech' : 'admin'
  } catch {
    return 'admin'
  }
}

export function saveInventoryViewMode(mode: InventoryViewMode): void {
  try {
    sessionStorage.setItem(MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}

/** Nombre técnico / automático que no sirve para dirección. */
export function isTechnicalAssetName(name: string): boolean {
  const n = name.trim()
  if (!n) return true
  if (/^\d+\.\d+\.\d+\.\d+$/.test(n)) return true
  if (/^MAC-/i.test(n)) return true
  if (/^EQ-[A-Z0-9]+$/i.test(n)) return true
  if (/^Equipo\s+[0-9A-F:]{8,}/i.test(n)) return true
  if (/^Equipo\s+sin\s+nombre$/i.test(n)) return true
  return false
}

/**
 * Etiqueta que recuerda administración (Equipo 2, o el alias que cargaron).
 * Índice 0-based del listado filtrado.
 */
export function friendlyAssetLabel(asset: InventoryAsset, index: number): string {
  if (asset.name && !isTechnicalAssetName(asset.name)) return asset.name
  return `Equipo ${index + 1}`
}

export function adminStatusLine(asset: InventoryAsset): string {
  return statusLabel[asset.status]
}

export function adminCompletenessLine(asset: InventoryAsset): string {
  const pct = Math.round(asset.completeness * 100)
  if (pct >= 100) return 'Ficha completa'
  if (pct >= 50) return `Falta completar · ${pct}%`
  return `Ficha incompleta · ${pct}%`
}

export function adminLocationLine(asset: InventoryAsset): string {
  if (!asset.location || asset.location === 'Sin clase registrada') {
    return 'Ubicación sin registrar'
  }
  return asset.location
}

export function adminBrandModelLine(asset: InventoryAsset): string {
  const brand = asset.brand && asset.brand !== 'Desconocido' ? asset.brand : null
  const model = asset.model?.trim() || null
  if (brand && model) return `${brand} ${model}`
  if (brand) return brand
  if (model) return model
  return 'Marca y modelo pendientes'
}

export function adminAssetBlurb(asset: InventoryAsset): string {
  const parts = [
    adminBrandModelLine(asset),
    adminLocationLine(asset),
    adminStatusLine(asset),
  ]
  return parts.join(' · ')
}
