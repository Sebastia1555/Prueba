import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { DoseLog, Medication } from '../types'
import { useData } from '../context/DataContext'
import {
  addDays,
  dateTimeMs,
  formatDate,
  formatDayShort,
  formatInDays,
  formatRelativeDay,
  msToISODate,
  msToTime,
  nowTime,
  todayISO,
} from '../lib/dates'
import { useNow } from '../lib/hooks'
import { IS_PREVIEW } from '../lib/env'
import { newId } from '../lib/labels'
import {
  dosesForDay,
  formatAmount,
  isOverdue,
  prescriptionDaysLeft,
  scheduleSummary,
  stockStatus,
  type ScheduledDose,
  type StockStatus,
} from '../lib/medication'
import { formatMoney, parseMoney } from '../lib/expenses'
import { PRESCRIPTION_ALERT_DAYS } from '../lib/alerts'
import { MedicationForm } from '../components/MedicationForm'
import { Modal } from '../components/Modal'
import { Icon } from '../components/Icon'
import { Badge, Checkbox, EmptyState, Field, MemberTag, Notice, NumberInput, PageHeader, Section, Segmented } from '../components/ui'

type Tab = 'hoy' | 'pauta' | 'stock'

export function Medications() {
  const { can } = useData()
  const [params, setParams] = useSearchParams()
  const raw = params.get('vista')
  const tab: Tab = raw === 'pauta' || raw === 'stock' ? raw : 'hoy'
  const [editing, setEditing] = useState<Medication | 'new' | null>(null)

  return (
    <div>
      <PageHeader
        title="Medicación"
        actions={
          <>
            <Link to="/medicacion/imprimir" className="ap-btn ap-btn-sm ap-btn-neutral">
              <Icon name="printer" size={16} /> {IS_PREVIEW ? 'Hoja de medicación' : 'Hoja para imprimir'}
            </Link>
            {can('editMedications') && (
              <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => setEditing('new')}>
                <Icon name="plus" size={16} /> Medicamento
              </button>
            )}
          </>
        }
      />
      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={(v) => setParams(v === 'hoy' ? {} : { vista: v }, { replace: true })}
          options={[
            { value: 'hoy', label: 'Tomas' },
            { value: 'pauta', label: 'Pauta' },
            { value: 'stock', label: 'Stock y recetas' },
          ]}
        />
      </div>

      {tab === 'hoy' && <DosesTab />}
      {tab === 'pauta' && <ScheduleTab onEdit={(m) => setEditing(m)} />}
      {tab === 'stock' && <StockTab />}

      {editing && (
        <MedicationForm medication={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

// --- Tomas -------------------------------------------------------------------

function DosesTab() {
  const { data, me, can, memberById, upsert, remove } = useData()
  const now = useNow()
  const [date, setDate] = useState(todayISO())
  const [skipping, setSkipping] = useState<ScheduledDose | null>(null)
  const [prn, setPrn] = useState<Medication | null>(null)
  const today = todayISO()
  const doses = dosesForDay(data.medications, data.doseLogs, date)
  const given = doses.filter((d) => d.log?.status === 'given').length
  const canLog = can('logDoses') && !!me && date <= today

  const groups = useMemo(() => {
    const map = new Map<string, ScheduledDose[]>()
    for (const d of doses) map.set(d.time, [...(map.get(d.time) ?? []), d])
    return [...map]
  }, [doses])

  const prnMeds = data.medications.filter((m) => m.active && m.asNeeded)
  const prnLogs = data.doseLogs
    .filter((l) => l.date === date && prnMeds.some((m) => m.id === l.medicationId))
    .sort((a, b) => a.time.localeCompare(b.time))

  const log = (dose: ScheduledDose, status: DoseLog['status'], note = '') => {
    if (!me) return
    upsert('doseLogs', {
      id: newId(),
      medicationId: dose.med.id,
      date: dose.date,
      time: dose.time,
      status,
      memberId: me.id,
      at: Date.now(),
      amount: dose.amount,
      note,
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet !px-2" onClick={() => setDate(addDays(date, -1))} aria-label="Día anterior">
            <Icon name="chevronLeft" />
          </button>
          <span className="min-w-[7rem] text-center text-[17px] font-semibold">{formatRelativeDay(date)}</span>
          <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet !px-2" onClick={() => setDate(addDays(date, 1))} aria-label="Día siguiente">
            <Icon name="chevronRight" />
          </button>
        </div>
        {doses.length > 0 && (
          <span className="text-[15px] text-[color:var(--ap-ink-2)]">
            {given} de {doses.length} tomas
          </span>
        )}
      </div>

      {doses.length > 0 && (
        <div className="mb-5 h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--ap-hairline-soft)' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${(given / doses.length) * 100}%`, backgroundColor: 'var(--win)' }} />
        </div>
      )}

      {doses.length === 0 ? (
        <EmptyState icon="💊" title="No hay tomas programadas este día">
          {data.medications.length === 0 && 'Añade los medicamentos en la pestaña Pauta.'}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {groups.map(([time, items]) => (
            <section key={time}>
              <h3 className="mb-1.5 flex items-center gap-2 px-1 text-[15px] text-[color:var(--ap-ink-2)]">
                <Icon name="clock" size={16} /> {time}
              </h3>
              <ul className="ap-card divide-y overflow-hidden">
                {items.map((dose) => {
                  const overdue = isOverdue(dose, now)
                  const by = memberById(dose.log?.memberId)
                  return (
                    <li key={dose.med.id + dose.time} className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                      <div className="min-w-[12rem] flex-1">
                        <div className="text-[17px] font-semibold">
                          {dose.med.name} <span className="font-normal text-[color:var(--ap-ink-2)]">{dose.med.strength}</span>
                        </div>
                        <div className="text-[14px] text-[color:var(--ap-ink-2)]">
                          {formatAmount(dose.amount, dose.med.form)}
                          {dose.med.instructions && ` · ${dose.med.instructions}`}
                        </div>
                        {dose.log && (
                          <div className="mt-0.5 text-[13px]" style={{ color: dose.log.status === 'given' ? 'var(--win)' : 'var(--loss)' }}>
                            {dose.log.status === 'given' ? '✓ Dada' : '✕ No tomada'} por {by?.name ?? '—'} a las {msToTime(dose.log.at)}
                            {dose.log.note && ` · ${dose.log.note}`}
                          </div>
                        )}
                        {overdue && <div className="mt-0.5 text-[13px] font-medium" style={{ color: 'var(--loss)' }}>Atrasada</div>}
                      </div>
                      {canLog &&
                        (dose.log ? (
                          <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet ml-auto" onClick={() => remove('doseLogs', dose.log!.id)}>
                            Deshacer
                          </button>
                        ) : (
                          <div className="ml-auto flex gap-2">
                            <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => setSkipping(dose)}>
                              No tomada
                            </button>
                            <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => log(dose, 'given')}>
                              <Icon name="check" size={16} /> Dada
                            </button>
                          </div>
                        ))}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {prnMeds.length > 0 && (
        <Section title="Si precisa" className="mt-6">
          <ul className="ap-card divide-y overflow-hidden">
            {prnMeds.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-semibold">
                    {m.name} <span className="font-normal text-[color:var(--ap-ink-2)]">{m.strength}</span>
                  </div>
                  <div className="text-[14px] text-[color:var(--ap-ink-2)]">
                    {[m.purpose, m.instructions].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {canLog && (
                  <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost" onClick={() => setPrn(m)}>
                    Registrar toma
                  </button>
                )}
              </li>
            ))}
          </ul>
          {prnLogs.length > 0 && (
            <ul className="mt-2 space-y-1 px-1 text-[14px] text-[color:var(--ap-ink-2)]">
              {prnLogs.map((l) => {
                const m = data.medications.find((x) => x.id === l.medicationId)
                return (
                  <li key={l.id} className="flex items-center gap-2">
                    <span>
                      {l.time} · {m?.name} ({formatAmount(l.amount, m?.form ?? '')}) · {memberById(l.memberId)?.name}
                      {l.note && ` · ${l.note}`}
                    </span>
                    {canLog && (
                      <button type="button" className="ap-link text-[13px]" onClick={() => remove('doseLogs', l.id)}>
                        Borrar
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      )}

      {skipping && (
        <SkipModal
          dose={skipping}
          onClose={() => setSkipping(null)}
          onConfirm={(note) => {
            log(skipping, 'skipped', note)
            setSkipping(null)
          }}
        />
      )}
      {prn && <PrnModal med={prn} date={date} onClose={() => setPrn(null)} />}
    </>
  )
}

function SkipModal({ dose, onClose, onConfirm }: { dose: ScheduledDose; onClose: () => void; onConfirm: (note: string) => void }) {
  const [note, setNote] = useState('')
  return (
    <Modal open onClose={onClose} title="Toma no realizada" maxWidth="max-w-sm">
      <p className="text-[15px] text-[color:var(--ap-ink-2)]">
        {dose.med.name} de las {dose.time}
      </p>
      <Field label="¿Qué ha pasado? (opcional)" className="mt-3">
        <input className="ap-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="La ha vomitado, no ha querido…" autoFocus />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => onConfirm(note.trim())}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}

function PrnModal({ med, date, onClose }: { med: Medication; date: string; onClose: () => void }) {
  const { me, upsert } = useData()
  const [time, setTime] = useState(date === todayISO() ? nowTime() : '12:00')
  const [amount, setAmount] = useState(1)
  const [note, setNote] = useState('')
  const save = () => {
    if (!me) return
    upsert('doseLogs', {
      id: newId(),
      medicationId: med.id,
      date,
      time,
      status: 'given',
      memberId: me.id,
      at: date === todayISO() ? Date.now() : dateTimeMs(date, time),
      amount,
      note: note.trim(),
    })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={`Toma de ${med.name}`} maxWidth="max-w-sm">
      {med.instructions && (
        <div className="mb-3">
          <Notice>{med.instructions}</Notice>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hora">
          <input type="time" className="ap-input" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label={`Cantidad (${med.form})`}>
          <NumberInput value={amount} onChange={setAmount} />
        </Field>
        <Field label="Motivo (opcional)" className="col-span-2">
          <input className="ap-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dolor de rodilla…" />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={save} disabled={amount <= 0}>
          Registrar
        </button>
      </div>
    </Modal>
  )
}

// --- Pauta -------------------------------------------------------------------

function ScheduleTab({ onEdit }: { onEdit: (m: Medication) => void }) {
  const { data, can } = useData()
  const today = todayISO()
  const active = data.medications
    .filter((m) => m.active && (!m.endDate || m.endDate >= today))
    .sort((a, b) => Number(a.asNeeded) - Number(b.asNeeded) || (a.doses[0]?.time ?? '').localeCompare(b.doses[0]?.time ?? ''))
  const inactive = data.medications.filter((m) => !active.includes(m))

  const card = (m: Medication) => (
    <li key={m.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
      <button
        type="button"
        disabled={!can('editMedications')}
        onClick={() => onEdit(m)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left enabled:hover:bg-black/[0.02]"
      >
        <span className="mt-0.5 text-2xl">💊</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[17px] font-semibold">
              {m.name} <span className="font-normal text-[color:var(--ap-ink-2)]">{m.strength}</span>
            </span>
            {m.asNeeded && <Badge tone="blue">Si precisa</Badge>}
            {m.endDate && <Badge>Hasta {formatDate(m.endDate)}</Badge>}
            {!m.active && <Badge tone="red">Suspendido</Badge>}
          </div>
          {m.purpose && <div className="text-[14px] text-[color:var(--ap-ink-2)]">{m.purpose}</div>}
          <div className="mt-1 text-[14px]">
            {scheduleSummary(m)}
            {!m.asNeeded && m.doses.length > 0 && ` · ${m.doses.map((d) => formatAmount(d.amount, m.form)).join(' / ')}`}
          </div>
          {m.instructions && <div className="text-[14px] text-[color:var(--ap-ink-3)]">{m.instructions}</div>}
        </div>
        {can('editMedications') && <Icon name="edit" size={18} className="mt-1 shrink-0 text-[color:var(--ap-ink-3)]" />}
      </button>
    </li>
  )

  return (
    <>
      {!can('editMedications') && (
        <div className="mb-4">
          <Notice icon="lock">Solo un administrador puede cambiar la pauta de medicación.</Notice>
        </div>
      )}
      {active.length === 0 ? (
        <EmptyState icon="💊" title="Aún no hay medicamentos">
          Añade la medicación con su horario para que todos sepan qué tomar cada día.
        </EmptyState>
      ) : (
        <ul className="ap-card divide-y overflow-hidden">{active.map(card)}</ul>
      )}
      {inactive.length > 0 && (
        <Section title="Suspendidos o finalizados" className="mt-6">
          <ul className="ap-card divide-y overflow-hidden opacity-75">{inactive.map(card)}</ul>
        </Section>
      )}
    </>
  )
}

// --- Stock -------------------------------------------------------------------

const LEVEL: Record<StockStatus['level'], { tone: 'green' | 'amber' | 'red' | 'neutral'; label: string }> = {
  ok: { tone: 'green', label: 'Suficiente' },
  low: { tone: 'amber', label: 'Comprar pronto' },
  out: { tone: 'red', label: 'Se ha acabado' },
  unknown: { tone: 'neutral', label: 'Según uso' },
}

function StockTab() {
  const { data, me, can, memberById, upsert } = useData()
  const now = useNow()
  const [buying, setBuying] = useState<Medication | null>(null)
  const [recounting, setRecounting] = useState<Medication | null>(null)
  const [renewing, setRenewing] = useState<Medication | null>(null)
  const canManage = can('manageStock')

  const rows = data.medications
    .filter((m) => m.active)
    .map((m) => ({ m, st: stockStatus(m, data.doseLogs, now) }))
    .sort((a, b) => (a.st.daysLeft ?? 9999) - (b.st.daysLeft ?? 9999))

  if (rows.length === 0) {
    return <EmptyState icon="📦" title="No hay medicamentos activos" />
  }

  return (
    <>
      <p className="mb-4 px-1 text-[14px] text-[color:var(--ap-ink-2)]">
        Lo que queda se calcula con la pauta desde el último recuento. Cuando compréis, registradlo aquí; si no
        cuadra con lo que hay en casa, haced un recuento.
      </p>
      <ul className="space-y-3">
        {rows.map(({ m, st }) => {
          const level = LEVEL[st.level]
          const buyer = memberById(m.purchaseClaimedBy)
          const rx = prescriptionDaysLeft(m)
          return (
            <li key={m.id} className="ap-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[17px] font-semibold">
                    {m.name} <span className="font-normal text-[color:var(--ap-ink-2)]">{m.strength}</span>
                  </div>
                  <div className="text-[15px]">
                    Quedan ≈ <strong>{formatAmount(st.remaining, m.form)}</strong>
                    {st.runOutDate && (
                      <span className="text-[color:var(--ap-ink-2)]">
                        {' '}· se acaba {formatInDays(st.runOutDate)} ({formatDayShort(st.runOutDate)})
                      </span>
                    )}
                  </div>
                </div>
                <Badge tone={level.tone}>{level.label}</Badge>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-[color:var(--ap-ink-2)]">
                <span>Caja de {m.unitsPerPackage}</span>
                {rx !== null && (
                  <span style={{ color: rx < 0 ? 'var(--loss)' : rx <= PRESCRIPTION_ALERT_DAYS ? 'var(--warn)' : undefined }}>
                    Receta {rx < 0 ? 'caducada el' : 'hasta el'} {formatDate(m.prescriptionExpires)}
                  </span>
                )}
                <span>Recontado {formatRelativeDay(msToISODate(m.stockCountedAt)).toLowerCase()}</span>
              </div>

              {buyer && (
                <div className="mt-2 flex items-center gap-2 text-[14px]">
                  <Icon name="cart" size={16} className="text-[color:var(--ap-ink-3)]" />
                  Se encarga de comprarlo <MemberTag member={buyer} />
                </div>
              )}

              {canManage && me && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => setBuying(m)}>
                    He comprado
                  </button>
                  {m.purchaseClaimedBy === me.id ? (
                    <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => upsert('medications', { ...m, purchaseClaimedBy: null })}>
                      Ya no me encargo
                    </button>
                  ) : (st.level === 'low' || st.level === 'out' || m.purchaseClaimedBy) && (
                    <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost" onClick={() => upsert('medications', { ...m, purchaseClaimedBy: me.id })}>
                      Me encargo yo
                    </button>
                  )}
                  <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet" onClick={() => setRecounting(m)}>
                    Recontar
                  </button>
                  {m.prescriptionExpires && (
                    <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet" onClick={() => setRenewing(m)}>
                      Receta renovada
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {buying && <PurchaseModal med={buying} remaining={stockStatus(buying, data.doseLogs, now).remaining} onClose={() => setBuying(null)} />}
      {recounting && <RecountModal med={recounting} remaining={stockStatus(recounting, data.doseLogs, now).remaining} onClose={() => setRecounting(null)} />}
      {renewing && <RenewModal med={renewing} onClose={() => setRenewing(null)} />}
    </>
  )
}

function PurchaseModal({ med, remaining, onClose }: { med: Medication; remaining: number; onClose: () => void }) {
  const { data, me, can, upsert } = useData()
  const [packages, setPackages] = useState(1)
  const [price, setPrice] = useState('')
  const [addExpense, setAddExpense] = useState(can('editExpenses'))
  const units = packages * med.unitsPerPackage
  const cents = parseMoney(price)

  const save = () => {
    if (!me) return
    upsert('medications', {
      ...med,
      stockUnits: remaining + units,
      stockCountedAt: Date.now(),
      purchaseClaimedBy: null,
    })
    if (addExpense && cents) {
      upsert('expenses', {
        id: newId(),
        date: todayISO(),
        concept: `Farmacia: ${med.name}${packages > 1 ? ` (${packages} cajas)` : ''}`,
        category: 'farmacia',
        amountCents: cents,
        paidById: me.id,
        splitAmong: data.members.filter((m) => m.role !== 'cuidador').map((m) => m.id),
        notes: '',
        createdAt: Date.now(),
      })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Compra de ${med.name}`} maxWidth="max-w-sm">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cajas compradas">
          <NumberInput integer min={1} value={packages} onChange={setPackages} />
        </Field>
        <Field label="Precio total (opcional)">
          <input inputMode="decimal" className="ap-input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00 €" />
        </Field>
      </div>
      <p className="mt-3 text-[15px] text-[color:var(--ap-ink-2)]">
        Pasará a haber ≈ <strong>{formatAmount(remaining + units, med.form)}</strong>.
      </p>
      {can('editExpenses') && cents !== null && (
        <div className="mt-2">
          <Checkbox checked={addExpense} onChange={setAddExpense}>
            Añadir {formatMoney(cents)} a gastos compartidos (pagado por mí)
          </Checkbox>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={save}>
          Guardar compra
        </button>
      </div>
    </Modal>
  )
}

function RecountModal({ med, remaining, onClose }: { med: Medication; remaining: number; onClose: () => void }) {
  const { upsert } = useData()
  const [count, setCount] = useState(remaining)
  return (
    <Modal open onClose={onClose} title={`Recontar ${med.name}`} maxWidth="max-w-sm">
      <p className="mb-3 text-[15px] text-[color:var(--ap-ink-2)]">
        ¿Cuántas unidades ({med.form}) hay ahora mismo en casa? Según la pauta deberían quedar unas {formatAmount(remaining, med.form)}.
      </p>
      <NumberInput value={count} onChange={setCount} ariaLabel="Unidades" />
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="ap-btn ap-btn-sm ap-btn-primary"
          onClick={() => {
            upsert('medications', { ...med, stockUnits: count, stockCountedAt: Date.now() })
            onClose()
          }}
        >
          Guardar
        </button>
      </div>
    </Modal>
  )
}

function RenewModal({ med, onClose }: { med: Medication; onClose: () => void }) {
  const { upsert } = useData()
  const [until, setUntil] = useState(addDays(todayISO(), 365))
  return (
    <Modal open onClose={onClose} title={`Receta de ${med.name}`} maxWidth="max-w-sm">
      <Field label="Nueva fecha de caducidad">
        <input type="date" className="ap-input" value={until} onChange={(e) => setUntil(e.target.value)} />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="ap-btn ap-btn-sm ap-btn-primary"
          onClick={() => {
            upsert('medications', { ...med, prescriptionExpires: until })
            onClose()
          }}
        >
          Guardar
        </button>
      </div>
    </Modal>
  )
}
