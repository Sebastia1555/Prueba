import type { Role } from '../types'

export type Permission =
  | 'manageMembers'
  | 'manageSettings'
  | 'editPatient'
  | 'editMedications'
  | 'logDoses'
  | 'manageStock'
  | 'editShifts'
  | 'takeShifts'
  | 'editAppointments'
  | 'viewDocuments'
  | 'editDocuments'
  | 'viewExpenses'
  | 'editExpenses'
  | 'writeDiary'

const FAMILIAR: Permission[] = [
  'editPatient',
  'logDoses',
  'manageStock',
  'editShifts',
  'takeShifts',
  'editAppointments',
  'viewDocuments',
  'editDocuments',
  'viewExpenses',
  'editExpenses',
  'writeDiary',
]

const CUIDADOR: Permission[] = ['logDoses', 'manageStock', 'takeShifts', 'writeDiary']

export function can(role: Role | undefined, perm: Permission): boolean {
  if (!role) return false
  if (role === 'admin') return true
  if (role === 'familiar') return FAMILIAR.includes(perm)
  return CUIDADOR.includes(perm)
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador/a',
  familiar: 'Familiar',
  cuidador: 'Cuidador/a',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Puede hacerlo todo: gestionar la familia, los roles, la pauta de medicación y los ajustes.',
  familiar:
    'Organiza turnos y citas, registra tomas, compras, documentos y gastos. No cambia la pauta ni los roles.',
  cuidador:
    'Ve la agenda, la medicación del día, las citas y la ficha. Registra tomas y notas del diario. No ve gastos ni documentos.',
}
