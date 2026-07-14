// Persistencia sencilla en localStorage para la watchlist y la clave de API.

const WATCHLIST_KEY = 'bolsa-watchlist-v1'
const APIKEY_KEY = 'bolsa-finnhub-key-v1'

/** Watchlist por defecto: valores conocidos para que la app no arranque vacía. */
export const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL']

export function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY)
    if (!raw) return [...DEFAULT_WATCHLIST]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_WATCHLIST]
    const symbols = parsed.filter((s): s is string => typeof s === 'string')
    return symbols
  } catch {
    return [...DEFAULT_WATCHLIST]
  }
}

export function saveWatchlist(symbols: string[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(symbols))
  } catch {
    // almacenamiento no disponible (modo privado, cuota excedida, etc.)
  }
}

export function loadApiKey(): string {
  try {
    return localStorage.getItem(APIKEY_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(APIKEY_KEY, key)
    else localStorage.removeItem(APIKEY_KEY)
  } catch {
    // ignore
  }
}
