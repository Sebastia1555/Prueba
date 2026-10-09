import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { CareSlot } from '../types'
import { useData } from '../context/DataContext'
import {
  addDays,
  addMonths,
  dateRange,
  dateTimeMs,
  endOfMonth,
  formatDayLong,
  formatDayShort,
  formatHours,
  formatMonth,
  msToTime,
  startOfMonth,
  startOfWeek,
  todayISO,
  WEEKDAYS,
} from '../lib/dates'
import { newId } from '../lib/labels'
import { conflictLabel, coverage, memberConflicts, minutesByMember, slotsForDay } from '../lib/shifts'
import { ShiftModal } from '../components/ShiftModal'
import { ProposalModal } from '../components/ProposalModal'
import { Icon } from '../components/Icon'
import { Avatar, Badge, MemberTag, PageHeader, Section, Segmented } from '../components/ui'

type View = 'semana' | 'mes'

export function Agenda() {
  const { data, me, can, upsert } = useData()
  const [params, setParams] = useSearchParams()
  const view: View = params.get('vista') === 'mes' ? 'mes' : 'semana'
  const anchor = params.get('fecha') ?? todayISO()
  const [editing, setEditing] = useState<{ date: string; slot: CareSlot } | null>(null)
  const [proposing, setProposing] = useState(false)
  const [showMine, setShowMine] = useState(true)

  const go = (next: { vista?: View; fecha?: string }) => {
    const p = new URLSearchParams(params)
    if (next.vista) p.set('vista', next.vista)
    if (next.fecha) p.set('fecha', next.fecha)
    setParams(p, { replace: true })
  }

  const weekFrom = startOfWeek(anchor)
  const weekTo = addDays(weekFrom, 6)
  const monthFrom = startOfMonth(anchor)
  const monthTo = endOfMonth(anchor)
  const [from, to] = view === 'semana' ? [weekFrom, weekTo] : [monthFrom, monthTo]

  const rangeLabel =
    view === 'semana'
      ? `${formatDayShort(weekFrom)} – ${formatDayShort(weekTo)}`
      : formatMonth(monthFrom)

  const prev = () => go({ fecha: view === 'semana' ? addDays(weekFrom, -7) : addMonths(monthFrom, -1) })
  const next = () => go({ fecha: view === 'semana' ? addDays(weekFrom, 7) : addMonths(monthFrom, 1) })

  const takeSlot = (date: string, slot: CareSlot) => {
    if (!me) return
    const existing = data.shifts.find((s) => s.date === date && s.slotId === slot.id)
    upsert('shifts', {
      ...(existing ?? { id: newId(), date, slotId: slot.id, seriesId: null }),
      memberId: me.id,
      note: '',
      coverRequested: false,
    })
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle={`Quién está con ${data.patient.name.split(' ')[0] || 'la persona cuidada'} en cada momento`}
        actions={
          <>
            <Link to="/disponibilidad" className="ap-btn ap-btn-sm ap-btn-neutral">
              <Icon name="user" size={16} /> Mi disponibilidad
            </Link>
            {can('editShifts') && (
              <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => setProposing(true)}>
                <Icon name="sparkles" size={16} /> Proponer reparto
              </button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={view}
          onChange={(v) => go({ vista: v })}
          options={[
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' },
          ]}
        />
        <div className="flex items-center gap-1">
          <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet !px-2" onClick={prev} aria-label="Anterior">
            <Icon name="chevronLeft" />
          </button>
          <span className="min-w-[9.5rem] text-center text-[15px] font-semibold">{rangeLabel}</span>
          <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet !px-2" onClick={next} aria-label="Siguiente">
            <Icon name="chevronRight" />
          </button>
          <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral ml-1" onClick={() => go({ fecha: todayISO() })}>
            Hoy
          </button>
        </div>
      </div>

      {data.slots.length === 0 ? (
        <p className="ap-card p-5 text-[15px]">
          No hay franjas de cuidado definidas. Configúralas en{' '}
          <Link to="/ajustes" className="ap-link">
            Ajustes
          </Link>
          .
        </p>
      ) : view === 'semana' ? (
        <>
          {me && (
            <div className="mb-3 flex justify-end">
              <label className="flex items-center gap-2 text-[14px] text-[color:var(--ap-ink-2)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[color:var(--ap-blue)]"
                  checked={showMine}
                  onChange={(e) => setShowMine(e.target.checked)}
                />
                Mostrar mis compromisos personales
              </label>
            </div>
          )}
          <div className="space-y-3">
            {dateRange(weekFrom, weekTo).map((date) => (
              <DayCard
                key={date}
                date={date}
                showMine={showMine}
                onOpen={(slot) => setEditing({ date, slot })}
                onTake={takeSlot}
              />
            ))}
          </div>
        </>
      ) : (
        <MonthGrid from={monthFrom} to={monthTo} onPick={(date) => go({ vista: 'semana', fecha: date })} />
      )}

      <Fairness from={monthFrom} to={monthTo} />

      {editing && <ShiftModal date={editing.date} slot={editing.slot} onClose={() => setEditing(null)} />}
      {proposing && (
        <ProposalModal from={from} to={to} rangeLabel={view === 'semana' ? 'esta semana' : formatMonth(monthFrom).toLowerCase()} onClose={() => setProposing(false)} />
      )}
    </div>
  )
}

function DayCard({
  date,
  showMine,
  onOpen,
  onTake,
}: {
  date: string
  showMine: boolean
  onOpen: (slot: CareSlot) => void
  onTake: (date: string, slot: CareSlot) => void
}) {
  const { data, me, can, memberById } = useData()
  const today = todayISO()
  const isToday = date === today
  const isPast = date < today
  const slots = slotsForDay(data.slots, date)
  const appointments = data.appointments
    .filter((a) => a.date === date && a.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time))

  const personal = useMemo(() => {
    if (!me || !showMine) return []
    return memberConflicts(data, me.id, dateTimeMs(date, '00:00'), dateTimeMs(addDays(date, 1), '00:00')).filter(
      (c) => c.kind === 'busy' || c.kind === 'calendar',
    )
  }, [data, me, showMine, date])

  return (
    <div
      className={`ap-card overflow-hidden ${isPast ? 'opacity-70' : ''}`}
      style={isToday ? { borderColor: 'var(--ap-blue)', boxShadow: '0 0 0 1px var(--ap-blue)' } : undefined}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h3 className="text-[17px]">{formatDayLong(date)}</h3>
        {isToday && <Badge tone="blue">Hoy</Badge>}
      </div>
      <ul>
        {slots.map((slot) => {
          const shift = data.shifts.find((s) => s.date === date && s.slotId === slot.id)
          const member = memberById(shift?.memberId)
          const mine = !!me && shift?.memberId === me.id
          return (
            <li key={slot.id} className="border-t first:border-t-0" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
              <div className="flex items-center gap-3 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onOpen(slot)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="w-[5.5rem] shrink-0">
                    <div className="text-[15px] font-medium">{slot.label}</div>
                    <div className="text-[12px] text-[color:var(--ap-ink-3)]">
                      {slot.start}–{slot.end}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {member ? (
                      <MemberTag member={member} suffix={mine ? ' (tú)' : ''} />
                    ) : (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[14px] font-medium"
                        style={{ backgroundColor: 'var(--loss-bg)', color: 'var(--loss)' }}
                      >
                        Sin cubrir
                      </span>
                    )}
                    {shift?.coverRequested && <Badge tone="amber">Busca sustituto</Badge>}
                    {shift?.note && !shift.coverRequested && (
                      <span className="truncate text-[13px] text-[color:var(--ap-ink-3)]">{shift.note}</span>
                    )}
                  </div>
                </button>
                {!isPast && can('takeShifts') && me && (!shift || (shift.coverRequested && !mine)) && (
                  <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost shrink-0" onClick={() => onTake(date, slot)}>
                    {shift ? 'Lo cubro' : 'Me lo quedo'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {(appointments.length > 0 || personal.length > 0) && (
        <div className="space-y-1 border-t px-4 py-2.5" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
          {appointments.map((a) => {
            const companion = memberById(a.companionId)
            return (
              <Link key={a.id} to={`/citas/${a.id}`} className="flex items-center gap-2 text-[14px]">
                <span>🩺</span>
                <span className="font-medium">
                  {a.time} {a.specialty}
                </span>
                <span className="text-[color:var(--ap-ink-3)]">·</span>
                {companion ? (
                  <span className="text-[color:var(--ap-ink-2)]">acompaña {companion.name}</span>
                ) : (
                  <span style={{ color: 'var(--loss)' }}>sin acompañante</span>
                )}
              </Link>
            )
          })}
          {personal.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px] text-[color:var(--ap-ink-3)]">
              <Icon name="lock" size={13} />
              <span>
                Tú: {conflictLabel(c, me?.id)} ·{' '}
                {c.end - c.start >= 23 * 3600_000 ? 'todo el día' : `${msToTime(c.start)}–${msToTime(c.end)}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MonthGrid({ from, to, onPick }: { from: string; to: string; onPick: (date: string) => void }) {
  const { data, memberById } = useData()
  const gridFrom = startOfWeek(from)
  const gridTo = addDays(startOfWeek(to), 6)
  const cells = useMemo(() => coverage(data, gridFrom, gridTo), [data, gridFrom, gridTo])
  const today = todayISO()

  return (
    <div className="ap-card overflow-hidden p-2 sm:p-3">
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[12px] font-semibold text-[color:var(--ap-ink-3)]">
        {WEEKDAYS.map((w) => (
          <div key={w.n}>{w.short}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dateRange(gridFrom, gridTo).map((date) => {
          const inMonth = date >= from && date <= to
          const dayCells = cells.filter((c) => c.date === date)
          const gaps = dayCells.filter((c) => !c.shift).length
          const hasAppt = data.appointments.some((a) => a.date === date && a.status === 'scheduled')
          return (
            <button
              key={date}
              type="button"
              onClick={() => onPick(date)}
              className="flex min-h-[4.5rem] flex-col rounded-[10px] p-1 text-left transition-colors hover:bg-black/[0.03]"
              style={{
                opacity: inMonth ? 1 : 0.35,
                backgroundColor: date === today ? '#e8f1fb' : undefined,
              }}
              aria-label={`${formatDayLong(date)}${gaps ? `, ${gaps} sin cubrir` : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[13px] ${date === today ? 'font-bold text-[color:var(--ap-blue)]' : 'font-medium'}`}>
                  {Number(date.slice(8))}
                </span>
                {hasAppt && <span className="text-[11px]">🩺</span>}
              </div>
              <div className="mt-1 flex flex-col gap-[3px]">
                {dayCells.map((c) => {
                  const m = memberById(c.shift?.memberId)
                  return (
                    <span
                      key={c.slot.id}
                      title={`${c.slot.label}: ${m?.name ?? 'sin cubrir'}`}
                      className="block h-[7px] rounded-full"
                      style={
                        m
                          ? { backgroundColor: m.color }
                          : { backgroundColor: 'var(--loss-bg)', boxShadow: 'inset 0 0 0 1.5px var(--loss)' }
                      }
                    />
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[13px] text-[color:var(--ap-ink-2)]">
        {data.members.map((m) => (
          <span key={m.id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} /> {m.name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ boxShadow: 'inset 0 0 0 1.5px var(--loss)' }} /> Sin cubrir
        </span>
      </div>
    </div>
  )
}

/** Reparto de horas del mes entre las personas que cuidan. */
function Fairness({ from, to }: { from: string; to: string }) {
  const { data } = useData()
  const load = useMemo(() => minutesByMember(data, from, to), [data, from, to])
  const cells = useMemo(() => coverage(data, from, to), [data, from, to])
  const covered = cells.filter((c) => c.shift).length
  const max = Math.max(1, ...load.values())
  const companions = new Map<string, number>()
  for (const a of data.appointments) {
    if (a.companionId && a.status !== 'cancelled' && a.date >= from && a.date <= to) {
      companions.set(a.companionId, (companions.get(a.companionId) ?? 0) + 1)
    }
  }
  if (!data.members.length) return null

  return (
    <Section
      className="mt-6"
      title={`Reparto de ${formatMonth(from).toLowerCase()}`}
      action={
        <span className="text-[14px] text-[color:var(--ap-ink-2)]">
          {cells.length ? Math.round((covered / cells.length) * 100) : 100}% cubierto
        </span>
      }
    >
      <div className="ap-card space-y-3 p-4">
        {[...data.members]
          .sort((a, b) => (load.get(b.id) ?? 0) - (load.get(a.id) ?? 0))
          .map((m) => {
            const minutes = load.get(m.id) ?? 0
            const appts = companions.get(m.id) ?? 0
            return (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar member={m} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-[14px]">
                    <span className="truncate font-medium">
                      {m.name} <span className="font-normal text-[color:var(--ap-ink-3)]">· {m.relation}</span>
                    </span>
                    <span className="shrink-0 text-[color:var(--ap-ink-2)]">
                      {formatHours(minutes)}
                      {appts > 0 && ` · ${appts} ${appts === 1 ? 'cita' : 'citas'}`}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full" style={{ backgroundColor: 'var(--ap-hairline-soft)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${(minutes / max) * 100}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </Section>
  )
}
