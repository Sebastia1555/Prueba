import { useMemo, useState } from 'react'
import type { Expense, ExpenseCategory } from '../types'
import { useData } from '../context/DataContext'
import { formatDate, formatMonth, todayISO } from '../lib/dates'
import { balances, EXPENSE_CATEGORIES, formatMoney, parseMoney, settleUp, type Transfer } from '../lib/expenses'
import { newId } from '../lib/labels'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { Icon } from '../components/Icon'
import { Avatar, Checkbox, EmptyState, Field, Notice, PageHeader, Section } from '../components/ui'

export function Expenses() {
  const { data, can, memberById, upsert } = useData()
  const [editing, setEditing] = useState<Expense | 'new' | null>(null)
  const [settling, setSettling] = useState<Transfer | null>(null)

  const bal = useMemo(() => balances(data.expenses, data.settlements), [data.expenses, data.settlements])
  const transfers = useMemo(() => settleUp(bal), [bal])

  const months = useMemo(() => {
    const map = new Map<string, Expense[]>()
    for (const e of [...data.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)) {
      const k = e.date.slice(0, 7)
      map.set(k, [...(map.get(k) ?? []), e])
    }
    return [...map]
  }, [data.expenses])

  if (!can('viewExpenses')) {
    return <Notice icon="lock">Tu rol no tiene acceso a los gastos.</Notice>
  }

  const involved = data.members.filter((m) => bal.has(m.id) || m.role !== 'cuidador')
  const settlements = [...data.settlements].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <PageHeader
        title="Gastos"
        subtitle="Quién ha pagado qué y cómo quedan las cuentas"
        actions={
          can('editExpenses') && (
            <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => setEditing('new')}>
              <Icon name="plus" size={16} /> Gasto
            </button>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Saldos">
          <ul className="ap-card divide-y overflow-hidden">
            {involved.map((m) => {
              const v = bal.get(m.id) ?? 0
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                  <Avatar member={m} size={30} />
                  <span className="flex-1 text-[16px]">{m.name}</span>
                  <span
                    className="text-[16px] font-semibold"
                    style={{ color: v > 0 ? 'var(--win)' : v < 0 ? 'var(--loss)' : 'var(--ap-ink-3)' }}
                  >
                    {v > 0 ? '+' : ''}
                    {formatMoney(v)}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-1.5 px-1 text-[13px] text-[color:var(--ap-ink-3)]">En verde, a quien le deben; en rojo, quien debe.</p>
        </Section>

        <Section title="Para quedar en paz">
          {transfers.length === 0 ? (
            <div className="ap-card p-4 text-[15px] text-[color:var(--ap-ink-2)]">✅ Las cuentas están en paz.</div>
          ) : (
            <ul className="ap-card divide-y overflow-hidden">
              {transfers.map((t) => (
                <li key={t.fromId + t.toId} className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                  <span className="flex-1 text-[15px]">
                    <strong>{memberById(t.fromId)?.name ?? 'Antiguo miembro'}</strong> paga a <strong>{memberById(t.toId)?.name ?? 'Antiguo miembro'}</strong>
                  </span>
                  <span className="text-[16px] font-semibold">{formatMoney(t.amountCents)}</span>
                  {can('editExpenses') && (
                    <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost" onClick={() => setSettling(t)}>
                      Hecho
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Movimientos">
        {months.length === 0 ? (
          <EmptyState icon="🧾" title="Sin gastos todavía">
            Apunta la farmacia, la cuidadora, la ortopedia… y la app calcula cuánto le toca a cada uno.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {months.map(([month, list]) => {
              const total = list.reduce((s, e) => s + e.amountCents, 0)
              return (
                <div key={month}>
                  <div className="mb-1.5 flex justify-between px-1 text-[15px] text-[color:var(--ap-ink-2)]">
                    <span>{formatMonth(`${month}-01`)}</span>
                    <span className="font-medium">{formatMoney(total)}</span>
                  </div>
                  <ul className="ap-card divide-y overflow-hidden">
                    {list.map((e) => (
                      <li key={e.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                        <button
                          type="button"
                          disabled={!can('editExpenses')}
                          onClick={() => setEditing(e)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-black/[0.02]"
                        >
                          <span className="text-xl">{EXPENSE_CATEGORIES[e.category]?.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[15px] font-medium">{e.concept}</div>
                            <div className="text-[13px] text-[color:var(--ap-ink-3)]">
                              {formatDate(e.date)} · pagó {memberById(e.paidById)?.name ?? '—'} · entre {e.splitAmong.length}
                            </div>
                          </div>
                          <span className="text-[15px] font-semibold">{formatMoney(e.amountCents)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {settlements.length > 0 && (
        <Section title="Pagos entre vosotros">
          <ul className="ap-card divide-y overflow-hidden">
            {settlements.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-[15px]" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                <span className="flex-1">
                  {memberById(s.fromId)?.name} → {memberById(s.toId)?.name}
                  <span className="text-[13px] text-[color:var(--ap-ink-3)]">
                    {' '}· {formatDate(s.date)}
                    {s.note && ` · ${s.note}`}
                  </span>
                </span>
                <span className="font-medium">{formatMoney(s.amountCents)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {editing && <ExpenseForm expense={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!settling}
        title="Registrar pago"
        message={
          settling
            ? `¿${memberById(settling.fromId)?.name} ha pagado ${formatMoney(settling.amountCents)} a ${memberById(settling.toId)?.name}?`
            : ''
        }
        confirmLabel="Sí, registrar"
        onCancel={() => setSettling(null)}
        onConfirm={() => {
          if (settling) {
            upsert('settlements', {
              id: newId(),
              date: todayISO(),
              fromId: settling.fromId,
              toId: settling.toId,
              amountCents: settling.amountCents,
              note: '',
            })
          }
          setSettling(null)
        }}
      />
    </div>
  )
}

function ExpenseForm({ expense, onClose }: { expense?: Expense; onClose: () => void }) {
  const { data, me, upsert, remove } = useData()
  const defaultSplit = data.members.filter((m) => m.role !== 'cuidador').map((m) => m.id)
  const [concept, setConcept] = useState(expense?.concept ?? '')
  const [amount, setAmount] = useState(expense ? (expense.amountCents / 100).toFixed(2).replace('.', ',') : '')
  const [date, setDate] = useState(expense?.date ?? todayISO())
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'farmacia')
  const [paidById, setPaidById] = useState(expense?.paidById ?? me?.id ?? defaultSplit[0] ?? '')
  const [split, setSplit] = useState<string[]>(expense?.splitAmong ?? defaultSplit)
  const [notes, setNotes] = useState(expense?.notes ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const cents = parseMoney(amount)
  const valid = concept.trim() && cents && paidById && split.length > 0

  const save = () => {
    if (!valid || !cents) return
    upsert('expenses', {
      id: expense?.id ?? newId(),
      date,
      concept: concept.trim(),
      category,
      amountCents: cents,
      paidById,
      splitAmong: split,
      notes: notes.trim(),
      createdAt: expense?.createdAt ?? Date.now(),
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={expense ? 'Editar gasto' : 'Nuevo gasto'}>
      <div className="space-y-3">
        <Field label="Concepto">
          <input className="ap-input" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Farmacia, sueldo cuidadora…" autoFocus={!expense} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Importe">
            <input inputMode="decimal" className="ap-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00 €" />
          </Field>
          <Field label="Fecha">
            <input type="date" className="ap-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Categoría">
            <select className="ap-input" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.emoji} {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pagó">
            <select className="ap-input" value={paidById} onChange={(e) => setPaidById(e.target.value)}>
              {data.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div>
          <span className="ap-label">A repartir entre</span>
          <div className="flex flex-wrap gap-x-4">
            {data.members.map((m) => (
              <Checkbox
                key={m.id}
                checked={split.includes(m.id)}
                onChange={(on) => setSplit(on ? [...split, m.id] : split.filter((x) => x !== m.id))}
              >
                {m.name}
              </Checkbox>
            ))}
          </div>
          {cents && split.length > 0 && (
            <p className="mt-1 text-[13px] text-[color:var(--ap-ink-3)]">
              {formatMoney(Math.round(cents / split.length))} por persona
            </p>
          )}
        </div>
        <Field label="Notas (opcional)">
          <input className="ap-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <div className="mt-6 flex items-center justify-between gap-2">
        {expense ? (
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
        title="Eliminar gasto"
        message="Se borrará el gasto y se recalcularán los saldos."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (expense) remove('expenses', expense.id)
          onClose()
        }}
      />
    </Modal>
  )
}
