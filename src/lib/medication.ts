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
    for (const d of med.doses) {
      out.push({
        med,
        date,
        time: d.time,
        amount: d.amount,
        log: dayLogs.find((l) => l.medicationId === med.id && l.time === d.time),
      })
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.med.name.localeCompare(b.med.name))
}

/** Margen tras la hora programada antes de considerar una toma atrasada. */
export const OVERDUE_MINUTES = 60

export function isOverdue(dose: ScheduledDose, now = Date.now()): boolean {
  return !dose.log && dateTimeMs(dose.date, dose.time) + OVERDUE_MINUTES * 60_000 < now
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
    // Consumo estimado según la pauta desde el último recuento.
    let used = 0
    const from = msToISODate(med.stockCountedAt)
    const to = msToISODate(now)
    if (diffDays(from, to) <= HORIZON_DAYS) {
      for (let d = from; d <= to; d = addDays(d, 1)) {
        if (!isScheduledOn(med, d)) continue
        for (const dose of med.doses) {
          const t = dateTimeMs(d, dose.time)
          if (t > med.stockCountedAt && t <= now) used += dose.amount
        }
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
