import type { ClassCloseReason, ClassSessionArchive, ConnectedDeviceSighting } from './types'

/** Textos claros para dirección / administración (sin jerga de red). */
export const closeReasonAdmin: Record<ClassCloseReason, string> = {
  schedule_changed: 'Se cambió la fecha o el horario de esta clase.',
  window_ended: 'La clase terminó a la hora prevista.',
  list_deleted: 'La clase se quitó del tablero de Inicio.',
  manual: 'La clase se cerró de forma manual.',
}

export function usageHeadline(totalSeen: number): string {
  if (totalSeen <= 0) return 'Sin uso detectado'
  if (totalSeen === 1) return '1 equipo en uso'
  if (totalSeen <= 3) return `Poco uso · ${totalSeen} equipos`
  return `${totalSeen} equipos en uso`
}

export function usageNarrative(totalSeen: number): string {
  if (totalSeen <= 0) {
    return 'En esta clase no se detectaron computadoras conectadas a la red del colegio.'
  }
  if (totalSeen === 1) {
    return 'Se detectó 1 computadora conectada mientras la clase estuvo activa.'
  }
  if (totalSeen <= 3) {
    return `Se detectaron ${totalSeen} computadoras. El uso fue bajo para un laboratorio.`
  }
  return `Se detectaron ${totalSeen} computadoras conectadas durante la clase. Eso indica actividad real en el lab.`
}

export function friendlyDeviceLabel(device: ConnectedDeviceSighting, index: number): string {
  const host = device.hostname?.trim()
  if (host && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return host
  }
  return `Equipo ${index + 1}`
}

export function archiveAdminBlurb(archive: ClassSessionArchive): string {
  return `${usageNarrative(archive.totalSeen)} ${closeReasonAdmin[archive.closeReason]}`
}
