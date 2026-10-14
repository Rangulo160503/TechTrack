export type NavItem = {
  to: string
  label: string
  /** Título corto para barra superior / móvil si hace falta */
  shortLabel?: string
  end?: boolean
  blurb?: string
}

/** Destinos frecuentes — barra inferior y bloque superior del sidebar. */
export const primaryNav: NavItem[] = [
  { to: '/', label: 'Inicio', end: true },
  {
    to: '/live',
    label: 'Equipos en vivo',
    shortLabel: 'En vivo',
    blurb: 'Computadoras conectadas ahora en la red del colegio',
  },
  {
    to: '/assets',
    label: 'Inventario de activos',
    shortLabel: 'Activos',
    blurb: 'Fichas de equipos descubiertos y registrados',
  },
]

/** Destinos menos frecuentes — sidebar inferior y pantalla Más. */
export const secondaryNav: NavItem[] = [
  {
    to: '/usos',
    label: 'Uso de dispositivos por clase',
    shortLabel: 'Uso por clase',
    blurb: 'Sesiones de clase con snapshots de equipos en línea (Presence)',
  },
  {
    to: '/historial-clases',
    label: 'Historial de clases',
    shortLabel: 'Historial',
    blurb: 'Clases cerradas o reprogramadas, con el uso que tuvieron',
  },
  {
    to: '/catalogs',
    label: 'Catálogos del inventario',
    shortLabel: 'Catálogos',
    blurb: 'Tipos, marcas y ubicaciones derivados del inventario',
  },
  {
    to: '/reports',
    label: 'Reportes de uso',
    shortLabel: 'Reportes',
    blurb: 'En línea ahora y movimiento del historial por clase',
  },
]

export const profileNav: NavItem = {
  to: '/profile',
  label: 'Cuenta y preferencias',
  shortLabel: 'Cuenta',
  blurb: 'Tema y datos locales',
}

/** Títulos de página por ruta (barra superior). */
export const pageTitles: Record<string, string> = {
  '/': 'Inicio',
  '/live': 'Equipos en vivo',
  '/assets': 'Inventario de activos',
  '/usos': 'Uso de dispositivos por clase',
  '/historial-clases': 'Historial de clases',
  '/catalogs': 'Catálogos del inventario',
  '/reports': 'Reportes de uso',
  '/more': 'Más opciones',
  '/profile': 'Cuenta y preferencias',
}
