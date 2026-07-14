// Núcleo de datos de la app de cotizaciones en tiempo real.

/** Cotización actual de un valor. */
export interface Quote {
  symbol: string
  price: number
  /** Variación absoluta respecto al cierre anterior. */
  change: number
  /** Variación porcentual respecto al cierre anterior. */
  changePct: number
  open: number
  high: number
  low: number
  prevClose: number
  /** Marca de tiempo (ms) de la última actualización. */
  updatedAt: number
}

/** Resultado de búsqueda de símbolos. */
export interface SymbolInfo {
  symbol: string
  /** Nombre de la empresa / descripción. */
  description: string
  type?: string
}

/** Punto de la serie temporal usada para los gráficos. */
export interface Point {
  t: number // timestamp (ms)
  price: number
}

/** Estado de la conexión de datos en vivo. */
export type ConnectionState = 'connecting' | 'live' | 'demo' | 'offline'
