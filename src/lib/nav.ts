import type { IconName } from '../components/Icon'
import type { Permission } from './permissions'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  description: string
  perm?: Permission
  /** Etiqueta junto al nombre, p. ej. "Próximamente". */
  badge?: string
}

/** Pestañas principales (barra inferior en el móvil). */
export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Hoy', icon: 'home', description: 'Resumen del día' },
  { to: '/agenda', label: 'Agenda', icon: 'calendar', description: 'Turnos de cuidado' },
  { to: '/medicacion', label: 'Medicación', icon: 'pill', description: 'Tomas, pauta y stock' },
  { to: '/citas', label: 'Citas', icon: 'stethoscope', description: 'Citas médicas' },
]

export const MORE_LINKS: NavItem[] = [
  { to: '/diario', label: 'Diario', icon: 'book', description: 'Notas de cada turno' },
  { to: '/documentos', label: 'Documentos', icon: 'file', description: 'Informes, analíticas, recetas', perm: 'viewDocuments' },
  { to: '/gastos', label: 'Gastos', icon: 'euro', description: 'Quién ha pagado qué', perm: 'viewExpenses' },
  { to: '/ficha', label: 'Ficha de emergencia', icon: 'card', description: 'Alergias, medicación, contactos' },
  {
    to: '/camaras',
    label: 'Cámaras',
    icon: 'camera',
    description: 'Ver la casa en directo, avisos de caídas y de la puerta',
    perm: 'viewCameras',
    badge: 'Próximamente',
  },
  { to: '/disponibilidad', label: 'Mi disponibilidad', icon: 'user', description: 'Tus compromisos y calendarios' },
  { to: '/familia', label: 'Familia y roles', icon: 'users', description: 'Quién participa y qué puede hacer' },
  { to: '/ajustes', label: 'Ajustes', icon: 'settings', description: 'Franjas, copia de seguridad' },
]
