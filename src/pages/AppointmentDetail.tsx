import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { dateTimeMs, formatDayLong, formatInDays } from '../lib/dates'
import { buildIcs } from '../lib/ics'
import { downloadBlob } from '../lib/labels'
import { DEFAULT_APPOINTMENT_MINUTES, memberConflicts } from '../lib/shifts'
import { AppointmentForm } from '../components/AppointmentForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DocumentList, DocumentUploadButton } from '../components/Documents'
import { Icon } from '../components/Icon'
import { Badge, EmptyState, MemberTag, Notice, Section } from '../components/ui'

export function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, me, can, memberById, upsert, remove } = useData()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const a = data.appointments.find((x) => x.id === id)

  if (!a) {
    return (
      <EmptyState icon="🔍" title="Cita no encontrada">
        <Link to="/citas" className="ap-link">
          Volver a las citas
        </Link>
      </EmptyState>
    )
  }

  const companion = memberById(a.companionId)
  const docs = data.documents.filter((d) => d.appointmentId === a.id).sort((x, y) => y.date.localeCompare(x.date))
  const start = dateTimeMs(a.date, a.time)
  const end = start + (a.durationMin || DEFAULT_APPOINTMENT_MINUTES) * 60_000
  const isPast = end < Date.now()
  const canEdit = can('editAppointments')
  const questions = a.questions.split('\n').map((q) => q.trim()).filter(Boolean)
  const myConflicts = me && !a.companionId ? memberConflicts(data, me.id, start, end, { appointmentId: a.id }) : []

  const accompany = () => me && upsert('appointments', { ...a, companionId: me.id })

  const exportIcs = () => {
    const ics = buildIcs(`Cita ${a.specialty}`, [
      {
        uid: `cita-${a.id}`,
        start,
        end,
        title: `Cita ${a.specialty} de ${data.patient.name}`,
        description: [a.reason, a.preparation && `Preparación: ${a.preparation}`, companion && `Acompaña: ${companion.name}`]
          .filter(Boolean)
          .join('\n'),
        location: [a.place, a.address].filter(Boolean).join(', '),
      },
    ])
    downloadBlob(new Blob([ics], { type: 'text/calendar' }), `cita-${a.specialty.toLowerCase().replace(/\s+/g, '-')}-${a.date}.ics`)
  }

  return (
    <div>
      <Link to="/citas" className="ap-btn ap-btn-sm ap-btn-quiet -ml-3 mb-2">
        <Icon name="chevronLeft" size={16} /> Citas
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight sm:text-[34px]">{a.specialty}</h1>
          <p className="mt-1 text-[17px]">
            {formatDayLong(a.date)} a las {a.time}{' '}
            {a.status === 'scheduled' && <span className="text-[color:var(--ap-ink-3)]">({formatInDays(a.date)})</span>}
          </p>
          <div className="mt-2 flex gap-2">
            {a.status === 'done' && <Badge tone="green">Realizada</Badge>}
            {a.status === 'cancelled' && <Badge>Cancelada</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {a.status === 'scheduled' && (
            <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={exportIcs}>
              <Icon name="calendar" size={16} /> A mi calendario
            </button>
          )}
          {canEdit && (
            <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => setEditing(true)}>
              <Icon name="edit" size={16} /> Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="ap-card space-y-3 p-4 text-[15px]">
          {a.place && (
            <div className="flex gap-2">
              <Icon name="mapPin" size={18} className="mt-0.5 shrink-0 text-[color:var(--ap-ink-3)]" />
              <div>
                <div className="font-medium">{a.place}</div>
                {a.address && <div className="text-[color:var(--ap-ink-2)]">{a.address}</div>}
                <a
                  className="ap-link text-[14px]"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([a.place, a.address].filter(Boolean).join(', '))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en el mapa
                </a>
              </div>
            </div>
          )}
          {a.doctor && (
            <div className="flex gap-2">
              <Icon name="stethoscope" size={18} className="mt-0.5 shrink-0 text-[color:var(--ap-ink-3)]" />
              {a.doctor}
            </div>
          )}
          {a.reason && <p><span className="text-[color:var(--ap-ink-2)]">Motivo:</span> {a.reason}</p>}
          {a.transport && <p><span className="text-[color:var(--ap-ink-2)]">Transporte:</span> {a.transport}</p>}
          {a.preparation && (
            <Notice tone="amber" icon="alert">
              <strong>Preparación:</strong> {a.preparation}
            </Notice>
          )}
        </div>

        <div className="ap-card p-4">
          <p className="ap-label">Acompaña</p>
          {companion ? (
            <div className="flex flex-wrap items-center gap-2">
              <MemberTag member={companion} suffix={companion.id === me?.id ? ' (tú)' : ''} />
              {companion.phone && (
                <a href={`tel:${companion.phone.replace(/\s/g, '')}`} className="ap-link text-[14px]">
                  {companion.phone}
                </a>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[15px]" style={{ color: 'var(--loss)' }}>
                Todavía no hay nadie.
              </p>
              {a.status === 'scheduled' && !isPast && me && can('takeShifts') && (
                <>
                  {myConflicts.length > 0 && (
                    <p className="mt-1 text-[13px]" style={{ color: 'var(--warn)' }}>
                      Ojo: a esa hora tienes {myConflicts.length === 1 ? 'otro compromiso' : `${myConflicts.length} compromisos`}.
                    </p>
                  )}
                  <button type="button" className="ap-btn ap-btn-sm ap-btn-primary mt-2" onClick={accompany}>
                    Le acompaño yo
                  </button>
                </>
              )}
            </div>
          )}

          {questions.length > 0 && (
            <div className="mt-4">
              <p className="ap-label">Preguntas para el médico</p>
              <ul className="space-y-1 text-[15px]">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[color:var(--ap-blue)]">?</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {(isPast || a.status === 'done' || a.summary) && a.status !== 'cancelled' && (
        <Section title="Qué dijo el médico" className="mt-6">
          <div className="ap-card p-4">
            {summary !== null ? (
              <>
                <textarea
                  className="ap-input min-h-[7rem]"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Diagnóstico, cambios de medicación, próximas pruebas…"
                  autoFocus
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => setSummary(null)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="ap-btn ap-btn-sm ap-btn-primary"
                    onClick={() => {
                      upsert('appointments', { ...a, summary: summary.trim(), status: 'done' })
                      setSummary(null)
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </>
            ) : a.summary ? (
              <>
                <p className="whitespace-pre-line text-[15px]">{a.summary}</p>
                {a.followUp && (
                  <p className="mt-2 text-[15px]">
                    <span className="font-medium">Próximos pasos:</span> {a.followUp}
                  </p>
                )}
                {canEdit && (
                  <button type="button" className="ap-link mt-2 text-[14px]" onClick={() => setSummary(a.summary)}>
                    Editar resumen
                  </button>
                )}
              </>
            ) : canEdit || me?.id === a.companionId ? (
              <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost" onClick={() => setSummary('')}>
                Escribir resumen de la consulta
              </button>
            ) : (
              <p className="text-[15px] text-[color:var(--ap-ink-3)]">Aún no hay resumen.</p>
            )}
          </div>
        </Section>
      )}

      {can('viewDocuments') && (
        <Section
          title={`Documentos${docs.length ? ` (${docs.length})` : ''}`}
          className="mt-6"
          action={
            can('editDocuments') && (
              <DocumentUploadButton appointmentId={a.id} defaultDate={a.date} label="Adjuntar" className="ap-btn ap-btn-sm ap-btn-ghost" />
            )
          }
        >
          {docs.length ? (
            <DocumentList documents={docs} showAppointment={false} />
          ) : (
            <p className="ap-card p-4 text-[15px] text-[color:var(--ap-ink-3)]">
              Adjunta el volante, el informe, las analíticas o una foto de la receta.
            </p>
          )}
        </Section>
      )}

      {canEdit && (
        <div className="mt-8 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
          {a.status === 'scheduled' && (
            <>
              <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => upsert('appointments', { ...a, status: 'done' })}>
                Marcar como realizada
              </button>
              <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => upsert('appointments', { ...a, status: 'cancelled' })}>
                Cancelar cita
              </button>
            </>
          )}
          {a.status !== 'scheduled' && (
            <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => upsert('appointments', { ...a, status: 'scheduled' })}>
              Volver a programada
            </button>
          )}
          <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={() => setConfirmDelete(true)}>
            Eliminar
          </button>
        </div>
      )}

      {editing && <AppointmentForm appointment={a} onClose={() => setEditing(false)} />}
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar cita"
        message={docs.length ? 'Se borrará la cita. Sus documentos se conservarán en Documentos.' : 'Se borrará la cita.'}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          for (const d of docs) upsert('documents', { ...d, appointmentId: null })
          remove('appointments', a.id)
          navigate('/citas')
        }}
      />
    </div>
  )
}
