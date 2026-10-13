// Utilidades de fechas en hora local. Las fechas se manejan como 'YYYY-MM-DD'
// para evitar problemas de zona horaria al guardarlas.

export const DAY_MS = 24 * 60 * 60 * 1000

export const WEEKDAYS = [
  { n: 1, short: 'L', abbr: 'lun', label: 'Lunes' },
  { n: 2, short: 'M', abbr: 'mar', label: 'Martes' },
  { n: 3, short: 'X', abbr: 'mié', label: 'Miércoles' },
  { n: 4, short: 'J', abbr: 'jue', label: 'Jueves' },
  { n: 5, short: 'V', abbr: 'vie', label: 'Viernes' },
  { n: 6, short: 'S', abbr: 'sáb', label: 'Sábado' },
  { n: 7, short: 'D', abbr: 'dom', label: 'Domingo' },
]

export const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function nowTime(): string {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function addMonths(iso: string, n: number): string {
  const d = parseISODate(iso)
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  return toISODate(d)
}

/** Días de `a` a `b` (positivo si `b` es posterior). */
export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS)
}

/** 1 = lunes … 7 = domingo. */
export function weekday(iso: string): number {
  const js = parseISODate(iso).getDay()
  return js === 0 ? 7 : js
}

export function startOfWeek(iso: string): string {
  return addDays(iso, 1 - weekday(iso))
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

export function endOfMonth(iso: string): string {
  return addDays(addMonths(startOfMonth(iso), 1), -1)
}

export function dateRange(from: string, to: string): string[] {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function dateTimeMs(iso: string, time: string): number {
  const d = parseISODate(iso)
  const mins = timeToMinutes(time || '00:00')
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
  return d.getTime()
}

/** Intervalo [inicio, fin) de una franja; si `end <= start` acaba al día siguiente. */
export function timeRangeMs(iso: string, start: string, end: string): [number, number] {
  const s = dateTimeMs(iso, start)
  const endDay = timeToMinutes(end) <= timeToMinutes(start) ? addDays(iso, 1) : iso
  return [s, dateTimeMs(endDay, end)]
}

export function overlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1
}

export function msToISODate(ms: number): string {
  return toISODate(new Date(ms))
}

export function msToTime(ms: number): string {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Edad en años cumplidos a fecha de hoy. */
export function ageFrom(birthDate: string): number | null {
  if (!birthDate) return null
  const today = todayISO()
  let age = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4))
  if (today.slice(5) < birthDate.slice(5)) age--
  return age
}

// --- Formato en español -----------------------------------------------

const fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtMedium = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtShort = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
const fmtFull = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtMonth = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Formatea una fecha 'YYYY-MM-DD'; si no es válida devuelve '' en vez de lanzar un error. */
function safeFormat(fmt: Intl.DateTimeFormat, iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const d = parseISODate(iso)
  return Number.isNaN(d.getTime()) ? '' : fmt.format(d)
}

/** "Jueves, 9 de octubre" */
export function formatDayLong(iso: string): string {
  return capitalize(safeFormat(fmtLong, iso))
}

/** "jue, 9 oct" */
export function formatDayMedium(iso: string): string {
  return safeFormat(fmtMedium, iso)
}

/** "9 oct" */
export function formatDayShort(iso: string): string {
  return safeFormat(fmtShort, iso)
}

/** "9 oct 2026" */
export function formatDate(iso: string): string {
  return safeFormat(fmtFull, iso)
}

/** "Octubre 2026" */
export function formatMonth(iso: string): string {
  return capitalize(safeFormat(fmtMonth, iso))
}

/** "Hoy", "Mañana", "Ayer" o "jue, 9 oct". */
export function formatRelativeDay(iso: string): string {
  const diff = diffDays(todayISO(), iso)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  return formatDayMedium(iso)
}

/** "en 3 días", "hace 2 días", "hoy"… */
export function formatInDays(iso: string): string {
  const diff = diffDays(todayISO(), iso)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'mañana'
  if (diff === -1) return 'ayer'
  return diff > 0 ? `en ${diff} días` : `hace ${-diff} días`
}

export function formatHours(minutes: number): string {
  const h = minutes / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} h`
}
