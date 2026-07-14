// Deriva de mercado determinista por fecha.
//
// La cotización base de los datos mock es fija; aquí le aplicamos un factor
// diario reproducible (mismo día → mismo precio) para que la recomendación sea
// genuinamente "del día" y, en jornadas alcistas, pueda no haber ninguna compra
// con margen de seguridad suficiente (disciplina Buffett).

import type { Quote } from '../types'

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Ruido pseudoaleatorio en [-1, 1] a partir de una semilla entera. */
function noise(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), 1 | t)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1
}

/**
 * Factor multiplicador del precio para (fecha, ticker).
 * Combina una deriva de todo el mercado ese día + ruido idiosincrático.
 */
const DRIFT_SALT = 'S210' // desfase fijo del generador de la deriva diaria

export function dailyPriceFactor(date: string, ticker: string): number {
  const market = noise(hashStr(DRIFT_SALT + date)) * 0.2 // ±20% de todo el mercado
  const idio = noise(hashStr(DRIFT_SALT + date + ':' + ticker)) * 0.05 // ±5% del valor
  return 1 + market + idio
}

/** Aplica la deriva diaria a una cotización base. */
export function applyDailyDrift(quote: Quote, date: string): Quote {
  const f = dailyPriceFactor(date, quote.ticker)
  const price = Math.round(quote.price * f * 100) / 100
  const change = price - quote.price
  return {
    ...quote,
    price,
    change,
    changePct: quote.price ? (change / quote.price) * 100 : 0,
    high52: Math.max(quote.high52, price),
    low52: Math.min(quote.low52, price),
  }
}

/** Fecha de hoy en formato yyyy-mm-dd (hora local). */
export function todayISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
