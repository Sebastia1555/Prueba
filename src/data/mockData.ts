// Datos MOCK que emulan la API de mercado (Fase 1).
// Un generador determinista construye 10 años de fundamentales, cotización e
// histórico de precios a partir de un perfil compacto por valor. Sustituible en
// fases posteriores por la conexión real (Finnhub u otra) sin tocar la UI.

import type { Fundamentals, PricePoint, Quote, YearFundamentals } from '../types'

type QualityFlavor = 'high' | 'mid' | 'low' | 'trap'

interface Profile {
  ticker: string
  name: string
  sector: string
  eps: number // BPA más reciente ($)
  epsCagr: number // crecimiento anual compuesto 10a (fracción)
  roic: number // %
  roe: number // %
  grossMargin: number // %
  opMargin: number // %
  fcfConv: number // FCF / beneficio neto
  debtToEbitda: number
  shares: number // acciones en circulación (miles de millones)
  price: number // cotización actual ($)
  quality: QualityFlavor
}

// Universo mock (subconjunto representativo del S&P 500, con mezcla deliberada
// de calidad cara, calidad barata, baja calidad y una "value trap").
const PROFILES: Profile[] = [
  // --- Calidad excelente pero CARA (watchlist, sin margen de seguridad) ---
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Tecnología', eps: 6.9, epsCagr: 0.11, roic: 45, roe: 145, grossMargin: 45, opMargin: 30, fcfConv: 1.05, debtToEbitda: 1.2, shares: 15.2, price: 228, quality: 'high' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Tecnología', eps: 11.8, epsCagr: 0.15, roic: 30, roe: 39, grossMargin: 69, opMargin: 44, fcfConv: 0.9, debtToEbitda: 0.6, shares: 7.4, price: 448, quality: 'high' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Tecnología', eps: 2.9, epsCagr: 0.35, roic: 55, roe: 95, grossMargin: 73, opMargin: 55, fcfConv: 0.95, debtToEbitda: 0.3, shares: 24.6, price: 132, quality: 'high' },
  { ticker: 'COST', name: 'Costco Wholesale', sector: 'Consumo básico', eps: 16.6, epsCagr: 0.13, roic: 22, roe: 30, grossMargin: 13, opMargin: 3.6, fcfConv: 0.85, debtToEbitda: 0.5, shares: 0.44, price: 905, quality: 'high' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financiero', eps: 9.9, epsCagr: 0.16, roic: 28, roe: 48, grossMargin: 80, opMargin: 67, fcfConv: 1.0, debtToEbitda: 1.1, shares: 1.95, price: 275, quality: 'high' },
  { ticker: 'LLY', name: 'Eli Lilly & Co.', sector: 'Salud', eps: 12.1, epsCagr: 0.19, roic: 26, roe: 65, grossMargin: 80, opMargin: 40, fcfConv: 0.7, debtToEbitda: 1.8, shares: 0.95, price: 890, quality: 'high' },

  // --- Calidad sólida a precio RAZONABLE / con descuento (candidatos) ------
  { ticker: 'PFE', name: 'Pfizer Inc.', sector: 'Salud', eps: 2.1, epsCagr: 0.04, roic: 14, roe: 18, grossMargin: 60, opMargin: 25, fcfConv: 0.85, debtToEbitda: 2.4, shares: 5.65, price: 19.5, quality: 'mid' },
  { ticker: 'TGT', name: 'Target Corp.', sector: 'Consumo discrecional', eps: 9.2, epsCagr: 0.08, roic: 15, roe: 30, grossMargin: 28, opMargin: 6, fcfConv: 0.8, debtToEbitda: 2.2, shares: 0.46, price: 118, quality: 'mid' },
  { ticker: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Salud', eps: 5.2, epsCagr: 0.05, roic: 16, roe: 28, grossMargin: 75, opMargin: 30, fcfConv: 0.95, debtToEbitda: 2.7, shares: 2.03, price: 59, quality: 'mid' },
  { ticker: 'GILD', name: 'Gilead Sciences', sector: 'Salud', eps: 4.0, epsCagr: 0.04, roic: 18, roe: 30, grossMargin: 78, opMargin: 40, fcfConv: 1.0, debtToEbitda: 2.0, shares: 1.25, price: 48, quality: 'mid' },
  { ticker: 'CSCO', name: 'Cisco Systems', sector: 'Tecnología', eps: 3.4, epsCagr: 0.06, roic: 22, roe: 30, grossMargin: 63, opMargin: 27, fcfConv: 1.0, debtToEbitda: 1.2, shares: 4.0, price: 47, quality: 'high' },
  { ticker: 'MDT', name: 'Medtronic plc', sector: 'Salud', eps: 3.6, epsCagr: 0.05, roic: 13, roe: 15, grossMargin: 65, opMargin: 22, fcfConv: 0.9, debtToEbitda: 2.1, shares: 1.29, price: 82, quality: 'mid' },
  { ticker: 'CMCSA', name: 'Comcast Corp.', sector: 'Comunicaciones', eps: 4.0, epsCagr: 0.09, roic: 13, roe: 20, grossMargin: 68, opMargin: 20, fcfConv: 0.75, debtToEbitda: 2.6, shares: 3.9, price: 39, quality: 'mid' },
  { ticker: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumo básico', eps: 8.1, epsCagr: 0.07, roic: 18, roe: 48, grossMargin: 54, opMargin: 15, fcfConv: 0.8, debtToEbitda: 2.5, shares: 1.37, price: 168, quality: 'high' },
  { ticker: 'KO', name: 'Coca-Cola Co.', sector: 'Consumo básico', eps: 2.5, epsCagr: 0.06, roic: 20, roe: 42, grossMargin: 60, opMargin: 30, fcfConv: 0.85, debtToEbitda: 2.3, shares: 4.3, price: 62, quality: 'high' },

  // --- Grandes compounders a precio de mercado (borde) --------------------
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Comunicaciones', eps: 7.5, epsCagr: 0.18, roic: 28, roe: 30, grossMargin: 57, opMargin: 30, fcfConv: 0.85, debtToEbitda: 0.3, shares: 12.3, price: 172, quality: 'high' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Salud', eps: 6.6, epsCagr: 0.05, roic: 19, roe: 25, grossMargin: 68, opMargin: 26, fcfConv: 0.9, debtToEbitda: 1.4, shares: 2.4, price: 152, quality: 'high' },
  { ticker: 'HD', name: 'Home Depot', sector: 'Consumo discrecional', eps: 15.1, epsCagr: 0.12, roic: 30, roe: 1100, grossMargin: 33, opMargin: 14, fcfConv: 0.9, debtToEbitda: 1.9, shares: 0.99, price: 355, quality: 'high' },

  // --- Baja calidad: NO deben ser comprables por mucho que caigan ---------
  { ticker: 'F', name: 'Ford Motor Co.', sector: 'Consumo discrecional', eps: 1.1, epsCagr: -0.02, roic: 5, roe: 9, grossMargin: 12, opMargin: 3, fcfConv: 0.4, debtToEbitda: 4.8, shares: 3.95, price: 11, quality: 'low' },
  { ticker: 'CCL', name: 'Carnival Corp.', sector: 'Consumo discrecional', eps: 1.3, epsCagr: -0.05, roic: 4, roe: 8, grossMargin: 30, opMargin: 12, fcfConv: 0.3, debtToEbitda: 5.5, shares: 1.27, price: 18, quality: 'low' },
  { ticker: 'WBD', name: 'Warner Bros. Discovery', sector: 'Comunicaciones', eps: -1.2, epsCagr: -0.15, roic: 3, roe: -4, grossMargin: 42, opMargin: 8, fcfConv: 0.5, debtToEbitda: 4.2, shares: 2.45, price: 8, quality: 'low' },
  { ticker: 'T', name: 'AT&T Inc.', sector: 'Comunicaciones', eps: 2.0, epsCagr: -0.03, roic: 6, roe: 11, grossMargin: 55, opMargin: 18, fcfConv: 0.6, debtToEbitda: 3.4, shares: 7.2, price: 19, quality: 'low' },

  // --- Value trap: barata y caída, pero con negocio deteriorándose --------
  { ticker: 'INTC', name: 'Intel Corp.', sector: 'Tecnología', eps: 0.4, epsCagr: -0.12, roic: 6, roe: 8, grossMargin: 40, opMargin: 6, fcfConv: 0.2, debtToEbitda: 3.1, shares: 4.3, price: 21, quality: 'trap' },
]

// --- PRNG determinista (mulberry32) --------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromTicker(ticker: string): number {
  let h = 2166136261
  for (let i = 0; i < ticker.length; i++) {
    h ^= ticker.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const CURRENT_YEAR = 2025

/** Construye 10 años de fundamentales a partir de un perfil. */
function buildFundamentals(p: Profile, rnd: () => number): Fundamentals {
  const years: YearFundamentals[] = []
  const noise = (amp: number) => 1 + (rnd() - 0.5) * amp

  for (let i = 9; i >= 0; i--) {
    const yearsAgo = i
    const growth = (1 + p.epsCagr) ** -yearsAgo
    let eps = p.eps * growth * noise(0.08)

    // Baja calidad / trap: BPA errático y algún año en pérdidas.
    if (p.quality === 'low' && (i === 4 || i === 7)) eps = -Math.abs(eps) * 0.6
    if (p.quality === 'trap' && i === 0) eps = p.eps // el último año ya está deprimido

    const netIncome = eps * p.shares // $B
    const ebit = netIncome / 0.76
    const ebitda = ebit * 1.3
    const totalDebt = ebitda * p.debtToEbitda * noise(0.05)
    const interestExpense = totalDebt * 0.04
    const revenue = p.opMargin > 0 ? Math.abs(ebit) / (p.opMargin / 100) : Math.abs(netIncome) * 5
    const equity = p.roe !== 0 ? Math.abs(netIncome) / (Math.abs(p.roe) / 100) : revenue * 0.4

    // FCF: positivo salvo baja calidad/trap en años concretos.
    let fcf = netIncome * p.fcfConv * noise(0.12)
    if (p.quality === 'low' && (i === 3 || i === 6)) fcf = -Math.abs(fcf) * 0.5
    if (p.quality === 'trap' && i <= 1) fcf = -Math.abs(fcf)

    const currentRatioTarget = p.quality === 'low' || p.quality === 'trap' ? 0.95 : 1.6
    const currentLiabilities = revenue * 0.16
    const currentAssets = currentLiabilities * currentRatioTarget * noise(0.05)

    years.push({
      year: CURRENT_YEAR - yearsAgo,
      revenue,
      netIncome,
      eps,
      fcf,
      roe: p.roe * noise(0.1),
      roic: p.roic * noise(0.1),
      totalDebt,
      equity,
      ebit,
      ebitda,
      grossMargin: p.grossMargin * noise(0.04),
      operatingMargin: p.opMargin * noise(0.08),
      bookValuePerShare: equity / p.shares,
      sharesOutstanding: p.shares,
      interestExpense,
      currentAssets,
      currentLiabilities,
    })
  }

  return { ticker: p.ticker, name: p.name, sector: p.sector, years }
}

/** Genera un histórico de ~1 año de cotización terminando en el precio actual. */
function buildHistory(p: Profile, rnd: () => number): PricePoint[] {
  const n = 260
  const now = Date.parse('2026-07-14T00:00:00Z')
  const dayMs = 24 * 3600 * 1000
  // Partimos de un máximo por encima del precio actual y derivamos hacia él.
  const start = p.price * (1.15 + rnd() * 0.25)
  const points: PricePoint[] = []
  let price = start
  for (let i = 0; i < n; i++) {
    const target = p.price
    const pull = (target - price) * 0.015 // reversión hacia el precio actual
    const shock = price * (rnd() - 0.5) * 0.03
    price = Math.max(0.5, price + pull + shock)
    points.push({ t: now - (n - i) * dayMs, close: Math.round(price * 100) / 100 })
  }
  points[points.length - 1] = { t: now, close: p.price }
  return points
}

function buildQuote(p: Profile, history: PricePoint[]): Quote {
  const closes = history.map((h) => h.close)
  const high52 = Math.max(...closes)
  const low52 = Math.min(...closes)
  const prev = closes[closes.length - 2] ?? p.price
  const change = p.price - prev
  return {
    ticker: p.ticker,
    price: p.price,
    change,
    changePct: prev ? (change / prev) * 100 : 0,
    high52,
    low52,
    volume: Math.round(2_000_000 + (seedFromTicker(p.ticker) % 40_000_000)),
    updatedAt: Date.parse('2026-07-14T20:00:00Z'),
  }
}

export interface MockRecord {
  fundamentals: Fundamentals
  quote: Quote
  history: PricePoint[]
}

/** Base de datos mock indexada por ticker. */
export const MOCK_DB: Record<string, MockRecord> = {}

for (const p of PROFILES) {
  const rnd = mulberry32(seedFromTicker(p.ticker))
  const fundamentals = buildFundamentals(p, rnd)
  const history = buildHistory(p, rnd)
  const quote = buildQuote(p, history)
  MOCK_DB[p.ticker] = { fundamentals, quote, history }
}

export const MOCK_TICKERS = PROFILES.map((p) => p.ticker)

/** Serie del benchmark (S&P 500 vía SPY), determinista. */
export function mockBenchmark(): PricePoint[] {
  const rnd = mulberry32(123456)
  const n = 260
  const now = Date.parse('2026-07-14T00:00:00Z')
  const dayMs = 24 * 3600 * 1000
  let price = 520
  const out: PricePoint[] = []
  for (let i = 0; i < n; i++) {
    price = Math.max(1, price * (1 + (rnd() - 0.48) * 0.01))
    out.push({ t: now - (n - i) * dayMs, close: Math.round(price * 100) / 100 })
  }
  return out
}
