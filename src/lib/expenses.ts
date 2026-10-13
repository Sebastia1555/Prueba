import type { Expense, ExpenseCategory, Settlement } from '../types'

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; emoji: string }> = {
  farmacia: { label: 'Farmacia', emoji: '💊' },
  cuidadora: { label: 'Cuidadora', emoji: '🤝' },
  ortopedia: { label: 'Ortopedia', emoji: '🦯' },
  transporte: { label: 'Transporte', emoji: '🚕' },
  hogar: { label: 'Hogar', emoji: '🏠' },
  otros: { label: 'Otros', emoji: '🧾' },
}

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

export function formatMoney(cents: number): string {
  return euros.format(cents / 100)
}

/**
 * Importe escrito a la española → céntimos: "12,50" → 1250, "1.200" → 120000,
 * "1.200,50" → 120050. También acepta "12.50". Devuelve null si es ambiguo o
 * no es un importe positivo con como mucho dos decimales.
 */
export function parseMoney(input: string): number | null {
  const clean = input.trim().replace(/\s|€/g, '')
  if (!clean) return null
  let normalized: string
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(clean)) {
    // Puntos de miles, con o sin decimales tras la coma.
    normalized = clean.replace(/\./g, '').replace(',', '.')
  } else if (/^\d+(,\d{1,2})?$/.test(clean)) {
    normalized = clean.replace(',', '.')
  } else if (/^\d+\.\d{1,2}$/.test(clean)) {
    normalized = clean
  } else {
    return null
  }
  const n = Number(normalized)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

/** Saldo de cada persona: positivo = le deben, negativo = debe. */
export function balances(expenses: Expense[], settlements: Settlement[]): Map<string, number> {
  const out = new Map<string, number>()
  const add = (id: string, cents: number) => out.set(id, (out.get(id) ?? 0) + cents)

  for (const e of expenses) {
    const among = e.splitAmong.length ? e.splitAmong : [e.paidById]
    add(e.paidById, e.amountCents)
    // Reparto en céntimos sin perder ninguno por redondeo.
    const base = Math.floor(e.amountCents / among.length)
    let rest = e.amountCents - base * among.length
    for (const id of among) {
      add(id, -(base + (rest > 0 ? 1 : 0)))
      if (rest > 0) rest--
    }
  }
  for (const s of settlements) {
    add(s.fromId, s.amountCents)
    add(s.toId, -s.amountCents)
  }
  return out
}

export interface Transfer {
  fromId: string
  toId: string
  amountCents: number
}

/** Mínimas transferencias para dejar todos los saldos a cero. */
export function settleUp(bal: Map<string, number>): Transfer[] {
  const debtors = [...bal].filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v }))
  const creditors = [...bal].filter(([, v]) => v > 0).map(([id, v]) => ({ id, v }))
  debtors.sort((a, b) => b.v - a.v)
  creditors.sort((a, b) => b.v - a.v)

  const out: Transfer[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].v, creditors[j].v)
    if (amount > 0) out.push({ fromId: debtors[i].id, toId: creditors[j].id, amountCents: amount })
    debtors[i].v -= amount
    creditors[j].v -= amount
    if (debtors[i].v === 0) i++
    if (creditors[j].v === 0) j++
  }
  return out
}
