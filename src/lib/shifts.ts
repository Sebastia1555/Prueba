import type { AppData, BusyBlock, CareSlot, Member, Shift } from '../types'
import {
  addDays,
  dateRange,
  dateTimeMs,
  msToISODate,
  overlaps,
  timeRangeMs,
  timeToMinutes,
  weekday,
} from './dates'

export const DEFAULT_SLOTS: Omit<CareSlot, 'id'>[] = [
  { label: 'Mañana', start: '08:00', end: '14:00', weekdays: [1, 2, 3, 4, 5, 6, 7] },
  { label: 'Tarde', start: '14:00', end: '20:00', weekdays: [1, 2, 3, 4, 5, 6, 7] },
  { label: 'Noche', start: '20:00', end: '08:00', weekdays: [1, 2, 3, 4, 5, 6, 7] },
]

/** Duración por defecto de una cita si no se indica (incluye desplazamiento). */
export const DEFAULT_APPOINTMENT_MINUTES = 90

export function sortSlots(slots: CareSlot[]): CareSlot[] {
  return [...slots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
}

export function slotsForDay(slots: CareSlot[], date: string): CareSlot[] {
  const wd = weekday(date)
  return sortSlots(slots.filter((s) => s.weekdays.includes(wd)))
}

export function slotMinutes(slot: CareSlot): number {
  const diff = timeToMinutes(slot.end) - timeToMinutes(slot.start)
  return diff > 0 ? diff : diff + 24 * 60
}

export function slotInterval(slot: CareSlot, date: string): [number, number] {
  return timeRangeMs(date, slot.start, slot.end)
}

export function findShift(shifts: Shift[], date: string, slotId: string): Shift | undefined {
  return shifts.find((s) => s.date === date && s.slotId === slotId)
}

export interface CoverageCell {
  date: string
  slot: CareSlot
  shift: Shift | undefined
}

export function coverage(data: AppData, from: string, to: string): CoverageCell[] {
  const byKey = new Map(data.shifts.map((s) => [`${s.date}|${s.slotId}`, s]))
  const out: CoverageCell[] = []
  for (const date of dateRange(from, to)) {
    for (const slot of slotsForDay(data.slots, date)) {
      out.push({ date, slot, shift: byKey.get(`${date}|${slot.id}`) })
    }
  }
  return out
}

/** Minutos de turno de cada miembro en el rango. */
export function minutesByMember(data: AppData, from: string, to: string): Map<string, number> {
  const slots = new Map(data.slots.map((s) => [s.id, s]))
  const out = new Map<string, number>()
  for (const s of data.shifts) {
    if (s.date < from || s.date > to) continue
    const slot = slots.get(s.slotId)
    if (!slot) continue
    out.set(s.memberId, (out.get(s.memberId) ?? 0) + slotMinutes(slot))
  }
  return out
}

/** Turno en curso en este momento. */
export function currentShift(data: AppData, now = Date.now()): CoverageCell | null {
  const today = msToISODate(now)
  for (const date of [addDays(today, -1), today]) {
    for (const slot of slotsForDay(data.slots, date)) {
      const [s, e] = slotInterval(slot, date)
      if (s <= now && now < e) {
        return { date, slot, shift: findShift(data.shifts, date, slot.id) }
      }
    }
  }
  return null
}

/** Siguientes franjas (cubiertas o no) a partir de ahora. */
export function upcomingCells(data: AppData, days: number, now = Date.now()): CoverageCell[] {
  const today = msToISODate(now)
  return coverage(data, today, addDays(today, days)).filter(
    (c) => slotInterval(c.slot, c.date)[1] > now,
  )
}

// --- Disponibilidad --------------------------------------------------------

export interface Conflict {
  kind: 'busy' | 'calendar' | 'shift' | 'appointment'
  memberId: string
  title: string
  start: number
  end: number
  private: boolean
}

function blockAppliesOn(block: BusyBlock, date: string): boolean {
  if (date < block.startDate) return false
  if (block.repeat === 'weekly') {
    if (block.endDate && date > block.endDate) return false
    return block.weekdays.includes(weekday(date))
  }
  return date <= (block.endDate || block.startDate)
}

export function blockInterval(block: BusyBlock, date: string): [number, number] {
  if (block.allDay) return [dateTimeMs(date, '00:00'), dateTimeMs(addDays(date, 1), '00:00')]
  return timeRangeMs(date, block.startTime, block.endTime)
}

export interface ConflictIgnore {
  shiftId?: string
  appointmentId?: string
}

/** Todo lo que impide a `memberId` estar disponible en [start, end). */
export function memberConflicts(
  data: AppData,
  memberId: string,
  start: number,
  end: number,
  ignore: ConflictIgnore = {},
): Conflict[] {
  const out: Conflict[] = []
  const first = addDays(msToISODate(start), -1)
  const days = dateRange(first, msToISODate(end))

  for (const b of data.busyBlocks) {
    if (b.memberId !== memberId) continue
    for (const d of days) {
      if (!blockAppliesOn(b, d)) continue
      const [s, e] = blockInterval(b, d)
      if (overlaps(start, end, s, e)) {
        out.push({ kind: 'busy', memberId, title: b.title, start: s, end: e, private: b.private })
      }
    }
  }

  for (const cal of data.calendars) {
    if (cal.memberId !== memberId) continue
    for (const ev of cal.events) {
      if (overlaps(start, end, ev.start, ev.end)) {
        out.push({ kind: 'calendar', memberId, title: ev.title, start: ev.start, end: ev.end, private: cal.private })
      }
    }
  }

  const slots = new Map(data.slots.map((s) => [s.id, s]))
  for (const sh of data.shifts) {
    if (sh.memberId !== memberId || sh.id === ignore.shiftId) continue
    if (sh.date < first || sh.date > days[days.length - 1]) continue
    const slot = slots.get(sh.slotId)
    if (!slot) continue
    const [s, e] = slotInterval(slot, sh.date)
    if (overlaps(start, end, s, e)) {
      out.push({ kind: 'shift', memberId, title: `Turno de ${slot.label.toLowerCase()}`, start: s, end: e, private: false })
    }
  }

  for (const a of data.appointments) {
    if (a.companionId !== memberId || a.status !== 'scheduled' || a.id === ignore.appointmentId) continue
    const s = dateTimeMs(a.date, a.time)
    const e = s + (a.durationMin || DEFAULT_APPOINTMENT_MINUTES) * 60_000
    if (overlaps(start, end, s, e)) {
      out.push({ kind: 'appointment', memberId, title: `Cita: ${a.specialty}`, start: s, end: e, private: false })
    }
  }

  return out.sort((a, b) => a.start - b.start)
}

/** Título visible para quien mira: lo privado de otros sale como "Ocupado". */
export function conflictLabel(c: Conflict, viewerId: string | undefined): string {
  return c.private && c.memberId !== viewerId ? 'Ocupado' : c.title || 'Ocupado'
}

// --- Reparto automático ------------------------------------------------------

export interface Proposal {
  cell: CoverageCell
  memberId: string | null
}

/**
 * Propone quién cubre cada franja libre: solo personas sin conflictos y,
 * entre ellas, quien menos horas lleva en el mes (y menos turnos ese día).
 */
export function proposeAssignments(
  data: AppData,
  cells: CoverageCell[],
  members: Member[],
  monthFrom: string,
  monthTo: string,
): Proposal[] {
  const load = minutesByMember(data, monthFrom, monthTo)
  const perDay = new Map<string, number>()
  for (const s of data.shifts) perDay.set(`${s.memberId}|${s.date}`, (perDay.get(`${s.memberId}|${s.date}`) ?? 0) + 1)

  // Los turnos que se van proponiendo cuentan como conflictos para los siguientes.
  const working: AppData = { ...data, shifts: [...data.shifts] }
  const out: Proposal[] = []

  for (const cell of cells) {
    const [s, e] = slotInterval(cell.slot, cell.date)
    const candidates = members
      .filter((m) => memberConflicts(working, m.id, s, e).length === 0)
      .sort(
        (a, b) =>
          (perDay.get(`${a.id}|${cell.date}`) ?? 0) - (perDay.get(`${b.id}|${cell.date}`) ?? 0) ||
          (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0) ||
          a.name.localeCompare(b.name),
      )
    const chosen = candidates[0]
    if (chosen) {
      const minutes = slotMinutes(cell.slot)
      load.set(chosen.id, (load.get(chosen.id) ?? 0) + minutes)
      const key = `${chosen.id}|${cell.date}`
      perDay.set(key, (perDay.get(key) ?? 0) + 1)
      working.shifts.push({
        id: `proposal-${cell.date}-${cell.slot.id}`,
        date: cell.date,
        slotId: cell.slot.id,
        memberId: chosen.id,
        note: '',
        seriesId: null,
        coverRequested: false,
      })
    }
    out.push({ cell, memberId: chosen?.id ?? null })
  }
  return out
}
