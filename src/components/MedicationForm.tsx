import { useState } from 'react'
import type { DoseTime, Medication } from '../types'
import { useData } from '../context/DataContext'
import { todayISO } from '../lib/dates'
import { newId } from '../lib/labels'
import { MED_FORMS, stockStatus } from '../lib/medication'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'
import { Checkbox, Field, NumberInput, Segmented, WeekdayPicker } from './ui'
import { Icon } from './Icon'

function blankMedication(): Medication {
  return {
    id: newId(),
    name: '',
    strength: '',
    form: 'comprimido',
    purpose: '',
    instructions: '',
    doses: [{ time: '09:00', amount: 1 }],
    frequency: 'daily',
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    intervalDays: 2,
    asNeeded: false,
    startDate: todayISO(),
    endDate: '',
    unitsPerPackage: 28,
    stockUnits: 28,
    stockCountedAt: Date.now(),
    alertDays: 7,
    purchaseClaimedBy: null,
    prescriptionExpires: '',
    prescriber: '',
    active: true,
    createdAt: Date.now(),
  }
}

const num = (v: string, fallback = 0) => {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : fallback
}

const SUGGESTED_TIMES = ['09:00', '21:00', '14:00', '12:00', '18:00', '23:00', '06:00']

/** Campos que cambian cuánto se consume. */
const SCHEDULE_FIELDS = ['doses', 'frequency', 'weekdays', 'intervalDays', 'asNeeded', 'startDate', 'endDate', 'active'] as const

const sortDoses = (doses: DoseTime[]) => [...doses].sort((a, b) => a.time.localeCompare(b.time))

