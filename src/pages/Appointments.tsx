import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Appointment } from '../types'
import { useData } from '../context/DataContext'
import { dateTimeMs, formatInDays, parseISODate } from '../lib/dates'
import { useNow } from '../lib/hooks'
import { AppointmentForm } from '../components/AppointmentForm'
import { Icon } from '../components/Icon'
import { Badge, EmptyState, ListRow, MemberTag, PageHeader, Segmented } from '../components/ui'

const monthAbbr = new Intl.DateTimeFormat('es-ES', { month: 'short' })

export function Appointments() {
  const { data, can } = useData()
  const navigate = useNavigate()
  const now = useNow()
  const [tab, setTab] = useState<'proximas' | 'historial'>('proximas')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const { upcoming, past } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (a: Appointment) =>
      !q || [a.specialty, a.doctor, a.place, a.reason, a.summary].some((f) => f.toLowerCase().includes(q))
    const list = data.appointments.filter(match)
    const isUpcoming = (a: Appointment) => a.status === 'scheduled' && dateTimeMs(a.date, a.time) + 3 * 3600_000 > now
    return {
      upcoming: list.filter(isUpcoming).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
      past: list.filter((a) => !isUpcoming(a)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    }
  }, [data.appointments, query, now])

  const shown = tab === 'proximas' ? upcoming : past

  return (
    <div>
      <PageHeader
        title="Citas médicas"
        subtitle="Quién acompaña, qué preguntar y toda la documentación de cada cita"
        actions={
          can('editAppointments') && (
            <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} /> Nueva cita
            </button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'proximas', label: `Próximas (${upcoming.length})` },
            { value: 'historial', label: 'Historial' },
          ]}
        />
        <input
          type="search"
          className="ap-input !w-full sm:!w-64"
          placeholder="Buscar especialidad, médico…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {shown.length === 0 ? (
        <EmptyState icon="🩺" title={tab === 'proximas' ? 'No hay citas próximas' : 'Aún no hay citas en el historial'}>
          {tab === 'proximas' && can('editAppointments') && 'Añade la próxima cita para organizar quién acompaña.'}
        </EmptyState>
      ) : (
        <ul className="ap-card divide-y overflow-hidden">
          {shown.map((a) => (
            <li key={a.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
              <AppointmentRow appointment={a} />
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <AppointmentForm onClose={() => setCreating(false)} onSaved={(a) => navigate(`/citas/${a.id}`)} />
      )}
    </div>
  )
}

export function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const { data, can, memberById } = useData()
  const companion = memberById(a.companionId)
  const docs = data.documents.filter((d) => d.appointmentId === a.id).length
  const date = parseISODate(a.date)
  return (
    <ListRow to={`/citas/${a.id}`}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[12px]"
          style={{ backgroundColor: a.status === 'cancelled' ? '#f0f0f3' : '#e8f1fb' }}
        >
          <span className="text-[17px] font-semibold leading-none">{date.getDate()}</span>
          <span className="text-[11px] uppercase text-[color:var(--ap-ink-2)]">{monthAbbr.format(date).replace('.', '')}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={`text-[16px] font-semibold ${a.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>
              {a.specialty}
            </span>
            <span className="text-[14px] text-[color:var(--ap-ink-2)]">{a.time}</span>
            {a.status === 'scheduled' && <span className="text-[13px] text-[color:var(--ap-ink-3)]">{formatInDays(a.date)}</span>}
            {a.status === 'cancelled' && <Badge>Cancelada</Badge>}
          </div>
          <div className="truncate text-[14px] text-[color:var(--ap-ink-2)]">
            {[a.place, a.doctor].filter(Boolean).join(' · ') || a.reason}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {companion ? (
              <MemberTag member={companion} />
            ) : a.status === 'scheduled' ? (
              <Badge tone="red">Sin acompañante</Badge>
            ) : null}
            {docs > 0 && can('viewDocuments') && (
              <span className="inline-flex items-center gap-1 text-[13px] text-[color:var(--ap-ink-3)]">
                <Icon name="paperclip" size={14} /> {docs}
              </span>
            )}
          </div>
        </div>
      </div>
    </ListRow>
  )
}
