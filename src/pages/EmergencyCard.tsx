import { useState } from 'react'
import type { EmergencyContact, Patient } from '../types'
import { useData } from '../context/DataContext'
import { ageFrom, formatDate, todayISO } from '../lib/dates'
import { newId } from '../lib/labels'
import { formatAmount, scheduleSummary } from '../lib/medication'
import { Modal } from '../components/Modal'
import { Icon } from '../components/Icon'
import { Field, PageHeader } from '../components/ui'
import { IS_PREVIEW } from '../lib/env'

/** Ficha con todo lo que hay que saber en una urgencia. */
export function EmergencyCard() {
  const { data, can } = useData()
  const [editing, setEditing] = useState(false)
  const p = data.patient
  const age = ageFrom(p.birthDate)
  const today = todayISO()
  const meds = data.medications.filter((m) => m.active && (!m.endDate || m.endDate >= today))

  const row = (label: string, value: string, highlight = false) =>
    value ? (
      <div className="py-2">
        <dt className="text-[13px] font-semibold uppercase tracking-wide text-[color:var(--ap-ink-3)]">{label}</dt>
        <dd className="text-[17px]" style={highlight ? { color: 'var(--loss)', fontWeight: 600 } : undefined}>
          {value}
        </dd>
      </div>
    ) : null

  return (
    <div>
      <PageHeader
        title="Ficha de emergencia"
        subtitle="Para enseñar en urgencias o a un médico nuevo"
        actions={
          <>
            {!IS_PREVIEW && (
              <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => window.print()}>
                <Icon name="printer" size={16} /> Imprimir
              </button>
            )}
            {can('editPatient') && (
              <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => setEditing(true)}>
                <Icon name="edit" size={16} /> Editar
              </button>
            )}
          </>
        }
      />

      <div className="ap-card overflow-hidden print:border-0">
        <div className="px-5 py-5" style={{ backgroundColor: '#fbeceb' }}>
          <h2 className="text-[26px] leading-tight">{p.name || 'Sin nombre'}</h2>
          <p className="text-[16px] text-[color:var(--ap-ink-2)]">
            {age !== null && `${age} años · nacida/o el ${formatDate(p.birthDate)}`}
            {p.bloodType && ` · Grupo sanguíneo ${p.bloodType}`}
          </p>
          {p.allergies && (
            <p className="mt-3 rounded-[12px] bg-white px-4 py-3 text-[17px] font-semibold" style={{ color: 'var(--loss)' }}>
              ⚠️ Alergias: {p.allergies}
            </p>
          )}
        </div>

        <dl className="grid gap-x-8 px-5 py-3 sm:grid-cols-2">
          {row('Enfermedades y diagnósticos', p.conditions)}
          {row('Movilidad y ayudas', p.mobility)}
          {row('Alimentación', p.diet)}
          {row('Grado de dependencia', p.dependencyGrade)}
          {row('Médico/a de cabecera', [p.gpName, p.gpPhone].filter(Boolean).join(' · '))}
          {row('Centro de salud', p.healthCenter)}
          {row('Tarjeta sanitaria', p.healthCardNumber)}
          {row('Nº Seguridad Social', p.socialSecurityNumber)}
          {row('DNI', p.idNumber)}
          {row('Seguro / mutua', p.insurance)}
          {row('Dirección', p.address)}
          {row('Otros datos', p.notes)}
        </dl>

        <div className="border-t px-5 py-4" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
          <h3 className="mb-2 text-[17px]">Medicación actual</h3>
          {meds.length === 0 ? (
            <p className="text-[15px] text-[color:var(--ap-ink-3)]">Sin medicación registrada.</p>
          ) : (
            <ul className="space-y-1 text-[15px]">
              {meds.map((m) => (
                <li key={m.id}>
                  <strong>
                    {m.name} {m.strength}
                  </strong>{' '}
                  — {scheduleSummary(m)}
                  {!m.asNeeded && m.doses[0] && ` (${formatAmount(m.doses[0].amount, m.form)})`}
                  {m.purpose && <span className="text-[color:var(--ap-ink-2)]"> · {m.purpose}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t px-5 py-4" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
          <h3 className="mb-2 text-[17px]">Contactos de emergencia</h3>
          {p.emergencyContacts.length === 0 ? (
            <p className="text-[15px] text-[color:var(--ap-ink-3)]">Añade al menos un contacto.</p>
          ) : (
            <ul className="space-y-2">
              {p.emergencyContacts.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[16px]">
                    <strong>{c.name}</strong>
                    {c.relation && <span className="text-[color:var(--ap-ink-2)]"> · {c.relation}</span>}
                  </span>
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="ap-btn ap-btn-sm ap-btn-neutral">
                    <Icon name="phone" size={16} /> {c.phone}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editing && <PatientForm onClose={() => setEditing(false)} />}
    </div>
  )
}

function PatientForm({ onClose }: { onClose: () => void }) {
  const { data, update } = useData()
  const [p, setP] = useState<Patient>(data.patient)
  const set = <K extends keyof Patient>(key: K, value: Patient[K]) => setP((prev) => ({ ...prev, [key]: value }))
  const setContact = (id: string, patch: Partial<EmergencyContact>) =>
    set(
      'emergencyContacts',
      p.emergencyContacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    )

  const text = (key: keyof Patient, label: string, placeholder = '', area = false) => (
    <Field label={label} className={area ? 'sm:col-span-2' : ''}>
      {area ? (
        <textarea
          className="ap-input min-h-[4rem]"
          value={p[key] as string}
          placeholder={placeholder}
          onChange={(e) => set(key, e.target.value as never)}
        />
      ) : (
        <input className="ap-input" value={p[key] as string} placeholder={placeholder} onChange={(e) => set(key, e.target.value as never)} />
      )}
    </Field>
  )

  return (
    <Modal open onClose={onClose} title="Editar ficha" maxWidth="max-w-2xl">
      <div className="grid gap-3 sm:grid-cols-2">
        {text('name', 'Nombre y apellidos')}
        <Field label="Fecha de nacimiento">
          <input type="date" className="ap-input" value={p.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
        </Field>
        {text('allergies', 'Alergias', 'Penicilina, látex… (o "Ninguna conocida")', true)}
        {text('conditions', 'Enfermedades y diagnósticos', '', true)}
        {text('mobility', 'Movilidad y ayudas', 'Andador, silla de ruedas, necesita ayuda para…', true)}
        {text('diet', 'Alimentación', 'Dieta, texturas, dificultad para tragar…', true)}
        {text('bloodType', 'Grupo sanguíneo', 'A+')}
        {text('dependencyGrade', 'Grado de dependencia', 'Grado II')}
        {text('gpName', 'Médico/a de cabecera')}
        {text('gpPhone', 'Teléfono del centro / médico')}
        {text('healthCenter', 'Centro de salud')}
        {text('insurance', 'Seguro / mutua')}
        {text('healthCardNumber', 'Tarjeta sanitaria')}
        {text('socialSecurityNumber', 'Nº Seguridad Social')}
        {text('idNumber', 'DNI')}
        {text('address', 'Dirección')}
        {text('notes', 'Otros datos útiles', 'Audífono, gafas, quién tiene llaves…', true)}
      </div>

      <div className="mt-5">
        <span className="ap-label">Contactos de emergencia</span>
        <div className="space-y-2">
          {p.emergencyContacts.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_1.4fr_auto]">
              <input className="ap-input col-span-3 sm:col-span-1" value={c.name} placeholder="Nombre" onChange={(e) => setContact(c.id, { name: e.target.value })} />
              <input className="ap-input" value={c.relation} placeholder="Relación" onChange={(e) => setContact(c.id, { relation: e.target.value })} />
              <input className="ap-input" type="tel" value={c.phone} placeholder="Teléfono" onChange={(e) => setContact(c.id, { phone: e.target.value })} />
              <button
                type="button"
                className="rounded-full p-2 text-[color:var(--ap-ink-3)] hover:bg-black/5"
                onClick={() => set('emergencyContacts', p.emergencyContacts.filter((x) => x.id !== c.id))}
                aria-label="Quitar contacto"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="ap-btn ap-btn-sm ap-btn-quiet mt-2"
          onClick={() => set('emergencyContacts', [...p.emergencyContacts, { id: newId(), name: '', relation: '', phone: '' }])}
        >
          <Icon name="plus" size={16} /> Añadir contacto
        </button>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="ap-btn ap-btn-sm ap-btn-primary"
          onClick={() => {
            update((d) => ({
              ...d,
              patient: { ...p, emergencyContacts: p.emergencyContacts.filter((c) => c.name.trim() || c.phone.trim()) },
            }))
            onClose()
          }}
        >
          Guardar
        </button>
      </div>
    </Modal>
  )
}
