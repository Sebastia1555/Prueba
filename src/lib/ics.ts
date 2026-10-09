// Importación y exportación de calendarios iCalendar (.ics): lo que entienden
// Google Calendar, Apple Calendar y Outlook.

import ICAL from 'ical.js'
import type { AppData, CalendarEvent } from '../types'
import { addDays, DAY_MS, dateTimeMs, todayISO } from './dates'
import { DEFAULT_APPOINTMENT_MINUTES, slotInterval } from './shifts'

/** Ventana de eventos que se guardan: 1 semana atrás y 1 año adelante. */
const PAST_DAYS = 7
const FUTURE_DAYS = 365
const MAX_ITERATIONS = 20_000

type IcalComponent = InstanceType<typeof ICAL.Component>
type IcalEvent = InstanceType<typeof ICAL.Event>
type IcalTime = InstanceType<typeof ICAL.Time>

export function parseIcs(text: string, now = Date.now()): CalendarEvent[] {
  const root = new ICAL.Component(ICAL.parse(text))
  for (const tz of root.getAllSubcomponents('vtimezone')) {
    try {
      ICAL.TimezoneService.register(tz)
    } catch {
      // zona horaria inválida: se tratará como hora local
    }
  }

  const windowStart = now - PAST_DAYS * DAY_MS
  const windowEnd = now + FUTURE_DAYS * DAY_MS

  const vevents = root.getAllSubcomponents('vevent')
  const masters = new Map<string, IcalEvent>()
  const exceptions: IcalComponent[] = []
  const singles: IcalEvent[] = []

  for (const comp of vevents) {
    if (comp.hasProperty('recurrence-id')) {
      exceptions.push(comp)
      continue
    }
    const ev = new ICAL.Event(comp)
    if (ev.isRecurring()) masters.set(ev.uid, ev)
    else singles.push(ev)
  }
  for (const ex of exceptions) {
    const master = masters.get(String(ex.getFirstPropertyValue('uid') ?? ''))
    if (master) master.relateException(ex)
    else singles.push(new ICAL.Event(ex))
  }

  const out: CalendarEvent[] = []
  const push = (comp: IcalComponent, title: string, start: IcalTime, end: IcalTime) => {
    if (isFree(comp)) return
    const s = start.toJSDate().getTime()
    let e = end.toJSDate().getTime()
    if (e <= s) e = s + (start.isDate ? DAY_MS : 60 * 60 * 1000)
    if (e < windowStart || s > windowEnd) return
    out.push({ start: s, end: e, title: title || 'Ocupado', allDay: start.isDate })
  }

  for (const ev of singles) {
    push(ev.component, ev.summary, ev.startDate, ev.endDate ?? ev.startDate)
  }

  for (const ev of masters.values()) {
    const it = ev.iterator()
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const next = it.next()
      if (!next) break
      if (next.toJSDate().getTime() > windowEnd) break
      const details = ev.getOccurrenceDetails(next)
      push(details.item.component, details.item.summary, details.startDate, details.endDate)
    }
  }

  return out.sort((a, b) => a.start - b.start)
}

function isFree(comp: IcalComponent): boolean {
  const status = String(comp.getFirstPropertyValue('status') ?? '').toUpperCase()
  const transp = String(comp.getFirstPropertyValue('transp') ?? '').toUpperCase()
  return status === 'CANCELLED' || transp === 'TRANSPARENT'
}

export function normalizeCalendarUrl(url: string): string {
  return url.trim().replace(/^webcals?:\/\//i, 'https://')
}

export async function fetchIcs(url: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(normalizeCalendarUrl(url), { cache: 'no-store' })
  } catch {
    throw new Error(
      'Tu proveedor de calendario no deja leerlo directamente desde el navegador. ' +
        'Descarga el calendario como archivo .ics e impórtalo desde aquí.',
    )
  }
  if (!res.ok) throw new Error(`No se pudo descargar el calendario (error ${res.status}).`)
  const text = await res.text()
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('El enlace no devuelve un calendario .ics válido.')
  return text
}

// --- Exportación -------------------------------------------------------------

function utcStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

/** Divide las líneas largas como pide el estándar (75 octetos). */
function fold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const ch of line) {
    const len = enc.encode(ch).length
    const limit = parts.length === 0 ? 75 : 74
    if (size + len > limit) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += ch
    size += len
  }
  parts.push(current)
  return parts.join('\r\n ')
}

export interface ExportEvent {
  uid: string
  start: number
  end: number
  title: string
  description?: string
  location?: string
}

export function buildIcs(calendarName: string, events: ExportEvent[]): string {
  const stamp = utcStamp(Date.now())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cuidamos//Agenda de cuidados//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ]
  for (const ev of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}@cuidamos`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utcStamp(ev.start)}`,
      `DTEND:${utcStamp(ev.end)}`,
      `SUMMARY:${escapeText(ev.title)}`,
    )
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`)
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

/**
 * Turnos y acompañamientos a citas desde hace una semana. Si se indica
 * `memberId`, solo los de esa persona.
 */
export function careEvents(data: AppData, memberId: string | null): ExportEvent[] {
  const from = addDays(todayISO(), -PAST_DAYS)
  const patient = data.patient.name || 'la persona cuidada'
  const slots = new Map(data.slots.map((s) => [s.id, s]))
  const names = new Map(data.members.map((m) => [m.id, m.name]))
  const events: ExportEvent[] = []

  for (const sh of data.shifts) {
    if (sh.date < from || (memberId && sh.memberId !== memberId)) continue
    const slot = slots.get(sh.slotId)
    if (!slot) continue
    const [start, end] = slotInterval(slot, sh.date)
    const who = memberId ? '' : ` · ${names.get(sh.memberId) ?? ''}`
    events.push({
      uid: `turno-${sh.id}`,
      start,
      end,
      title: `Cuidar a ${patient} (${slot.label.toLowerCase()})${who}`,
      description: sh.note || undefined,
      location: data.patient.address || undefined,
    })
  }

  for (const a of data.appointments) {
    if (a.status !== 'scheduled' || a.date < from) continue
    if (memberId && a.companionId !== memberId) continue
    const start = dateTimeMs(a.date, a.time)
    const companion = a.companionId ? names.get(a.companionId) : 'sin acompañante'
    const details = [
      a.reason && `Motivo: ${a.reason}`,
      a.doctor && `Médico: ${a.doctor}`,
      `Acompaña: ${companion}`,
      a.preparation && `Preparación: ${a.preparation}`,
      a.transport && `Transporte: ${a.transport}`,
    ]
    events.push({
      uid: `cita-${a.id}`,
      start,
      end: start + (a.durationMin || DEFAULT_APPOINTMENT_MINUTES) * 60_000,
      title: `Cita ${a.specialty} de ${patient}`,
      description: details.filter(Boolean).join('\n'),
      location: [a.place, a.address].filter(Boolean).join(', ') || undefined,
    })
  }

  return events.sort((a, b) => a.start - b.start)
}
