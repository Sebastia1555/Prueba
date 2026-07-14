// Utilidades financieras puras y testables usadas por el motor de valoración.

/** Media aritmética. */
export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Desviación típica poblacional. */
export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

/** Coeficiente de variación (dispersión relativa). Menor = más estable. */
export function coefVar(xs: number[]): number {
  const m = Math.abs(mean(xs))
  if (m === 0) return Infinity
  return stdev(xs) / m
}

/**
 * Tasa de crecimiento anual compuesta (CAGR) entre el primer y el último valor.
 * Devuelve fracción (0.08 = 8%). Robusta ante valores no positivos.
 */
export function cagr(first: number, last: number, years: number): number {
  if (years <= 0) return 0
  if (first <= 0 || last <= 0) {
    // Fallback lineal cuando hay signos que impiden la raíz.
    return first === 0 ? 0 : (last - first) / Math.abs(first) / years
  }
  return (last / first) ** (1 / years) - 1
}

/** Acota un número al rango [min, max]. */
export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x))
}

/** Interpolación lineal a escala 0-100 acotada. */
export function scale(x: number, lo: number, hi: number): number {
  if (hi === lo) return 50
  return clamp(((x - lo) / (hi - lo)) * 100, 0, 100)
}

/**
 * DCF a dos etapas sobre "owner earnings" (aproximados por el FCF por acción).
 * - Etapa 1: `years` años creciendo a `growth`.
 * - Etapa 2: valor terminal con crecimiento perpetuo `terminal`.
 * Devuelve el valor intrínseco por acción.
 */
export function dcfPerShare(
  ownerEarningsPerShare: number,
  growth: number,
  discount: number,
  years = 10,
  terminal = 0.025,
): number {
  if (ownerEarningsPerShare <= 0) return 0
  const g = clamp(growth, -0.02, 0.12)
  const r = clamp(discount, 0.06, 0.15)
  const tg = Math.min(terminal, r - 0.01)

  let pv = 0
  let e = ownerEarningsPerShare
  for (let y = 1; y <= years; y++) {
    e *= 1 + g
    pv += e / (1 + r) ** y
  }
  // Valor terminal (Gordon) descontado al presente.
  const terminalValue = (e * (1 + tg)) / (r - tg)
  pv += terminalValue / (1 + r) ** years
  return pv
}

/** Número de Graham: √(22,5 × BPA × valor contable por acción). */
export function grahamNumber(eps: number, bookValuePerShare: number): number {
  if (eps <= 0 || bookValuePerShare <= 0) return 0
  return Math.sqrt(22.5 * eps * bookValuePerShare)
}

/** Media móvil simple sobre los últimos `period` cierres. */
export function sma(closes: number[], period: number): number {
  if (closes.length === 0) return 0
  const slice = closes.slice(-period)
  return mean(slice)
}

/** RSI de Wilder sobre la serie de cierres (por defecto 14 periodos). */
export function rsi(closes: number[], period = 14): number {
  if (closes.length <= period) return 50
  let gains = 0
  let losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** Caída desde el máximo de la serie (fracción positiva). */
export function drawdownFromHigh(price: number, high: number): number {
  if (high <= 0) return 0
  return clamp((high - price) / high, 0, 1)
}
