// Proveedor de datos simulados para el modo demo (sin clave de API).
//
// Genera una caminata aleatoria realista alrededor de un precio base para que
// la app sea totalmente utilizable y "viva" sin necesidad de configurar nada.

import type { Point, Quote, SymbolInfo } from '../types'

interface Seed {
  symbol: string
  description: string
  base: number
  vol: number // volatilidad relativa por tick
}

const SEEDS: Seed[] = [
  { symbol: 'AAPL', description: 'Apple Inc.', base: 228, vol: 0.0009 },
  { symbol: 'MSFT', description: 'Microsoft Corporation', base: 448, vol: 0.0008 },
  { symbol: 'NVDA', description: 'NVIDIA Corporation', base: 132, vol: 0.0018 },
  { symbol: 'TSLA', description: 'Tesla, Inc.', base: 248, vol: 0.0022 },
  { symbol: 'AMZN', description: 'Amazon.com, Inc.', base: 186, vol: 0.0011 },
  { symbol: 'GOOGL', description: 'Alphabet Inc.', base: 172, vol: 0.001 },
  { symbol: 'META', description: 'Meta Platforms, Inc.', base: 512, vol: 0.0013 },
  { symbol: 'NFLX', description: 'Netflix, Inc.', base: 705, vol: 0.0012 },
  { symbol: 'AMD', description: 'Advanced Micro Devices, Inc.', base: 156, vol: 0.002 },
  { symbol: 'SPY', description: 'SPDR S&P 500 ETF Trust', base: 558, vol: 0.0006 },
  { symbol: 'JPM', description: 'JPMorgan Chase & Co.', base: 212, vol: 0.0009 },
  { symbol: 'DIS', description: 'The Walt Disney Company', base: 96, vol: 0.0012 },
]

const seedMap = new Map(SEEDS.map((s) => [s.symbol, s]))

/** Estado interno de cada símbolo simulado. */
interface SimState {
  seed: Seed
  price: number
  prevClose: number
  open: number
  high: number
  low: number
}

const state = new Map<string, SimState>()

function ensure(symbol: string): SimState {
  const existing = state.get(symbol)
  if (existing) return existing
  const seed =
    seedMap.get(symbol) ??
    // Símbolo desconocido: precio base derivado del texto para que sea estable.
    { symbol, description: symbol, base: 40 + (hash(symbol) % 400), vol: 0.0014 }
  // Cierre anterior con una pequeña deriva y precio de apertura cercano.
  const prevClose = round(seed.base * (1 + gauss() * 0.01))
  const open = round(prevClose * (1 + gauss() * 0.004))
  const price = open
  const s: SimState = { seed, price, prevClose, open, high: Math.max(open, price), low: Math.min(open, price) }
  state.set(symbol, s)
  return s
}

/** Avanza la simulación un tick y devuelve el nuevo precio. */
export function tick(symbol: string): number {
  const s = ensure(symbol)
  const drift = gauss() * s.seed.vol
  s.price = round(Math.max(0.5, s.price * (1 + drift)))
  s.high = Math.max(s.high, s.price)
  s.low = Math.min(s.low, s.price)
  return s.price
}

/** Cotización simulada actual. */
export function demoQuote(symbol: string): Quote {
  const s = ensure(symbol)
  const change = s.price - s.prevClose
  return {
    symbol,
    price: s.price,
    change,
    changePct: s.prevClose ? (change / s.prevClose) * 100 : 0,
    open: s.open,
    high: s.high,
    low: s.low,
    prevClose: s.prevClose,
    updatedAt: Date.now(),
  }
}

/** Serie intradía sintética para el gráfico de detalle (una sesión completa). */
export function demoHistory(symbol: string, points = 96): Point[] {
  const s = ensure(symbol)
  const now = Date.now()
  const stepMs = (6.5 * 60 * 60 * 1000) / points // sesión bursátil de 6,5 h
  let p = s.open
  const out: Point[] = []
  for (let i = 0; i < points; i++) {
    p = round(Math.max(0.5, p * (1 + gauss() * s.seed.vol * 3)))
    out.push({ t: now - (points - i) * stepMs, price: p })
  }
  // El último punto coincide con el precio actual.
  out.push({ t: now, price: s.price })
  return out
}

/** Búsqueda dentro del catálogo de demo. */
export function demoSearch(query: string): SymbolInfo[] {
  const q = query.trim().toUpperCase()
  if (!q) return []
  return SEEDS.filter(
    (s) => s.symbol.includes(q) || s.description.toUpperCase().includes(q),
  ).map((s) => ({ symbol: s.symbol, description: s.description, type: 'Common Stock' }))
}

/** Símbolos destacados sugeridos en el modo demo. */
export function demoSuggestions(): SymbolInfo[] {
  return SEEDS.map((s) => ({ symbol: s.symbol, description: s.description }))
}

// --- utilidades ---------------------------------------------------------

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/** Aproximación a una normal estándar (suma de uniformes). */
function gauss(): number {
  let sum = 0
  for (let i = 0; i < 6; i++) sum += Math.random()
  return (sum - 3) / 1.5
}

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}
