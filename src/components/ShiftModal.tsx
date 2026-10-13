import { useMemo, useState } from 'react'
import type { CareSlot, Shift } from '../types'
import { useData } from '../context/DataContext'
import { addDays, endOfMonth, formatDayLong, formatHours, startOfMonth } from '../lib/dates'
import { newId } from '../lib/labels'
import { blocking, findShift, memberConflicts, minutesByMember, slotInterval } from '../lib/shifts'
import { Modal } from './Modal'
import { MemberAvailability } from './MemberAvailability'
import { Checkbox, Field, MemberTag, Notice } from './ui'

interface Props {
  date: string
  slot: CareSlot
  onClose: () => void
}

export function ShiftModal({ date, slot, onClose }: Props) {
  const { data, me, can, memberById, upsert, upsertMany, update } = useData()
  const shift = findShift(data.shifts, date, slot.id)
  const [selectedId, setSelectedId] = useState<string | null>(shift?.memberId ?? null)
  const [note, setNote] = useState(shift?.note ?? '')
  const [repeat, setRepeat] = useState(false)
  const [repeatUntil, setRepeatUntil] = useState(addDays(date, 7 * 8))
  const [applySeries, setApplySeries] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [start, end] = slotInterval(slot, date)
  const canEdit = can('editShifts')
  const isMine = !!shift && shift.memberId === me?.id
  const assigned = memberById(shift?.memberId)
  // Turnos siguientes de la serie semanal que siguen siendo de la misma
  // persona: los que alguien cubrió aparte ya no se tocan desde aquí.
  const seriesRest = shift?.seriesId
    ? data.shifts.filter((s) => s.seriesId === shift.seriesId && s.memberId === shift.memberId && s.date > date)
    : []
  const seriesCount = seriesRest.length

  const monthLoad = useMemo(
    () => minutesByMember(data, startOfMonth(date), endOfMonth(date)),
    [data, date],
  )

  const title = `${slot.label} · ${formatDayLong(date)}`

  const takeMyself = () => {
    if (!me) return
    upsert('shifts', {
      ...(shift ?? { id: newId(), date, slotId: slot.id }),
      memberId: me.id,
      note: shift?.coverRequested ? '' : (shift?.note ?? ''),
      coverRequested: false,
      // Quien cubre un turno suelto no pasa a formar parte de la serie de otro.
      seriesId: null,
    })
    onClose()
  }

  const toggleCoverRequest = () => {
    if (!shift) return
    upsert('shifts', { ...shift, coverRequested: !shift.coverRequested, note })
    onClose()
  }

  const save = () => {
    if (!selectedId) return
    const base: Shift = shift ?? {
      id: newId(),
      date,
      slotId: slot.id,
      memberId: selectedId,
      note: '',
      seriesId: null,
      coverRequested: false,
    }
    const changedPerson = base.memberId !== selectedId
    const doRepeat = repeat && !applySeries
    const current: Shift = {
      ...base,
      memberId: selectedId,
      note,
      coverRequested: changedPerson ? false : base.coverRequested,
      // Cambiar solo este turno lo saca de su serie semanal.
      seriesId: changedPerson && !applySeries ? null : base.seriesId,
    }
    const items: Shift[] = [current]
    const freeOn = (d: string, existingId?: string) =>
      blocking(memberConflicts(data, selectedId, ...slotInterval(slot, d), { shiftId: existingId })).length === 0

    let taken = 0
    let busy = 0
    if (applySeries && shift?.seriesId) {
      for (const s of seriesRest) {
        if (s.memberId !== selectedId && !freeOn(s.date, s.id)) {
          busy++
          continue
        }
        items.push({ ...s, memberId: selectedId, coverRequested: false })
      }
    }

    if (doRepeat) {
      const seriesId = newId()
      current.seriesId = seriesId
      for (let d = addDays(date, 7); d <= repeatUntil; d = addDays(d, 7)) {
        const existing = findShift(data.shifts, d, slot.id)
        if (existing && existing.memberId !== selectedId) {
          taken++
          continue
        }
        if (!freeOn(d, existing?.id)) {
          busy++
          continue
        }
        items.push(
          existing
            ? { ...existing, seriesId }
            : { id: newId(), date: d, slotId: slot.id, memberId: selectedId, note: '', seriesId, coverRequested: false },
        )
      }
    }

    upsertMany('shifts', items)
    const weeks = (n: number) => (n === 1 ? '1 semana en la que' : `${n} semanas en las que`)
    const notes = [
      taken > 0 && `${weeks(taken)} ya había otra persona en esa franja`,
      busy > 0 && `${weeks(busy)} ${memberById(selectedId)?.name ?? 'esa persona'} tiene otro compromiso`,
    ].filter(Boolean)
    if (notes.length) {
      setMessage(`Guardado. ${taken + busy === 1 ? 'No se ha tocado' : 'No se han tocado'} ${notes.join(' ni ')}.`)
    } else {
      onClose()
    }
  }

  const unassign = () => {
    if (!shift) return
    const removed = new Set([shift.id, ...(applySeries ? seriesRest.map((s) => s.id) : [])])
    update((d) => ({ ...d, shifts: d.shifts.filter((s) => !removed.has(s.id)) }))
    onClose()
  }

  if (message) {
    return (
      <Modal open onClose={onClose} title={title}>
        <Notice tone="amber">{message}</Notice>
        <div className="mt-5 flex justify-end">
          <button type="button" className="ap-btn ap-btn-primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <p className="-mt-1 mb-4 text-[15px] text-[color:var(--ap-ink-2)]">
        De {slot.start} a {slot.end}
        {slot.end <= slot.start && ' (del día siguiente)'}
      </p>

      {shift?.coverRequested && (
        <div className="mb-4">
          <Notice tone="amber" icon="swap">
            <strong>{assigned?.name ?? 'Alguien'} busca sustituto.</strong>
            {shift.note && <> «{shift.note}»</>}
          </Notice>
        </div>
      )}

      {canEdit ? (
        <>
          <p className="ap-label">¿Quién está con {data.patient.name.split(' ')[0] || 'ella/él'}?</p>
          <MemberAvailability
            members={data.members}
            start={start}
            end={end}
            ignore={{ shiftId: shift?.id }}
            selectedId={selectedId}
            onSelect={setSelectedId}
            extra={(m) => `${formatHours(monthLoad.get(m.id) ?? 0)} este mes`}
          />

          <Field label="Nota (opcional)" className="mt-4">
            <input
              className="ap-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej.: llego a las 15:00, me quedo a dormir…"
            />
          </Field>

          <div className="mt-3 space-y-1">
            {shift?.seriesId && seriesCount > 0 && (
              <Checkbox
                checked={applySeries}
                onChange={(v) => {
                  setApplySeries(v)
                  if (v) setRepeat(false)
                }}
              >
                Aplicar también a los {seriesCount} turnos siguientes de esta serie semanal
              </Checkbox>
            )}
            {!applySeries && (
              <Checkbox checked={repeat} onChange={setRepeat}>
                Repetir cada semana
              </Checkbox>
            )}
            {repeat && !applySeries && (
              <Field label="Hasta" className="pl-7">
                <input
                  type="date"
                  className="ap-input"
                  value={repeatUntil}
                  min={addDays(date, 7)}
                  onChange={(e) => setRepeatUntil(e.target.value)}
                />
              </Field>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {me && (!shift || (shift.coverRequested && !isMine)) && (
                <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost" onClick={takeMyself}>
                  Me lo quedo
                </button>
              )}
              {shift && (
                <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={unassign}>
                  Dejar sin cubrir
                </button>
              )}
              {isMine && (
                <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={toggleCoverRequest}>
                  {shift?.coverRequested ? 'Ya no busco sustituto' : 'Pedir sustituto'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={save} disabled={!selectedId}>
                Guardar
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-[15px] text-[color:var(--ap-ink-2)]">Asignado a:</span>
            {assigned ? <MemberTag member={assigned} /> : <strong style={{ color: 'var(--loss)' }}>sin cubrir</strong>}
          </div>
          {shift?.note && !shift.coverRequested && (
            <p className="mt-2 text-[15px] text-[color:var(--ap-ink-2)]">Nota: {shift.note}</p>
          )}
          {isMine && (
            <Field label="Mensaje para el resto (opcional)" className="mt-4">
              <input className="ap-input" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
              Cerrar
            </button>
            {can('takeShifts') && (!shift || (shift.coverRequested && !isMine)) && (
              <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={takeMyself}>
                Me lo quedo
              </button>
            )}
            {isMine && (
              <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={toggleCoverRequest}>
                {shift?.coverRequested ? 'Ya no busco sustituto' : 'Pedir sustituto'}
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}
