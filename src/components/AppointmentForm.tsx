import { useState } from 'react'
import type { Appointment } from '../types'
import { useData } from '../context/DataContext'
import { addDays, dateTimeMs, todayISO } from '../lib/dates'
import { newId, SPECIALTIES } from '../lib/labels'
import { Modal } from './Modal'
import { MemberAvailability } from './MemberAvailability'
import { Field, NumberInput } from './ui'

function blankAppointment(): Appointment {
  return {
    id: newId(),
    date: addDays(todayISO(), 7),
    time: '10:00',
    durationMin: 90,
    specialty: '',
    doctor: '',
    place: '',
    address: '',
    reason: '',
    companionId: null,
    transport: '',
    preparation: '',
    questions: '',
    summary: '',
    followUp: '',
    status: 'scheduled',
    createdAt: Date.now(),
  }
}

export function AppointmentForm({
  appointment,
  onClose,
  onSaved,
}: {
  appointment?: Appointment
  onClose: () => void
  onSaved?: (a: Appointment) => void
}) {
  const { data, upsert } = useData()
  const [a, setA] = useState<Appointment>(() => appointment ?? blankAppointment())
  const set = <K extends keyof Appointment>(key: K, value: Appointment[K]) => setA((prev) => ({ ...prev, [key]: value }))
  const valid = a.specialty.trim() && a.date && a.time
  const start = dateTimeMs(a.date, a.time)
  const end = start + (a.durationMin || 90) * 60_000

  // Sugerencias de lugares ya usados.
  const places = [...new Set(data.appointments.map((x) => x.place).filter(Boolean))]

  const save = () => {
    if (!valid) return
    const saved = { ...a, specialty: a.specialty.trim() }
    upsert('appointments', saved)
    onSaved?.(saved)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={appointment ? 'Editar cita' : 'Nueva cita'} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Día">
            <input type="date" className="ap-input" value={a.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Hora">
            <input type="time" className="ap-input" value={a.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
          <Field label="Duración (min)" hint="Con desplazamiento" className="col-span-2 sm:col-span-1">
            <NumberInput integer min={5} value={a.durationMin} onChange={(v) => set('durationMin', v)} />
          </Field>
          <Field label="Especialidad" className="col-span-2 sm:col-span-1">
            <input
              className="ap-input"
              list="specialties"
              value={a.specialty}
              onChange={(e) => set('specialty', e.target.value)}
              placeholder="Cardiología…"
              autoFocus={!appointment}
            />
            <datalist id="specialties">
              {SPECIALTIES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Médico/a" className="col-span-2">
            <input className="ap-input" value={a.doctor} onChange={(e) => set('doctor', e.target.value)} />
          </Field>
          <Field label="Centro" className="col-span-2 sm:col-span-1">
            <input className="ap-input" list="places" value={a.place} onChange={(e) => set('place', e.target.value)} placeholder="Hospital, centro de salud…" />
            <datalist id="places">
              {places.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          <Field label="Dirección / consulta" className="col-span-2">
            <input className="ap-input" value={a.address} onChange={(e) => set('address', e.target.value)} placeholder="Planta 3, consulta 12" />
          </Field>
        </div>

        <Field label="Motivo">
          <input className="ap-input" value={a.reason} onChange={(e) => set('reason', e.target.value)} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="ap-label !mb-0">¿Quién le acompaña?</span>
            {a.companionId && (
              <button type="button" className="ap-link text-[14px]" onClick={() => set('companionId', null)}>
                Sin decidir
              </button>
            )}
          </div>
          <MemberAvailability
            members={data.members}
            start={start}
            end={end}
            ignore={{ appointmentId: a.id }}
            selectedId={a.companionId}
            onSelect={(id) => set('companionId', id)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Transporte">
            <input className="ap-input" value={a.transport} onChange={(e) => set('transport', e.target.value)} placeholder="Coche de Ana, taxi, ambulancia…" />
          </Field>
          <Field label="Preparación">
            <input className="ap-input" value={a.preparation} onChange={(e) => set('preparation', e.target.value)} placeholder="En ayunas, llevar informes…" />
          </Field>
        </div>

        <Field label="Preguntas para el médico" hint="Una por línea. Así no se olvida nada en consulta.">
          <textarea className="ap-input min-h-[5rem]" value={a.questions} onChange={(e) => set('questions', e.target.value)} />
        </Field>

        {appointment && (
          <>
            <Field label="¿Qué dijo el médico?">
              <textarea className="ap-input min-h-[5rem]" value={a.summary} onChange={(e) => set('summary', e.target.value)} />
            </Field>
            <Field label="Próximos pasos">
              <input className="ap-input" value={a.followUp} onChange={(e) => set('followUp', e.target.value)} placeholder="Pedir cita de revisión, cambiar medicación…" />
            </Field>
          </>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={save} disabled={!valid}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}
