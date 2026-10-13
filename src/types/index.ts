// Fechas como 'YYYY-MM-DD' (día local), horas como 'HH:MM' y marcas de tiempo
// como milisegundos desde epoch.

export type Role = 'admin' | 'familiar' | 'cuidador'

export interface Member {
  id: string
  name: string
  role: Role
  /** Color para identificarle en la agenda (hex). */
  color: string
  /** Relación con la persona cuidada: "Hija", "Hijo", "Cuidadora"... */
  relation: string
  phone: string
  email: string
  createdAt: number
}

export interface EmergencyContact {
  id: string
  name: string
  relation: string
  phone: string
}

export interface Patient {
  name: string
  birthDate: string
  address: string
  idNumber: string
  healthCardNumber: string
  socialSecurityNumber: string
  bloodType: string
  allergies: string
  conditions: string
  mobility: string
  diet: string
  gpName: string
  gpPhone: string
  healthCenter: string
  insurance: string
  dependencyGrade: string
  notes: string
  emergencyContacts: EmergencyContact[]
}

/** Franja horaria que hay que cubrir (mañana, tarde, noche...). */
export interface CareSlot {
  id: string
  label: string
  start: string
  /** Si es menor o igual que `start`, la franja termina al día siguiente. */
  end: string
  /** Días de la semana en que hace falta cubrirla (1 = lunes … 7 = domingo). */
  weekdays: number[]
}

/** Asignación de una persona a una franja en un día concreto. */
export interface Shift {
  id: string
  date: string
  slotId: string
  memberId: string
  note: string
  /** Turnos creados juntos con "repetir cada semana". */
  seriesId: string | null
  /** La persona asignada pide que alguien la sustituya. */
  coverRequested: boolean
}

/** Bloque en el que una persona no está disponible (trabajo, extraescolares...). */
export interface BusyBlock {
  id: string
  memberId: string
  title: string
  repeat: 'none' | 'weekly'
  /** Solo para `weekly`. */
  weekdays: number[]
  startDate: string
  /** Último día. Vacío = sin fin (`weekly`) o un solo día (`none`). */
  endDate: string
  allDay: boolean
  startTime: string
  endTime: string
  /** Los demás solo ven "Ocupado". */
  private: boolean
}

export interface CalendarEvent {
  start: number
  end: number
  title: string
  allDay: boolean
  /**
   * Evento de un día marcado como "libre" en su calendario (recordatorios,
   * cumpleaños…): se avisa, pero no impide asignar turnos.
   */
  tentative?: boolean
}

/** Calendario personal importado (.ics) para conocer la disponibilidad. */
export interface CalendarSource {
  id: string
  memberId: string
  name: string
  /** Vacío si se importó desde un archivo. */
  url: string
  importedAt: number
  private: boolean
  events: CalendarEvent[]
}

export interface DoseTime {
  time: string
  /** Unidades por toma (admite 0.5 para medio comprimido). */
  amount: number
}

export type MedFrequency = 'daily' | 'weekdays' | 'interval'

export interface Medication {
  id: string
  name: string
  strength: string
  form: string
  purpose: string
  instructions: string
  doses: DoseTime[]
  frequency: MedFrequency
  weekdays: number[]
  intervalDays: number
  /** "Si precisa": sin horario fijo. */
  asNeeded: boolean
  startDate: string
  /** Vacío = tratamiento crónico. */
  endDate: string
  unitsPerPackage: number
  /** Unidades que había en el último recuento… */
  stockUnits: number
  /** …y cuándo se hizo. El consumo posterior se estima con la pauta. */
  stockCountedAt: number
  /** Avisar cuando queden estos días o menos. */
  alertDays: number
  /** Miembro que se ha comprometido a comprarlo. */
  purchaseClaimedBy: string | null
  /** Fecha en que caduca la receta (vacío si no aplica). */
  prescriptionExpires: string
  prescriber: string
  active: boolean
  createdAt: number
}

export interface DoseLog {
  id: string
  medicationId: string
  /** Día y hora programados de la toma (para "si precisa", los reales). */
  date: string
  time: string
  status: 'given' | 'skipped'
  memberId: string
  at: number
  amount: number
  note: string
}

export type AppointmentStatus = 'scheduled' | 'done' | 'cancelled'

export interface Appointment {
  id: string
  date: string
  time: string
  durationMin: number
  specialty: string
  doctor: string
  place: string
  address: string
  reason: string
  companionId: string | null
  transport: string
  preparation: string
  /** Preguntas para el médico, una por línea. */
  questions: string
  /** Qué dijo el médico. */
  summary: string
  followUp: string
  status: AppointmentStatus
  createdAt: number
}

export type DocCategory = 'informe' | 'analitica' | 'prueba' | 'receta' | 'administrativo' | 'otro'

export interface DocumentMeta {
  id: string
  title: string
  fileName: string
  mimeType: string
  size: number
  category: DocCategory
  date: string
  appointmentId: string | null
  notes: string
  addedBy: string
  addedAt: number
}

export type DiaryTag = 'comida' | 'sueno' | 'animo' | 'salud' | 'caida' | 'incidencia' | 'visita' | 'otro'

export interface DiaryEntry {
  id: string
  at: number
  memberId: string
  text: string
  tags: DiaryTag[]
  important: boolean
}

export type ExpenseCategory = 'farmacia' | 'cuidadora' | 'ortopedia' | 'transporte' | 'hogar' | 'otros'

export interface Expense {
  id: string
  date: string
  concept: string
  category: ExpenseCategory
  amountCents: number
  paidById: string
  /** Entre quién se reparte a partes iguales. */
  splitAmong: string[]
  notes: string
  createdAt: number
}

export interface Settlement {
  id: string
  date: string
  fromId: string
  toId: string
  amountCents: number
  note: string
}

export interface AppData {
  version: 1
  /** Datos de ejemplo cargados para probar la app. */
  sample?: boolean
  patient: Patient
  members: Member[]
  slots: CareSlot[]
  shifts: Shift[]
  busyBlocks: BusyBlock[]
  calendars: CalendarSource[]
  medications: Medication[]
  doseLogs: DoseLog[]
  appointments: Appointment[]
  documents: DocumentMeta[]
  diary: DiaryEntry[]
  expenses: Expense[]
  settlements: Settlement[]
}

/** Colecciones de AppData que son listas de elementos con `id`. */
export type ListKey = {
  [K in keyof AppData]-?: AppData[K] extends { id: string }[] ? K : never
}[keyof AppData]

export type ListItem<K extends ListKey> = AppData[K][number]
