// Utilidades de formato de números, precios, porcentajes y fechas.

const price2 = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatUsd(n: number): string {
  return `$${price2.format(n)}`
}

export function formatChange(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${price2.format(Math.abs(n))}`
}

/** Porcentaje a partir de una fracción (0.25 → "25%"). */
export function formatPctFrac(frac: number, decimals = 0): string {
  return `${(frac * 100).toFixed(decimals)}%`
}

/** Porcentaje a partir de un valor ya en escala 0-100, con signo. */
export function formatPctSigned(n: number, decimals = 1): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${Math.abs(n).toFixed(decimals)}%`
}

export function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Fecha larga en español: "martes, 14 de julio de 2026". */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Color semántico según el signo. */
export function trendColor(n: number): string {
  if (n > 0) return 'var(--win)'
  if (n < 0) return 'var(--loss)'
  return 'var(--ap-ink-3)'
}

/** Color de la píldora de convicción. */
export function convictionColor(conviction: string): { bg: string; fg: string; border: string } {
  switch (conviction) {
    case 'Alta':
      return { bg: 'var(--win-bg)', fg: 'var(--win)', border: 'var(--win-border)' }
    case 'Media':
      return { bg: 'var(--warn-bg)', fg: 'var(--warn)', border: 'var(--warn-border)' }
    default:
      return { bg: 'var(--ap-hairline-soft)', fg: 'var(--ap-ink-2)', border: 'var(--ap-hairline)' }
  }
}
