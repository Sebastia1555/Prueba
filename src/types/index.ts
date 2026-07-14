// Modelo de datos de "Buffett Daily".
// Recomendador diario de compra value sobre el S&P 500.

// --- Datos de mercado (interfaz que la app CONSUME, no implementa) --------

/** Cotización en tiempo real de un valor. */
export interface Quote {
  ticker: string
  price: number
  change: number
  changePct: number
  high52: number
  low52: number
  volume: number
  updatedAt: number
}

/** Fundamentales de un ejercicio (un año fiscal). */
export interface YearFundamentals {
  year: number
  revenue: number
  netIncome: number
  eps: number
  fcf: number
  roe: number // %
  roic: number // %
  totalDebt: number
  equity: number
  ebit: number
  ebitda: number
  grossMargin: number // %
  operatingMargin: number // %
  bookValuePerShare: number
  sharesOutstanding: number
  interestExpense: number
  currentAssets: number
  currentLiabilities: number
}

/** 10 años de fundamentales de un valor (ordenados de más antiguo a más reciente). */
export interface Fundamentals {
  ticker: string
  name: string
  sector: string
  years: YearFundamentals[]
}

/** Punto de la serie histórica de cotización. */
export interface PricePoint {
  t: number // timestamp (ms)
  close: number
}

// --- Salida del motor de scoring -----------------------------------------

export type Conviction = 'Alta' | 'Media' | 'Baja'

export interface QualityDetail {
  score: number // 0-100
  passesHardFilters: boolean
  failedFilters: string[]
  avgRoe10y: number
  avgRoic10y: number
  debtToEbitda: number
  debtToEquity: number
  fcfPositiveYears: number
  epsCagr: number // %
  epsStableOrGrowing: boolean
  avgOperatingMargin: number
  fcfConversion: number // FCF / beneficio neto
  currentRatio: number
  interestCoverage: number
}

export interface ValuationDetail {
  score: number // 0-100
  intrinsicValue: number // DCF de owner earnings, por acción
  grahamNumber: number
  marginOfSafety: number // fracción (0.25 = 25% por debajo del valor intrínseco)
  peCurrent: number
  peHistoricalAvg: number
  pFcf: number
  earningsYield: number // EBIT/EV, fracción
  bondYield: number // referencia bono 10y, fracción
}

export interface TimingDetail {
  score: number // 0-100
  drawdownFrom52wHigh: number // fracción positiva = cuánto por debajo del máximo
  pctVs200dma: number // fracción; negativo = cotiza por debajo de la media
  rsi: number
  valueTrap: boolean // ¿la caída es de negocio y no solo de precio?
}

export interface ScoreBreakdown {
  quality: number
  valuation: number
  timing: number
  total: number
}

/** Análisis completo de un valor. */
export interface Analysis {
  ticker: string
  name: string
  sector: string
  price: number
  changePct: number
  quality: QualityDetail
  valuation: ValuationDetail
  timing: TimingDetail
  scores: ScoreBreakdown
  eligible: boolean // pasa calidad Y margen de seguridad mínimo
  conviction: Conviction
  thesis: string
}

/** Resultado diario del recomendador. */
export interface DailyRecommendation {
  date: string // yyyy-mm-dd
  analyzed: number
  qualityPassed: number
  eligibleCount: number
  hasOpportunity: boolean
  main: Analysis | null
  alternatives: Analysis[]
  watchlist: Analysis[] // calidad alta pero aún sin margen de seguridad
}
