// Utilidades de formato de números, precios y fechas.

const priceFmt = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPrice(n: number): string {
  return priceFmt.format(n)
}

/** Precio con el símbolo de dólar (los datos de Finnhub son de mercados de EE. UU.). */
export function formatUsd(n: number): string {
  return `$${priceFmt.format(n)}`
}

export function formatChange(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${priceFmt.format(Math.abs(n))}`
}

export function formatPct(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${priceFmt.format(Math.abs(n))}%`
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Clase de color semántica según el signo de la variación. */
export function trendColor(change: number): string {
  if (change > 0) return 'var(--win)'
  if (change < 0) return 'var(--loss)'
  return 'var(--ap-ink-3)'
}