export function MedicationForm({ medication, onClose }: { medication?: Medication; onClose: () => void }) {
  const { data, update, remove } = useData()
  const [m, setM] = useState<Medication>(() => medication ?? blankMedication())
  // Lo que queda ahora según la pauta, para mostrarlo y poder corregirlo.
  const [initialStockText] = useState(() =>
    String(medication ? stockStatus(medication, data.doseLogs).remaining : 28).replace('.', ','),
  )
  const [stockText, setStockText] = useState(initialStockText)
  // Clave estable por fila (para que borrar una toma no mezcle las cantidades)
  // y la hora que tenía cada fila al abrir, para mover sus registros si cambia.
  const [initialRows] = useState(() => m.doses.map((d) => ({ id: newId(), time: d.time })))
  const [rowIds, setRowIds] = useState(() => initialRows.map((r) => r.id))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof Medication>(key: K, value: Medication[K]) => setM((prev) => ({ ...prev, [key]: value }))

  const setDose = (i: number, patch: Partial<DoseTime>) =>
    set(
      'doses',
      m.doses.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    )
  const addDose = () => {
    const used = new Set(m.doses.map((d) => d.time))
    set('doses', [...m.doses, { time: SUGGESTED_TIMES.find((t) => !used.has(t)) ?? '20:00', amount: 1 }])
    setRowIds([...rowIds, newId()])
  }
  const removeDose = (i: number) => {
    set('doses', m.doses.filter((_, idx) => idx !== i))
    setRowIds(rowIds.filter((_, idx) => idx !== i))
  }

  const duplicateTimes = new Set(m.doses.map((d) => d.time)).size !== m.doses.length
  const valid =
    m.name.trim() &&
    m.startDate &&
    (!m.endDate || m.endDate >= m.startDate) &&
    (m.asNeeded || (m.doses.length > 0 && !duplicateTimes && m.doses.every((d) => d.time && d.amount > 0)))

  const save = () => {
    if (!valid) return
    const now = Date.now()
    const doses = sortDoses(m.doses)

    // Stock: un recuento nuevo solo si se ha corregido a mano, o si cambia la
    // pauta (entonces se fija lo que queda hoy, para que la pauta nueva no
    // recalcule el consumo pasado). Si no, se conserva el último recuento.
    const current = medication ? stockStatus(medication, data.doseLogs, now).remaining : 0
    let stockUnits = medication?.stockUnits ?? 0
    let stockCountedAt = medication?.stockCountedAt ?? now
    const scheduleChanged =
      !!medication &&
      SCHEDULE_FIELDS.some((k) =>
        k === 'doses'
          ? JSON.stringify(sortDoses(medication.doses)) !== JSON.stringify(doses)
          : JSON.stringify(medication[k]) !== JSON.stringify(m[k]),
      )
    if (!medication || stockText !== initialStockText) {
      stockUnits = stockText.trim() === '' ? current : Math.max(0, num(stockText, current))
      stockCountedAt = now
    } else if (scheduleChanged) {
      stockUnits = current
      stockCountedAt = now
    }

    // Tomas que han cambiado de hora: sus registros pasan a la hora nueva.
    const moved = new Map<string, string>()
    if (medication) {
      rowIds.forEach((id, i) => {
        const original = initialRows.find((r) => r.id === id)
        if (original && original.time !== m.doses[i].time) moved.set(original.time, m.doses[i].time)
      })
    }

    const saved: Medication = { ...m, name: m.name.trim(), doses, stockUnits, stockCountedAt }
    update((d) => ({
      ...d,
      medications: d.medications.some((x) => x.id === saved.id)
        ? d.medications.map((x) => (x.id === saved.id ? saved : x))
        : [...d.medications, saved],
      doseLogs: moved.size
        ? d.doseLogs.map((l) => (l.medicationId === saved.id && moved.has(l.time) ? { ...l, time: moved.get(l.time)! } : l))
        : d.doseLogs,
    }))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={medication ? 'Editar medicamento' : 'Nuevo medicamento'} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" className="col-span-2 sm:col-span-1">
            <input className="ap-input" value={m.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej.: Enalapril" autoFocus />
          </Field>
          <Field label="Dosis / concentración">
            <input className="ap-input" value={m.strength} onChange={(e) => set('strength', e.target.value)} placeholder="10 mg" />
          </Field>
          <Field label="Presentación">
            <input className="ap-input" list="med-forms" value={m.form} onChange={(e) => set('form', e.target.value)} />
            <datalist id="med-forms">
              {MED_FORMS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </Field>
          <Field label="¿Para qué es?" className="col-span-2 sm:col-span-1">
            <input className="ap-input" value={m.purpose} onChange={(e) => set('purpose', e.target.value)} placeholder="Tensión, dolor…" />
          </Field>
          <Field label="Cómo tomarlo" className="col-span-2">
            <input
              className="ap-input"
              value={m.instructions}
              onChange={(e) => set('instructions', e.target.value)}
              placeholder="Con el desayuno, en ayunas, triturado…"
            />
          </Field>
        </div>

        <fieldset className="rounded-[14px] border p-4" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
          <legend className="px-1 text-[15px] font-semibold">Pauta</legend>
          <Checkbox checked={m.asNeeded} onChange={(v) => set('asNeeded', v)}>
            Solo si lo necesita (sin horario fijo)
          </Checkbox>

          {!m.asNeeded && (
            <div className="mt-3 space-y-3">
              <div>
                <span className="ap-label">Tomas al día</span>
                <div className="space-y-2">
                  {m.doses.map((d, i) => (
                    <div key={rowIds[i]} className="flex items-center gap-2">
                      <input
                        type="time"
                        className="ap-input !w-[7.5rem] shrink-0"
                        value={d.time}
                        onChange={(e) => setDose(i, { time: e.target.value })}
                        aria-label="Hora"
                      />
                      <NumberInput
                        className="!w-16 shrink-0"
                        value={d.amount}
                        onChange={(v) => setDose(i, { amount: v })}
                        ariaLabel="Cantidad"
                      />
                      <span className="min-w-0 truncate text-[15px] text-[color:var(--ap-ink-2)]">{m.form || 'unidad'}</span>
                      <button
                        type="button"
                        className="ml-auto shrink-0 rounded-full p-2 text-[color:var(--ap-ink-3)] hover:bg-black/5"
                        onClick={() => removeDose(i)}
                        aria-label="Quitar toma"
                      >
                        <Icon name="x" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                {duplicateTimes && (
                  <p className="mt-1 text-[13px]" style={{ color: 'var(--loss)' }}>
                    Hay dos tomas a la misma hora: júntalas en una con la cantidad total.
                  </p>
                )}
                <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet mt-2" onClick={addDose}>
                  <Icon name="plus" size={16} /> Añadir toma
                </button>
                <p className="mt-1 text-[13px] text-[color:var(--ap-ink-3)]">Usa 0,5 para medio comprimido.</p>
              </div>

              <div>
                <span className="ap-label">Frecuencia</span>
                <Segmented
                  value={m.frequency}
                  onChange={(v) => set('frequency', v)}
                  options={[
                    { value: 'daily', label: 'A diario' },
                    { value: 'weekdays', label: 'Algunos días' },
                    { value: 'interval', label: 'Cada X días' },
                  ]}
                />
                {m.frequency === 'weekdays' && (
                  <div className="mt-2">
                    <WeekdayPicker value={m.weekdays} onChange={(v) => set('weekdays', v)} />
                  </div>
                )}
                {m.frequency === 'interval' && (
                  <div className="mt-2 flex items-center gap-2 text-[15px]">
                    Cada
                    <NumberInput
                      className="!w-20"
                      integer
                      min={1}
                      value={m.intervalDays}
                      onChange={(v) => set('intervalDays', v)}
                    />
                    días, empezando el día de inicio
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Desde">
              <input type="date" className="ap-input" value={m.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </Field>
            <Field label="Hasta" hint="Vacío si es crónico">
              <input type="date" className="ap-input" value={m.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="rounded-[14px] border p-4" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
          <legend className="px-1 text-[15px] font-semibold">Stock y receta</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quedan ahora" hint={medication ? 'Calculado con la pauta: corrígelo si no cuadra' : 'Unidades en casa'}>
              <input inputMode="decimal" className="ap-input" value={stockText} onChange={(e) => setStockText(e.target.value)} />
            </Field>
            <Field label="Unidades por caja">
              <NumberInput integer min={1} value={m.unitsPerPackage} onChange={(v) => set('unitsPerPackage', v)} />
            </Field>
            <Field label="Avisar con (días)">
              <NumberInput integer value={m.alertDays} onChange={(v) => set('alertDays', v)} />
            </Field>
            <Field label="Receta válida hasta">
              <input
                type="date"
                className="ap-input"
                value={m.prescriptionExpires}
                onChange={(e) => set('prescriptionExpires', e.target.value)}
              />
            </Field>
            <Field label="Lo receta" className="col-span-2">
              <input className="ap-input" value={m.prescriber} onChange={(e) => set('prescriber', e.target.value)} placeholder="Médico de cabecera, especialista…" />
            </Field>
          </div>
        </fieldset>

        {medication && (
          <Checkbox checked={!m.active} onChange={(v) => set('active', !v)}>
            Tratamiento suspendido (se guarda en el historial)
          </Checkbox>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        {medication ? (
          <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={() => setConfirmDelete(true)}>
            Eliminar
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={save} disabled={!valid}>
            Guardar
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar medicamento"
        message="Se borrará el medicamento. Si solo se ha dejado de tomar, es mejor marcarlo como suspendido para conservar el historial."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (medication) remove('medications', medication.id)
          onClose()
        }}
      />
    </Modal>
  )
}
