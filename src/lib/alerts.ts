import type { AppData } from '../types'
import { addDays, dateTimeMs, diffDays, formatDayMedium, formatDayShort, formatInDays, msToISODate } from './dates'
import { dosesForDay, isOverdue, prescriptionDaysLeft, stockStatus } from './medication'
import { coverage, slotInterval } from './shifts'

export type AlertLevel = 'danger' | 'warn' | 'info'

export interface Alert {
  id: string
  level: AlertLevel
  icon: string
  title: string
  detail?: string
  to: string
  /** Turno que pide sustituto (para ofrecer "Lo cubro yo"). */
  shiftId?: string
  /** Cita sin acompañante (para ofrecer "Le acompaño yo"). */
  appointmentId?: string
}

const LEVEL_ORDER: Record<AlertLevel, number> = { danger: 0, warn: 1, info: 2 }

export const PRESCRIPTION_ALERT_DAYS = 15
export const COMPANION_ALERT_DAYS = 14
export const COVERAGE_ALERT_DAYS = 7

export function computeAlerts(data: AppData, meId: string | undefined, now = Date.now()): Alert[] {
  const today = msToISODate(now)
  const names = new Map(data.members.map((m) => [m.id, m.name]))
  const alerts: Alert[] = []

  // Franjas sin cubrir en los próximos días.
  const gaps = coverage(data, today, addDays(today, COVERAGE_ALERT_DAYS - 1)).filter(
    (c) => !c.shift && slotInterval(c.slot, c.date)[1] > now,
  )
  if (gaps.length) {
    const soon = gaps.some((g) => slotInterval(g.slot, g.date)[0] - now < 48 * 3600_000)
    alerts.push({
      id: 'gaps',
      level: soon ? 'danger' : 'warn',
      icon: '🗓️',
      title:
        gaps.length === 1
          ? '1 franja sin cubrir esta semana'
          : `${gaps.length} franjas sin cubrir esta semana`,
      detail: gaps
        .slice(0, 3)
        .map((g) => `${formatDayMedium(g.date)} · ${g.slot.label}`)
        .join(' · ') + (gaps.length > 3 ? '…' : ''),
      to: '/agenda',
    })
  }

  // Turnos en los que alguien busca sustituto.
  const slots = new Map(data.slots.map((s) => [s.id, s]))
  for (const sh of data.shifts) {
    if (!sh.coverRequested) continue
    const slot = slots.get(sh.slotId)
    if (!slot || slotInterval(slot, sh.date)[1] <= now) continue
    const mine = sh.memberId === meId
    alerts.push({
      id: `cover-${sh.id}`,
      level: 'warn',
      icon: '🔁',
      title: mine
        ? `Has pedido sustituto para el ${formatDayMedium(sh.date)} (${slot.label.toLowerCase()})`
        : `${names.get(sh.memberId) ?? 'Alguien'} busca sustituto`,
      detail: mine ? 'Aún no lo ha cogido nadie.' : `${formatDayMedium(sh.date)} · ${slot.label} (${slot.start}–${slot.end})`,
      to: '/agenda',
      shiftId: mine ? undefined : sh.id,
    })
  }

  // Tomas atrasadas hoy.
  const overdue = dosesForDay(data.medications, data.doseLogs, today).filter((d) => isOverdue(d, now))
  if (overdue.length) {
    alerts.push({
      id: 'overdue',
      level: 'danger',
      icon: '⏰',
      title: overdue.length === 1 ? '1 toma sin registrar' : `${overdue.length} tomas sin registrar`,
      detail: overdue
        .slice(0, 3)
        .map((d) => `${d.time} ${d.med.name}`)
        .join(' · '),
      to: '/medicacion',
    })
  }

  // Stock y recetas.
  for (const med of data.medications) {
    if (!med.active) continue
    const st = stockStatus(med, data.doseLogs, now)
    const buyer = med.purchaseClaimedBy ? names.get(med.purchaseClaimedBy) : null
    const who = buyer ? `Se encarga ${buyer}.` : 'Nadie se ha encargado aún de comprarlo.'
    if (st.level === 'out') {
      alerts.push({
        id: `stock-${med.id}`,
        level: 'danger',
        icon: '💊',
        title: `No queda ${med.name}`,
        detail: who,
        to: '/medicacion?vista=stock',
      })
    } else if (st.level === 'low' && st.runOutDate) {
      alerts.push({
        id: `stock-${med.id}`,
        level: buyer ? 'info' : 'warn',
        icon: '💊',
        title: `${med.name} se acaba ${formatInDays(st.runOutDate)} (${formatDayShort(st.runOutDate)})`,
        detail: who,
        to: '/medicacion?vista=stock',
      })
    }

    const rx = prescriptionDaysLeft(med)
    if (rx !== null && rx <= PRESCRIPTION_ALERT_DAYS) {
      alerts.push({
        id: `rx-${med.id}`,
        level: rx < 0 ? 'danger' : 'warn',
        icon: '📋',
        title: rx < 0 ? `Receta de ${med.name} caducada` : `Receta de ${med.name} caduca ${formatInDays(med.prescriptionExpires)}`,
        detail: 'Pide cita para renovarla.',
        to: '/medicacion?vista=stock',
      })
    }
  }

  // Citas próximas sin acompañante y preparación para mañana.
  for (const a of data.appointments) {
    if (a.status !== 'scheduled' || dateTimeMs(a.date, a.time) < now) continue
    const days = diffDays(today, a.date)
    if (!a.companionId && days <= COMPANION_ALERT_DAYS) {
      alerts.push({
        id: `companion-${a.id}`,
        level: days <= 2 ? 'danger' : 'warn',
        icon: '🩺',
        title: `Cita de ${a.specialty} sin acompañante`,
        detail: `${formatDayMedium(a.date)} a las ${a.time}${a.place ? ` · ${a.place}` : ''}`,
        to: `/citas/${a.id}`,
        appointmentId: a.id,
      })
    }
    if (a.preparation && days <= 1) {
      alerts.push({
        id: `prep-${a.id}`,
        level: 'info',
        icon: '📌',
        title: `${days === 0 ? 'Hoy' : 'Mañana'}: ${a.specialty} a las ${a.time}`,
        detail: a.preparation,
        to: `/citas/${a.id}`,
      })
    }
  }

  return alerts.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
}
