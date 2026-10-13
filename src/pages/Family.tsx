import { useState } from 'react'
import type { Member, Role } from '../types'
import { useData } from '../context/DataContext'
import { todayISO } from '../lib/dates'
import { MEMBER_COLORS, newId } from '../lib/labels'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../lib/permissions'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { Icon } from '../components/Icon'
import { Avatar, Badge, Field, Notice, PageHeader } from '../components/ui'
import { IS_PREVIEW } from '../lib/env'

export function Family() {
  const { data, me, can, setMeId } = useData()
  const [editing, setEditing] = useState<Member | 'new' | null>(null)
  const manage = can('manageMembers')

  return (
    <div>
      <PageHeader
        title="Familia y cuidadores"
        subtitle="Quién participa en el cuidado y qué puede hacer cada uno"
        actions={
          manage && (
            <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => setEditing('new')}>
              <Icon name="plus" size={16} /> Añadir persona
            </button>
          )
        }
      />

      <ul className="ap-card divide-y overflow-hidden">
        {data.members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
            <Avatar member={m} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[17px] font-semibold">{m.name}</span>
                {m.id === me?.id && <span className="text-[14px] text-[color:var(--ap-ink-3)]">(tú)</span>}
                <Badge tone={m.role === 'admin' ? 'blue' : m.role === 'cuidador' ? 'green' : 'neutral'}>{ROLE_LABELS[m.role]}</Badge>
              </div>
              <div className="text-[14px] text-[color:var(--ap-ink-2)]">
                {[m.relation, m.phone, m.email].filter(Boolean).join(' · ')}
              </div>
            </div>
            {m.phone && !IS_PREVIEW && (
              <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="rounded-full p-2 text-[color:var(--ap-blue)] hover:bg-black/5" aria-label={`Llamar a ${m.name}`}>
                <Icon name="phone" size={18} />
              </a>
            )}
            {(manage || m.id === me?.id) && (
              <button type="button" className="rounded-full p-2 text-[color:var(--ap-ink-3)] hover:bg-black/5" onClick={() => setEditing(m)} aria-label={`Editar ${m.name}`}>
                <Icon name="edit" size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 mb-2 px-1 text-[19px]">Qué puede hacer cada rol</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <div key={r} className="ap-card p-4">
            <div className="text-[16px] font-semibold">{ROLE_LABELS[r]}</div>
            <p className="mt-1 text-[14px] text-[color:var(--ap-ink-2)]">{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Notice icon="user">
          En esta versión de prueba los datos están en este dispositivo y cualquiera puede cambiar de perfil desde el
          botón de arriba. Con la versión en la nube, cada persona entrará con su propia cuenta.{' '}
          <button type="button" className="font-semibold underline" onClick={() => setMeId(null)}>
            Cambiar de perfil
          </button>
        </Notice>
      </div>

      {editing && <MemberForm member={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

export function MemberForm({ member, onClose }: { member?: Member; onClose: () => void }) {
  const { data, me, can, upsert, update } = useData()
  const used = new Set(data.members.map((m) => m.color))
  const [m, setM] = useState<Member>(
    () =>
      member ?? {
        id: newId(),
        name: '',
        role: 'familiar',
        color: MEMBER_COLORS.find((c) => !used.has(c)) ?? MEMBER_COLORS[0],
        relation: '',
        phone: '',
        email: '',
        createdAt: Date.now(),
      },
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof Member>(key: K, value: Member[K]) => setM((prev) => ({ ...prev, [key]: value }))
  const manage = can('manageMembers')
  const admins = data.members.filter((x) => x.role === 'admin')
  const lastAdmin = member?.role === 'admin' && admins.length === 1
  const valid = m.name.trim().length > 0

  const remove = () => {
    const today = todayISO()
    update((d) => ({
      ...d,
      members: d.members.filter((x) => x.id !== m.id),
      // Sus turnos futuros quedan sin cubrir y sus citas sin acompañante.
      shifts: d.shifts.filter((s) => !(s.memberId === m.id && s.date >= today)),
      appointments: d.appointments.map((a) =>
        a.companionId === m.id && a.date >= today ? { ...a, companionId: null } : a,
      ),
      busyBlocks: d.busyBlocks.filter((b) => b.memberId !== m.id),
      calendars: d.calendars.filter((c) => c.memberId !== m.id),
      medications: d.medications.map((x) => (x.purchaseClaimedBy === m.id ? { ...x, purchaseClaimedBy: null } : x)),
    }))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={member ? `Editar a ${member.name}` : 'Añadir persona'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre">
            <input className="ap-input" value={m.name} onChange={(e) => set('name', e.target.value)} autoFocus={!member} />
          </Field>
          <Field label="Relación">
            <input className="ap-input" value={m.relation} onChange={(e) => set('relation', e.target.value)} placeholder="Hija, nieto, cuidadora…" />
          </Field>
          <Field label="Teléfono">
            <input className="ap-input" type="tel" value={m.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="ap-input" type="email" value={m.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </div>

        <div>
          <span className="ap-label">Color en la agenda</span>
          <div className="flex flex-wrap gap-2">
            {MEMBER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: c, boxShadow: m.color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : undefined }}
                aria-label={`Color ${c}`}
                aria-pressed={m.color === c}
              />
            ))}
          </div>
        </div>

        {manage && (
          <div>
            <span className="ap-label">Rol</span>
            <div className="space-y-2">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <label
                  key={r}
                  className="flex cursor-pointer gap-3 rounded-[12px] border p-3"
                  style={{ borderColor: m.role === r ? 'var(--ap-blue)' : 'var(--ap-hairline-soft)' }}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={m.role === r}
                    disabled={lastAdmin && r !== 'admin'}
                    onChange={() => set('role', r)}
                    className="mt-1 accent-[color:var(--ap-blue)]"
                  />
                  <span>
                    <span className="block text-[15px] font-semibold">{ROLE_LABELS[r]}</span>
                    <span className="block text-[13px] text-[color:var(--ap-ink-2)]">{ROLE_DESCRIPTIONS[r]}</span>
                  </span>
                </label>
              ))}
            </div>
            {lastAdmin && <p className="mt-1 text-[13px] text-[color:var(--ap-ink-3)]">Tiene que haber al menos un administrador.</p>}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        {member && manage && !lastAdmin && member.id !== me?.id ? (
          <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={() => setConfirmDelete(true)}>
            Quitar
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ap-btn ap-btn-sm ap-btn-primary"
            disabled={!valid}
            onClick={() => {
              upsert('members', { ...m, name: m.name.trim(), relation: m.relation.trim() })
              onClose()
            }}
          >
            Guardar
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Quitar a ${m.name}`}
        message="Sus turnos a partir de hoy quedarán sin cubrir y las citas que tenía asignadas, sin acompañante. Los gastos y notas anteriores se conservan."
        confirmLabel="Quitar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </Modal>
  )
}
