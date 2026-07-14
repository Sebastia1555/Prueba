import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ConnectionState, Point, Quote, SymbolInfo } from '../types'
import { fetchQuote, searchSymbols, WS_BASE } from '../lib/finnhub'
import {
  demoHistory,
  demoQuote,
  demoSearch,
  demoSuggestions,
  tick as demoTick,
} from '../lib/demo'
import {
  loadApiKey,
  loadWatchlist,
  saveApiKey,
  saveWatchlist,
} from '../lib/storage'

const MAX_POINTS = 400 // tope de la serie por símbolo (memoria)
const POLL_MS = 20_000 // refresco REST en modo en vivo
const FLUSH_MS = 700 // volcado de ticks acumulados a la UI

interface MarketContextValue {
  connection: ConnectionState
  hasKey: boolean
  apiKey: string
  watchlist: string[]
  quotes: Record<string, Quote>
  series: Record<string, Point[]>
  error: string | null
  setApiKey: (key: string) => void
  addSymbol: (symbol: string) => Promise<boolean>
  removeSymbol: (symbol: string) => void
  isInList: (symbol: string) => boolean
  search: (query: string) => Promise<SymbolInfo[]>
  suggestions: SymbolInfo[]
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState(loadApiKey)
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist)
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [series, setSeries] = useState<Record<string, Point[]>>({})
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [error, setError] = useState<string | null>(null)

  const hasKey = apiKey.trim().length > 0

  // Precios pendientes recibidos por WebSocket, volcados a la UI por lotes.
  const pendingRef = useRef<Record<string, number>>({})

  // --- helpers de estado -------------------------------------------------

  const appendPoint = useCallback((symbol: string, price: number, t: number) => {
    setSeries((prev) => {
      const arr = prev[symbol] ?? []
      const last = arr[arr.length - 1]
      // Evita puntos redundantes muy seguidos.
      if (last && t - last.t < 400) {
        const copy = arr.slice()
        copy[copy.length - 1] = { t, price }
        return { ...prev, [symbol]: copy }
      }
      const next = [...arr, { t, price }]
      if (next.length > MAX_POINTS) next.splice(0, next.length - MAX_POINTS)
      return { ...prev, [symbol]: next }
    })
  }, [])

  const applyQuote = useCallback(
    (q: Quote) => {
      setQuotes((prev) => ({ ...prev, [q.symbol]: q }))
      setSeries((prev) => {
        // Siembra la serie la primera vez que vemos el símbolo.
        if (prev[q.symbol]?.length) return prev
        const seed: Point[] = [
          { t: q.updatedAt - 60_000, price: q.open || q.price },
          { t: q.updatedAt, price: q.price },
        ]
        return { ...prev, [q.symbol]: seed }
      })
    },
    [],
  )

  /** Actualiza solo el precio (tick en vivo) recalculando la variación. */
  const applyTick = useCallback((symbol: string, price: number, t: number) => {
    setQuotes((prev) => {
      const q = prev[symbol]
      if (!q) return prev
      const change = price - q.prevClose
      const updated: Quote = {
        ...q,
        price,
        change,
        changePct: q.prevClose ? (change / q.prevClose) * 100 : 0,
        high: Math.max(q.high, price),
        low: q.low ? Math.min(q.low, price) : price,
        updatedAt: t,
      }
      return { ...prev, [symbol]: updated }
    })
    appendPoint(symbol, price, t)
  }, [appendPoint])

  // --- modo DEMO ---------------------------------------------------------

  useEffect(() => {
    if (hasKey) return
    setConnection('demo')
    setError(null)

    // Siembra historia completa e inicializa cotizaciones.
    setSeries((prev) => {
      const next = { ...prev }
      for (const s of watchlist) if (!next[s]?.length) next[s] = demoHistory(s)
      return next
    })
    setQuotes((prev) => {
      const next = { ...prev }
      for (const s of watchlist) next[s] = demoQuote(s)
      return next
    })

    const id = window.setInterval(() => {
      const now = Date.now()
      for (const s of watchlist) {
        const price = demoTick(s)
        applyTick(s, price, now)
      }
    }, 1500)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey, watchlist])

  // --- modo EN VIVO: WebSocket + polling REST ---------------------------

  const wsRef = useRef<WebSocket | null>(null)
  const subbedRef = useRef<Set<string>>(new Set())

  // Volcado periódico de ticks acumulados.
  useEffect(() => {
    if (!hasKey) return
    const id = window.setInterval(() => {
      const pending = pendingRef.current
      pendingRef.current = {}
      const now = Date.now()
      for (const [symbol, price] of Object.entries(pending)) {
        applyTick(symbol, price, now)
      }
    }, FLUSH_MS)
    return () => window.clearInterval(id)
  }, [hasKey, applyTick])

  // Conexión WebSocket (una por clave).
  useEffect(() => {
    if (!hasKey) return
    setConnection('connecting')
    let closed = false
    const ws = new WebSocket(`${WS_BASE}?token=${apiKey}`)
    wsRef.current = ws
    subbedRef.current = new Set()

    ws.onopen = () => {
      if (closed) return
      setConnection('live')
      for (const s of watchlist) {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: s }))
        subbedRef.current.add(s)
      }
    }
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as {
          type: string
          data?: Array<{ s: string; p: number }>
        }
        if (msg.type === 'trade' && msg.data) {
          for (const t of msg.data) pendingRef.current[t.s] = t.p
        }
      } catch {
        // ignora mensajes malformados
      }
    }
    ws.onerror = () => {
      if (!closed) setConnection('offline')
    }
    ws.onclose = () => {
      if (!closed) setConnection('offline')
    }

    return () => {
      closed = true
      wsRef.current = null
      ws.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, hasKey])

  // Ajusta las suscripciones del WebSocket a la watchlist actual.
  useEffect(() => {
    if (!hasKey) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const subbed = subbedRef.current
    for (const s of watchlist) {
      if (!subbed.has(s)) {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: s }))
        subbed.add(s)
      }
    }
    for (const s of [...subbed]) {
      if (!watchlist.includes(s)) {
        ws.send(JSON.stringify({ type: 'unsubscribe', symbol: s }))
        subbed.delete(s)
      }
    }
  }, [watchlist, hasKey, connection])

  // Polling REST: siembra símbolos nuevos y refresca OHLC/fallback.
  useEffect(() => {
    if (!hasKey) return
    let cancelled = false

    const pollAll = async () => {
      for (const s of watchlist) {
        if (cancelled) return
        try {
          const q = await fetchQuote(s, apiKey)
          if (!cancelled) {
            applyQuote(q)
            setError(null)
          }
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Error de red.')
        }
      }
    }

    pollAll()
    const id = window.setInterval(pollAll, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, hasKey, watchlist])

  // --- acciones públicas -------------------------------------------------

  const persistWatchlist = useCallback((next: string[]) => {
    setWatchlist(next)
    saveWatchlist(next)
  }, [])

  const setApiKey = useCallback((key: string) => {
    const trimmed = key.trim()
    setApiKeyState(trimmed)
    saveApiKey(trimmed)
    // Reinicia datos para no mezclar demo y en vivo.
    setQuotes({})
    setSeries({})
    setError(null)
  }, [])

  const isInList = useCallback((symbol: string) => watchlist.includes(symbol), [watchlist])

  const addSymbol = useCallback(
    async (symbol: string): Promise<boolean> => {
      const sym = symbol.trim().toUpperCase()
      if (!sym || watchlist.includes(sym)) return false
      if (hasKey) {
        // Verifica que exista antes de añadirlo.
        try {
          const q = await fetchQuote(sym, apiKey)
          applyQuote(q)
        } catch (e) {
          setError(e instanceof Error ? e.message : `No se pudo añadir "${sym}".`)
          return false
        }
      } else {
        setSeries((prev) => ({ ...prev, [sym]: demoHistory(sym) }))
        setQuotes((prev) => ({ ...prev, [sym]: demoQuote(sym) }))
      }
      persistWatchlist([...watchlist, sym])
      return true
    },
    [watchlist, hasKey, apiKey, applyQuote, persistWatchlist],
  )

  const removeSymbol = useCallback(
    (symbol: string) => {
      persistWatchlist(watchlist.filter((s) => s !== symbol))
    },
    [watchlist, persistWatchlist],
  )

  const search = useCallback(
    async (query: string): Promise<SymbolInfo[]> => {
      const q = query.trim()
      if (!q) return []
      if (hasKey) {
        try {
          return await searchSymbols(q, apiKey)
        } catch {
          return []
        }
      }
      return demoSearch(q)
    },
    [hasKey, apiKey],
  )

  const suggestions = useMemo<SymbolInfo[]>(
    () => (hasKey ? [] : demoSuggestions()),
    [hasKey],
  )

  const value: MarketContextValue = {
    connection,
    hasKey,
    apiKey,
    watchlist,
    quotes,
    series,
    error,
    setApiKey,
    addSymbol,
    removeSymbol,
    isInList,
    search,
    suggestions,
  }

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext)
  if (!ctx) throw new Error('useMarket debe usarse dentro de <MarketProvider>')
  return ctx
}
