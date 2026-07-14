import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Analysis, DailyRecommendation } from '../types'
import {
  getFundamentals,
  getPriceHistory,
  getQuote,
  getSP500Constituents,
} from '../data/provider'
import { analyzeStock } from '../engine/valuationEngine'
import { buildDailyRecommendation } from '../engine/recommender'
import { applyDailyDrift, todayISO } from '../engine/market'

interface AppState {
  loading: boolean
  error: string | null
  date: string
  recommendation: DailyRecommendation | null
  analyses: Analysis[]
  byTicker: Record<string, Analysis>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    loading: true,
    error: null,
    date: todayISO(),
    recommendation: null,
    analyses: [],
    byTicker: {},
  })

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const date = todayISO()
        const tickers = await getSP500Constituents()

        // Analiza todo el universo consumiendo la interfaz de datos.
        const analyses = await Promise.all(
          tickers.map(async (t) => {
            const [fundamentals, baseQuote, history] = await Promise.all([
              getFundamentals(t),
              getQuote(t),
              getPriceHistory(t, '1y'),
            ])
            const quote = applyDailyDrift(baseQuote, date)
            return analyzeStock(fundamentals, quote, history)
          }),
        )

        if (cancelled) return
        const recommendation = buildDailyRecommendation(analyses, date)
        const byTicker: Record<string, Analysis> = {}
        for (const a of analyses) byTicker[a.ticker] = a

        setState({
          loading: false,
          error: null,
          date,
          recommendation,
          analyses,
          byTicker,
        })
      } catch (e) {
        if (cancelled) return
        setState((s) => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e.message : 'Error al analizar el mercado.',
        }))
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return <AppContext.Provider value={state}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
