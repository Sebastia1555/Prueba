import type { DoseLog, Medication } from '../types'
import { addDays, dateTimeMs, diffDays, msToISODate, todayISO, weekday, WEEKDAYS } from './dates'

export const MED_FORMS = [
  'comprimido',
  'cápsula',
  'sobre',
  'gotas',
  'ml',
  'inhalación',
  'parche',
  'inyección',
  'supositorio',
  'aplicación',
]

/** El tratamiento ya terminó (tenía fecha de fin y ya ha pasado). */
export function isFinished(med: Medication, today: string): boolean {
  return !!med.endDate && med.endDate < today
}

/** El tratamiento aún no ha empezado. */
export function isUpcoming(med: Medication, today: string): boolean {
  return med.startDate > today
}

/** ¿Toca tomarlo ese día según la pauta? */
export function isScheduledOn(med: Medication, date: string): boolean {
  if (!med.active || med.asNeeded) return false
  if (date < med.startDate) return false
  if (med.endDate && date > med.endDate) return false
  if (med.frequency === 'weekdays') return med.weekdays.includes(weekday(date))
  if (med.frequency === 'interval') {
    const every = Math.max(1, med.intervalDays)
    return diffDays(med.startDate, date) % every === 0
  }
  return true
}

export interface ScheduledDose {
  med: Medication
  date: string
  time: string
  amount: number
  log: DoseLog | undefined
}

