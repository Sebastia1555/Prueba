// Cliente de la API de Finnhub (https://finnhub.io).
//
// Finnhub ofrece un plan gratuito con CORS habilitado y datos en tiempo real
// de acciones de EE. UU.:
//   - REST  GET /quote           -> precio actual + OHLC + cierre anterior
//   - REST  GET /search          -> búsqueda de símbolos
//   - WS    wss://ws.finnhub.io  -> ticks de operaciones en tiempo real
//
// La clave se pasa como parámetro `token`. Es una clave de cliente pública
// pensada para usarse desde el navegador en el plan gratuito.

import type { Quote, SymbolInfo } from '../types'

const REST_BASE = 'https://finnhub.io/api/v1'
export const WS_BASE = 'wss://ws.finnhub.io'

interface RawQuote {
  c: number // current price
  d: number | null // change
  dp: number | null // percent change
  o: number // open
  h: number // high
  l: number // low
  pc: number // previous close
  t: number // timestamp (s)
}

/** Descarga la cotización actual de un símbolo. */
export async function fetchQuote(symbol: string, apiKey: string): Promise<Quote> {
  const url = `${REST_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
  const res = await fetch(url)
  if (res.status === 401 || res.status === 403) {
    throw new Error('Clave de API no válida o sin permisos.')
  }
  if (res.status === 429) {
    throw new Error('Límite de peticiones alcanzado. Espera unos segundos.')
  }
  if (!res.ok) {
    throw new Error(`Error de red (${res.status}).`)
  }
  const raw = (await res.json()) as RawQuote
  // Finnhub devuelve todo a 0 cuando el símbolo no existe.
  if (!raw || raw.c === 0) {
    throw new Error(`Sin datos para "${symbol}".`)
  }
  const prevClose = raw.pc || raw.c
  const change = raw.d ?? raw.c - prevClose
  const changePct = raw.dp ?? (prevClose ? (change / prevClose) * 100 : 0)
  return {
    symbol,
    price: raw.c,
    change,
    changePct,
    open: raw.o,
    high: raw.h,
    low: raw.l,
    prevClose,
    updatedAt: raw.t ? raw.t * 1000 : Date.now(),
  }
}

interface RawSearch {
  count: number
  result: Array<{ symbol: string; description: string; type: string }>
}

/** Busca símbolos por texto (nombre o ticker). */
export async function searchSymbols(query: string, apiKey: string): Promise<SymbolInfo[]> {
  const url = `${REST_BASE}/search?q=${encodeURIComponent(query)}&token=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error de búsqueda (${res.status}).`)
  const raw = (await res.json()) as RawSearch
  return (raw.result ?? [])
    // Nos quedamos con tickers simples (sin puntos: descarta muchos mercados
    // extranjeros que el plan gratuito no cotiza en tiempo real).
    .filter((r) => r.symbol && !r.symbol.includes('.'))
    .slice(0, 12)
    .map((r) => ({ symbol: r.symbol, description: r.description, type: r.type }))
}
