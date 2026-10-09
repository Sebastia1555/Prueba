import { useMemo, useState } from 'react'
import type { Shift } from '../types'
import { useData } from '../context/DataContext'
import { endOfMonth, formatDayMedium, formatHours, startOfMonth, todayISO } from '../lib/dates'
import { newId } from '../lib/labels'
import { coverage, proposeAssignments, slotInterval, slotMinutes } from '../lib/shifts'
import { Modal } from './Modal'
import { Avatar, Checkbox, EmptyState, MemberTag, Notice } from './ui'

interface Props {
  from: string
  to: string
  rangeLabel: string
  onClose: () => void
}

/** Propone quién cubre cada franja libre del rango, repartiendo las horas. */
export function ProposalModal({ from, to, rangeLabel, onClose }: Props) {
  const { data, upsertMany } = useData()
  const [included, setIncluded] = useState<string[]>(() =>
    data.members.filter((m) => m.role !== 'cuidador').map((m) => m.id),
  )
  const [rejected, setRejected] = useState<Set<string>>(new Set())

  const proposals = useMemo(() => {
    const now = Date.now()
    const start = from < todayISO() ? todayISO() : from
    const gaps = coverage(data, start, to).filter((c) => !c.shift && slotInterval(c.slot, c.date)[0] > now)
    const members = data.members.filter((m) => included.includes(m.id))
    return proposeAssignments(data, gaps, members, startOfMonth(start), endOfMonth(start))
  }, [data, from, to, included])

  const keyOf = (date: string, slotId: string) => `${date}|${slotId}`
  const accepted = proposals.filter((p) => p.memberId && !rejected.has(keyOf(p.cell.date, p.cell.slot.id)))

  const totals = new Map<string, number>()
  for (const p of accepted) totals.set(p.memberId!, (totals.get(p.memberId!) ?? 0) + slotMinutes(p.cell.slot))

  const apply = () => {
    const shifts: Shift[] = accepted.map((p) => ({
      id: newId(),
      date: p.cell.date,
      slotId: p.cell.slot.id,
      memberId: p.memberId!,
      note: '',
      seriesId: null,
      coverRequested: false,
    }))
    upsertMany('shifts', shifts)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Proponer reparto" maxWidth="max-w-xl">
      <p className="text-[15px] text-[color:var(--ap-ink-2)]">
        Para las franjas sin cubrir de <strong>{rangeLabel}</strong>, la app elige a quien está libre
        según su disponibilidad y lleva menos horas este mes. Revisa la propuesta antes de aplicarla.
      </p>

      <p className="ap-label mt-4">Incluir en el reparto</p>
      <div className="flex flex-wrap gap-x-4">
        {data.members.map((m) => (
          <Checkbox
            key={m.id}
            checked={included.includes(m.id)}
            onChange={(on) => setIncluded(on ? [...included, m.id] : included.filter((x) => x !== m.id))}
          >
            {m.name}
          </Checkbox>
        ))}
      </div>

      <div className="mt-4">
        {proposals.length === 0 ? (
          <EmptyState icon="🎉" title="No hay franjas sin cubrir">
            Todo {rangeLabel} está organizado.
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-[14px] border" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
            {proposals.map((p) => {
              const key = keyOf(p.cell.date, p.cell.slot.id)
              const member = data.members.find((m) => m.id === p.memberId)
              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                  style={{ borderColor: 'var(--ap-hairline-soft)' }}
                >
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium">{formatDayMedium(p.cell.date)}</div>
                    <div className="text-[13px] text-[color:var(--ap-ink-3)]">
                      {p.cell.slot.label} · {p.cell.slot.start}–{p.cell.slot.end}
                    </div>
                  </div>
                  {member ? (
                    <label className="flex items-center gap-2">
                      <MemberTag member={member} />
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-[color:var(--ap-blue)]"
                        checked={!rejected.has(key)}
                        aria-label={`Aceptar ${member.name}`}
                        onChange={(e) => {
                          const next = new Set(rejected)
                          if (e.target.checked) next.delete(key)
                          else next.add(key)
                          setRejected(next)
                        }}
                      />
                    </label>
                  ) : (
                    <span className="text-[14px]" style={{ color: 'var(--loss)' }}>
                      Nadie disponible
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {proposals.some((p) => !p.memberId) && (
        <div className="mt-3">
          <Notice tone="amber">
            Hay franjas en las que nadie está libre. Habrá que hablarlo o buscar ayuda externa.
          </Notice>
        </div>
      )}

      {totals.size > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-[14px] text-[color:var(--ap-ink-2)]">
          {[...totals].map(([id, minutes]) => {
            const m = data.members.find((x) => x.id === id)
            return (
              <span key={id} className="inline-flex items-center gap-1.5">
                <Avatar member={m} size={18} /> +{formatHours(minutes)}
              </span>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={apply} disabled={!accepted.length}>
          Aplicar {accepted.length > 0 && `(${accepted.length})`}
        </button>
      </div>
    </Modal>
  )
}