export function dosesForDay(meds: Medication[], logs: DoseLog[], date: string): ScheduledDose[] {
  const dayLogs = logs.filter((l) => l.date === date)
  const out: ScheduledDose[] = []
  for (const med of meds) {
    if (!isScheduledOn(med, date)) continue
    const doses = [...med.doses].sort((a, b) => a.time.localeCompare(b.time))
    const medLogs = dayLogs.filter((l) => l.medicationId === med.id).sort((a, b) => a.time.localeCompare(b.time))
    // Cada registro casa con una sola toma de su misma hora. Cuando se cambia
    // la hora de una toma, el formulario mueve también sus registros.
    const used = new Set<string>()
    for (const d of doses) {
      const log = medLogs.find((l) => l.time === d.time && !used.has(l.id))
      if (log) used.add(log.id)
      out.push({ med, date, time: d.time, amount: d.amount, log })
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.med.name.localeCompare(b.med.name))
}

/** Margen tras la hora programada antes de considerar una toma atrasada. */
export const OVERDUE_MINUTES = 60

export function isOverdue(dose: ScheduledDose, now = Date.now()): boolean {
  return !dose.log && dateTimeMs(dose.date, dose.time) + OVERDUE_MINUTES * 60_000 < now
}

/** Hasta cuántas horas después se sigue avisando de una toma de ayer sin registrar. */
const OVERDUE_LOOKBACK_HOURS = 12

/**
 * Tomas atrasadas sin registrar: las de hoy y las de ayer de las últimas horas
 * (así una toma de las 23:00 olvidada sigue avisando pasada la medianoche).
 */
export function overdueDoses(meds: Medication[], logs: DoseLog[], now = Date.now()): ScheduledDose[] {
  const today = msToISODate(now)
  const since = now - OVERDUE_LOOKBACK_HOURS * 3600_000
  const yesterday = dosesForDay(meds, logs, addDays(today, -1)).filter((d) => dateTimeMs(d.date, d.time) > since)
  return [...yesterday, ...dosesForDay(meds, logs, today)].filter((d) => isOverdue(d, now))
}

export function unitsPerDay(med: Medication): number {
  return med.doses.reduce((s, d) => s + d.amount, 0)
}

// --- Stock ---------------------------------------------------------------

export type StockLevel = 'ok' | 'low' | 'out' | 'unknown'

export interface StockStatus {
  remaining: number
  /** Días hasta agotarse (null si no se puede estimar). */
  daysLeft: number | null
  runOutDate: string | null
  level: StockLevel
}

const HORIZON_DAYS = 400

export function stockStatus(med: Medication, logs: DoseLog[], now = Date.now()): StockStatus {
  let remaining: number

  if (med.asNeeded) {
    const used = logs
      .filter((l) => l.medicationId === med.id && l.status === 'given' && l.at > med.stockCountedAt)
      .reduce((s, l) => s + l.amount, 0)
    remaining = med.stockUnits - used
  } else {
    // Consumo estimado según la pauta desde el último recuento (solo los días
    // en que el tratamiento estaba en marcha).
    let used = 0
    const countedDay = msToISODate(med.stockCountedAt)
    const from = countedDay > med.startDate ? countedDay : med.startDate
    const today = msToISODate(now)
    const to = med.endDate && med.endDate < today ? med.endDate : today
    for (let d = from; d <= to; d = addDays(d, 1)) {
      if (!isScheduledOn(med, d)) continue
      for (const dose of med.doses) {
        const t = dateTimeMs(d, dose.time)
        if (t > med.stockCountedAt && t <= now) used += dose.amount
      }
    }
    remaining = med.stockUnits - used
  }

  remaining = Math.max(0, Math.round(remaining * 100) / 100)

  if (med.asNeeded || !med.active) {
    return { remaining, daysLeft: null, runOutDate: null, level: remaining <= 0 ? 'out' : 'unknown' }
  }

  // Proyección hacia delante hasta que no quede para una toma completa.
  let left = remaining
  let runOutDate: string | null = null
  const today = msToISODate(now)
  for (let i = 0; i <= HORIZON_DAYS && !runOutDate; i++) {
    const d = addDays(today, i)
    if (med.endDate && d > med.endDate) break
    if (!isScheduledOn(med, d)) continue
    for (const dose of med.doses) {
      if (dateTimeMs(d, dose.time) <= now) continue
      if (left + 1e-9 < dose.amount) {
        runOutDate = d
        break
      }
      left -= dose.amount
    }
  }

  const daysLeft = runOutDate ? diffDays(today, runOutDate) : null
  let level: StockLevel = 'ok'
  if (remaining <= 0 || daysLeft === 0) level = 'out'
  else if (daysLeft !== null && daysLeft <= med.alertDays) level = 'low'
  return { remaining, daysLeft, runOutDate, level }
}

/** Campos que cambian cuánto se consume. */
const SCHEDULE_FIELDS = ['doses', 'frequency', 'weekdays', 'intervalDays', 'asNeeded', 'startDate', 'endDate', 'active'] as const

const sameDoses = (a: Medication['doses'], b: Medication['doses']) => {
  const key = (d: Medication['doses']) => JSON.stringify([...d].sort((x, y) => x.time.localeCompare(y.time)))
  return key(a) === key(b)
}

/**
 * Recuento de stock al guardar cambios en un medicamento:
 * - Si se ha escrito a mano cuánto queda (`manualCount`), ese es el recuento.
 * - Si se suspende o se reanuda, lo que queda en este momento.
 * - Si cambia la pauta, lo que quedaba al empezar el día (o el recuento de
 *   hoy si ya lo había): las tomas de hoy se cuentan con la pauta nueva, así
 *   que una toma ya dada que cambia de hora no se descuenta dos veces.
 * - Si no, se conserva el último recuento.
 */
export function stockOnSave(
  original: Medication | undefined,
  edited: Medication,
  logs: DoseLog[],
  now: number,
  manualCount: number | null,
): { stockUnits: number; stockCountedAt: number } {
  if (!original || manualCount !== null) return { stockUnits: manualCount ?? edited.stockUnits, stockCountedAt: now }
  const keep = { stockUnits: original.stockUnits, stockCountedAt: original.stockCountedAt }
  const scheduleChanged = SCHEDULE_FIELDS.some((k) =>
    k === 'doses' ? !sameDoses(original.doses, edited.doses) : JSON.stringify(original[k]) !== JSON.stringify(edited[k]),
  )
  if (!scheduleChanged) return keep
  if (original.active !== edited.active) {
    return { stockUnits: stockStatus(original, logs, now).remaining, stockCountedAt: now }
  }
  const dayStart = dateTimeMs(msToISODate(now), '00:00')
  if (original.stockCountedAt >= dayStart) return keep
  return { stockUnits: stockStatus(original, logs, dayStart).remaining, stockCountedAt: dayStart }
}

export function prescriptionDaysLeft(med: Medication): number | null {
  if (!med.prescriptionExpires) return null
  return diffDays(todayISO(), med.prescriptionExpires)
}

// --- Texto ---------------------------------------------------------------

export function formatAmount(amount: number, form: string): string {
  const n = amount === 0.5 ? '½' : amount === 0.25 ? '¼' : String(amount).replace('.', ',')
  const plural = amount > 1 && !['ml', 'gotas'].includes(form)
  const f = !form ? '' : plural ? pluralize(form) : form
  return `${n} ${f}`.trim()
}

function pluralize(word: string): string {
  if (word.endsWith('ón')) return `${word.slice(0, -2)}ones`
  if (/[aeiouáéó]$/.test(word)) return `${word}s`
  return `${word}es`
}

export function scheduleSummary(med: Medication): string {
  if (med.asNeeded) return 'Si precisa'
  const times = med.doses.map((d) => d.time).join(', ')
  if (med.frequency === 'weekdays') {
    const days = WEEKDAYS.filter((w) => med.weekdays.includes(w.n))
      .map((w) => w.abbr)
      .join(', ')
    return `${days} · ${times}`
  }
  if (med.frequency === 'interval') {
    return `Cada ${med.intervalDays} días · ${times}`
  }
  return `Todos los días · ${times}`
}
