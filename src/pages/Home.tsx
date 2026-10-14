import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { computeAlerts, type Alert } from '../lib/alerts'
import { dateTimeMs, formatDayLong, formatRelativeDay, msToISODate } from '../lib/dates'
import { useNow } from '../lib/hooks'
import { newId } from '../lib/labels'
import { dosesForDay, formatAmount, isOverdue, overdueDoses } from '../lib/medication'
import { currentShift, slotInterval, upcomingCells } from '../lib/shifts'
import { Icon } from '../components/Icon'
import { MemberTag, Section } from '../components/ui'
import { AppointmentRow } from './Appointments'
import { DiaryItem } from './Diary'

const ALERT_STYLE: Record<Alert['level'], { bg: string; border: string; fg: string }> = {
  danger: { bg: 'var(--loss-bg)', border: 'var(--loss-border)', fg: 'var(--loss)' },
  warn: { bg: 'var(--warn-bg)', border: 'var(--warn-border)', fg: 'var(--warn)' },
  info: { bg: '#eef5fc', border: '#cfe2f6', fg: 'var(--ap-blue)' },
}

export function Home() {
  const { data, me, can, memberById, upsert } = useData()
  const now = useNow()
  const today = msToISODate(now)
  const firstName = data.patient.name.split(' ')[0] || 'la persona cuidada'

  const alerts = computeAlerts(data, me?.id, now)
  const current = currentShift(data, now)
  const currentMember = memberById(current?.shift?.memberId)
  const next = upcomingCells(data, 2, now).find((c) => slotInterval(c.slot, c.date)[0] > now)
  const nextMember = memberById(next?.shift?.memberId)

  const myNext = me
    ? upcomingCells(data, 14, now)
        .filter((c) => c.shift?.memberId === me.id)
        .slice(0, 4)
    : []

  const doses = dosesForDay(data.medications, data.doseLogs, today)
  const given = doses.filter((d) => d.log?.status === 'given').length
  const skipped = doses.filter((d) => d.log?.status === 'skipped').length
  const pending = doses.filter((d) => !d.log)
  // Tomas de ayer (de las últimas horas) que nadie registró, y luego las de hoy de las próximas horas.
  const lateFromYesterday = overdueDoses(data.medications, data.doseLogs, now).filter((d) => d.date !== today)
  const nextDoses = [...lateFromYesterday, ...pending.filter((d) => dateTimeMs(d.date, d.time) <= now + 3 * 3600_000)].slice(0, 4)

  const appointments = data.appointments
    .filter((a) => a.status === 'scheduled' && dateTimeMs(a.date, a.time) > now - 3600_000)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3)

  const weekAgo = now - 7 * 24 * 3600_000
  const diary = [...data.diary]
    .filter((e) => e.at > weekAgo)
    .sort((a, b) => Number(b.important) - Number(a.important) || b.at - a.at)
    .slice(0, 3)

  const take = (shiftId: string) => {
    const sh = data.shifts.find((s) => s.id === shiftId)
    if (sh && me) upsert('shifts', { ...sh, memberId: me.id, coverRequested: false, note: '', seriesId: null })
  }
  const accompany = (appointmentId: string) => {
    const a = data.appointments.find((x) => x.id === appointmentId)
    if (a && me) upsert('appointments', { ...a, companionId: me.id })
  }
  const takeCurrent = () => {
    if (!current || !me) return
    upsert('shifts', {
      ...(current.shift ?? { id: newId(), date: current.date, slotId: current.slot.id }),
      memberId: me.id,
      note: '',
      coverRequested: false,
      seriesId: null,
    })
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-[15px] text-[color:var(--ap-ink-2)]">{formatDayLong(today)}</p>
        <h1 className="text-[30px] leading-tight sm:text-[36px]">Hola, {me?.name}</h1>
      </div>

      {/* Quién está ahora */}
      <div className="ap-card mb-6 grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <p className="ap-label">Ahora con {firstName}</p>
          {current ? (
            currentMember ? (
              <div className="flex flex-wrap items-center gap-2">
                <MemberTag member={currentMember} suffix={currentMember.id === me?.id ? ' (tú)' : ''} />
                <span className="text-[14px] text-[color:var(--ap-ink-2)]">
                  {current.slot.label.toLowerCase()} hasta las {current.slot.end}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[16px] font-semibold" style={{ color: 'var(--loss)' }}>
                  Nadie ({current.slot.label.toLowerCase()} sin cubrir)
                </span>
                {can('takeShifts') && (
                  <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={takeCurrent}>
                    Voy yo
                  </button>
                )}
              </div>
            )
          ) : (
            <span className="text-[15px] text-[color:var(--ap-ink-3)]">No hay ninguna franja ahora mismo.</span>
          )}
        </div>
        {next && (
          <div>
            <p className="ap-label">
              Después · {next.date === today ? '' : `${formatRelativeDay(next.date).toLowerCase()}, `}
              {next.slot.label.toLowerCase()} desde las {next.slot.start}
            </p>
            {nextMember ? (
              <MemberTag member={nextMember} suffix={nextMember.id === me?.id ? ' (tú)' : ''} />
            ) : (
              <span className="text-[16px] font-semibold" style={{ color: 'var(--loss)' }}>
                Sin cubrir
              </span>
            )}
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <Section title="Pendiente">
          <ul className="space-y-2">
            {alerts.map((a) => {
              const st = ALERT_STYLE[a.level]
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 rounded-[16px] border px-4 py-3"
                  style={{ backgroundColor: st.bg, borderColor: st.border }}
                >
                  <span className="text-xl">{a.icon}</span>
                  <Link to={a.to} className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold" style={{ color: st.fg }}>
                      {a.title}
                    </div>
                    {a.detail && <div className="text-[14px] text-[color:var(--ap-ink-2)]">{a.detail}</div>}
                  </Link>
                  {a.shiftId && can('takeShifts') && (
                    <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => take(a.shiftId!)}>
                      Lo cubro yo
                    </button>
                  )}
                  {a.appointmentId && can('takeShifts') && (
                    <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => accompany(a.appointmentId!)}>
                      Le acompaño yo
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      <div className="grid gap-x-6 lg:grid-cols-2">
        <Section
          title="Medicación de hoy"
          action={
            <Link to="/medicacion" className="ap-link text-[15px]">
              Ver todo
            </Link>
          }
        >
          <div className="ap-card p-4">
            {doses.length === 0 && lateFromYesterday.length === 0 ? (
              <p className="text-[15px] text-[color:var(--ap-ink-3)]">No hay tomas programadas hoy.</p>
            ) : (
              <>
                {doses.length > 0 && (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-[15px]">
                        <strong>{given}</strong> de {doses.length} tomas dadas
                        {skipped > 0 && (
                          <span style={{ color: 'var(--loss)' }}>
                            {' '}
                            · {skipped} {skipped === 1 ? 'no tomada' : 'no tomadas'}
                          </span>
                        )}
                      </span>
                      {given === doses.length && <span style={{ color: 'var(--win)' }}>✓ Todo dado</span>}
                    </div>
                    <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ap-hairline-soft)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${(given / doses.length) * 100}%`, backgroundColor: 'var(--win)' }} />
                    </div>
                  </>
                )}
                {nextDoses.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {nextDoses.map((d) => (
                      <li key={d.date + d.med.id + d.time} className="flex items-center gap-2 text-[15px]">
                        <span className="min-w-[3rem] shrink-0 font-medium" style={{ color: isOverdue(d, now) ? 'var(--loss)' : undefined }}>
                          {d.date !== today && 'ayer '}
                          {d.time}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {d.med.name} · {formatAmount(d.amount, d.med.form)}
                        </span>
                        {can('logDoses') && me && (
                          <button
                            type="button"
                            className="ap-btn ap-btn-sm ap-btn-ghost !py-1"
                            onClick={() =>
                              upsert('doseLogs', {
                                id: newId(),
                                medicationId: d.med.id,
                                date: d.date,
                                time: d.time,
                                status: 'given',
                                memberId: me.id,
                                at: Date.now(),
                                amount: d.amount,
                                note: '',
                              })
                            }
                          >
                            <Icon name="check" size={14} /> Dada
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </Section>

        <Section
          title="Tus próximos turnos"
          action={
            <Link to="/agenda" className="ap-link text-[15px]">
              Agenda
            </Link>
          }
        >
          <div className="ap-card p-4">
            {myNext.length === 0 ? (
              <p className="text-[15px] text-[color:var(--ap-ink-3)]">No tienes turnos en las próximas dos semanas.</p>
            ) : (
              <ul className="space-y-1.5 text-[15px]">
                {myNext.map((c) => (
                  <li key={c.date + c.slot.id} className="flex items-center justify-between gap-2">
                    <span>
                      <strong>{formatRelativeDay(c.date)}</strong> · {c.slot.label}
                    </span>
                    <span className="text-[color:var(--ap-ink-2)]">
                      {c.slot.start}–{c.slot.end}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      </div>

      <Section
        title="Próximas citas"
        action={
          <Link to="/citas" className="ap-link text-[15px]">
            Todas
          </Link>
        }
      >
        {appointments.length === 0 ? (
          <p className="ap-card p-4 text-[15px] text-[color:var(--ap-ink-3)]">No hay citas programadas.</p>
        ) : (
          <ul className="ap-card divide-y overflow-hidden">
            {appointments.map((a) => (
              <li key={a.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                <AppointmentRow appointment={a} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Diario"
        action={
          <Link to="/diario" className="ap-link text-[15px]">
            {can('writeDiary') ? 'Escribir' : 'Ver todo'}
          </Link>
        }
      >
        {diary.length === 0 ? (
          <p className="ap-card p-4 text-[15px] text-[color:var(--ap-ink-3)]">Sin notas esta semana.</p>
        ) : (
          <ul className="space-y-2">
            {diary.map((e) => (
              <DiaryItem key={e.id} entry={e} compact />
            ))}
          </ul>
        )}
      </Section>

      {data.members.length === 1 && can('manageMembers') && (
        <Link to="/familia" className="ap-card mb-6 flex items-center gap-3 p-4" style={{ borderColor: 'var(--ap-blue)' }}>
          <span className="text-2xl">👨‍👩‍👧</span>
          <div className="flex-1">
            <div className="text-[16px] font-semibold">Añade a tu familia y a la cuidadora</div>
            <div className="text-[14px] text-[color:var(--ap-ink-2)]">Para repartir turnos, citas y gastos entre todos.</div>
          </div>
          <Icon name="chevronRight" size={18} />
        </Link>
      )}
    </div>
  )
}
