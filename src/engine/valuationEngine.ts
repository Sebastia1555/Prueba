// Motor de scoring value (estilo Buffett / Graham).
//
// Un valor solo es "comprable" (eligible) si:
//   1) pasa el filtro DURO de calidad, y
//   2) tiene un margen de seguridad >= MIN_MARGIN_OF_SAFETY.
// El timing solo prioriza/desempata entre buenos candidatos.

import type {
  Analysis,
  Conviction,
  Fundamentals,
  PricePoint,
  QualityDetail,
  Quote,
  TimingDetail,
  ValuationDetail,
} from '../types'
import {
  cagr,
  clamp,
  coefVar,
  dcfPerShare,
  drawdownFromHigh,
  grahamNumber,
  mean,
  rsi,
  scale,
  sma,
} from './finance'

/** Margen de seguridad mínimo exigido para marcar "COMPRAR". */
export const MIN_MARGIN_OF_SAFETY = 0.25

/** Rentabilidad del bono a 10 años usada como coste de oportunidad. */
export const BOND_YIELD = 0.043

/** Pesos del ranking final (value-first). */
export const WEIGHTS = { quality: 0.45, valuation: 0.4, timing: 0.15 } as const

// --- Capa 1: calidad del negocio -----------------------------------------

export function assessQuality(f: Fundamentals): QualityDetail {
  const ys = f.years
  const last = ys[ys.length - 1]
  const roe = ys.map((y) => y.roe)
  const roic = ys.map((y) => y.roic)
  const eps = ys.map((y) => y.eps)
  const opMargins = ys.map((y) => y.operatingMargin)

  const avgRoe10y = mean(roe)
  const avgRoic10y = mean(roic)
  const debtToEbitda = last.ebitda > 0 ? last.totalDebt / last.ebitda : Infinity
  const debtToEquity = last.equity > 0 ? last.totalDebt / last.equity : Infinity
  const fcfPositiveYears = ys.filter((y) => y.fcf > 0).length
  const epsCagrFrac = cagr(eps[0], eps[eps.length - 1], ys.length - 1)
  const negativeEpsYears = eps.filter((e) => e <= 0).length
  const epsStableOrGrowing = negativeEpsYears <= 1 && epsCagrFrac > -0.01
  const avgOperatingMargin = mean(opMargins)
  const netIncome = last.netIncome
  const fcfConversion = netIncome > 0 ? last.fcf / netIncome : 0
  const currentRatio =
    last.currentLiabilities > 0 ? last.currentAssets / last.currentLiabilities : 3
  const interestCoverage =
    last.interestExpense > 0 ? last.ebit / last.interestExpense : 50

  // --- Filtros duros ---
  const failedFilters: string[] = []
  if (avgRoe10y <= 12) failedFilters.push('ROE medio 10a ≤ 12%')
  if (!(debtToEbitda < 3 || debtToEquity < 1))
    failedFilters.push('Deuda/EBITDA ≥ 3 y Deuda/Patrimonio ≥ 1')
  if (fcfPositiveYears < 8) failedFilters.push('FCF positivo en < 8 de 10 años')
  if (!epsStableOrGrowing) failedFilters.push('BPA inestable o con pérdidas recurrentes')
  if (avgOperatingMargin <= 0) failedFilters.push('Margen operativo medio ≤ 0')
  const passesHardFilters = failedFilters.length === 0

  // --- Score ponderado 0-100 ---
  const roicScore = scale(avgRoic10y, 5, 25)
  const epsConsistency = clamp(100 - coefVar(eps) * 120, 0, 100)
  const epsGrowthScore = scale(epsCagrFrac * 100, 0, 15)
  const epsScore = 0.55 * epsConsistency + 0.45 * epsGrowthScore
  const balanceScore =
    0.5 * scale(3 - Math.min(debtToEbitda, 6), 0, 3) +
    0.25 * scale(currentRatio, 1, 2.5) +
    0.25 * scale(Math.min(interestCoverage, 30), 3, 20)
  const marginScore =
    0.6 * scale(avgOperatingMargin, 5, 35) + 0.4 * clamp(100 - coefVar(opMargins) * 200, 0, 100)
  const fcfScore = scale(fcfConversion, 0.4, 1.1)

  const score =
    0.3 * roicScore +
    0.2 * epsScore +
    0.2 * balanceScore +
    0.15 * marginScore +
    0.15 * fcfScore

  return {
    score,
    passesHardFilters,
    failedFilters,
    avgRoe10y,
    avgRoic10y,
    debtToEbitda,
    debtToEquity,
    fcfPositiveYears,
    epsCagr: epsCagrFrac * 100,
    epsStableOrGrowing,
    avgOperatingMargin,
    fcfConversion,
    currentRatio,
    interestCoverage,
  }
}

// --- Capa 2: valoración y margen de seguridad ----------------------------

export function assessValuation(f: Fundamentals, price: number): ValuationDetail {
  const ys = f.years
  const last = ys[ys.length - 1]
  const fcfPerShare = last.fcf / last.sharesOutstanding

  // Crecimiento conservador: mínimo entre el CAGR histórico del FCF y un tope.
  const fcfHist = ys.map((y) => y.fcf)
  const histGrowth = cagr(fcfHist[0], fcfHist[fcfHist.length - 1], ys.length - 1)
  const growth = clamp(Math.min(histGrowth, 0.08), 0, 0.08)
  const intrinsicValue = dcfPerShare(fcfPerShare, growth, 0.095, 10, 0.025)

  const graham = grahamNumber(last.eps, last.bookValuePerShare)
  const marginOfSafety = intrinsicValue > 0 ? (intrinsicValue - price) / intrinsicValue : -1

  const peCurrent = last.eps > 0 ? price / last.eps : Infinity
  const peHistoricalAvg = mean(
    ys.map((y) => (y.eps > 0 ? (y.bookValuePerShare + y.eps * 15) / y.eps : 20)),
  )
  const pFcf = fcfPerShare > 0 ? price / fcfPerShare : Infinity

  const marketCap = price * last.sharesOutstanding
  const ev = marketCap + last.totalDebt
  const earningsYield = ev > 0 ? last.ebit / ev : 0

  // Score 0-100: margen de seguridad domina, con apoyo de múltiplos y yield.
  const mosScore = scale(marginOfSafety * 100, -20, 50)
  const peScore = peHistoricalAvg > 0 ? scale(peHistoricalAvg - peCurrent, -8, 8) : 50
  const yieldScore = scale((earningsYield - BOND_YIELD) * 100, -2, 6)
  const grahamScore = graham > 0 ? scale((graham - price) / graham, -0.3, 0.4) * 100 : 50

  const score = 0.55 * mosScore + 0.2 * peScore + 0.15 * yieldScore + 0.1 * (grahamScore / 100) * 100

  return {
    score: clamp(score, 0, 100),
    intrinsicValue,
    grahamNumber: graham,
    marginOfSafety,
    peCurrent,
    peHistoricalAvg,
    pFcf,
    earningsYield,
    bondYield: BOND_YIELD,
  }
}

// --- Capa 3: oportunidad / timing de la caída ----------------------------

export function assessTiming(
  quote: Quote,
  history: PricePoint[],
  qualityDeteriorated: boolean,
): TimingDetail {
  const closes = history.map((p) => p.close)
  const ma200 = sma(closes, 200)
  const drawdown = drawdownFromHigh(quote.price, quote.high52)
  const pctVs200dma = ma200 > 0 ? (quote.price - ma200) / ma200 : 0
  const r = rsi(closes, 14)

  // Value trap: precio caído Y fundamentales deteriorados a la vez.
  const valueTrap = drawdown > 0.15 && qualityDeteriorated

  const drawdownScore = scale(drawdown * 100, 0, 40)
  const maScore = scale(-pctVs200dma * 100, -10, 25) // más por debajo de la MA = mejor
  const rsiScore = scale(50 - r, -20, 30) // sobreventa = mejor
  let score = 0.45 * drawdownScore + 0.35 * maScore + 0.2 * rsiScore
  if (valueTrap) score *= 0.4 // penalización fuerte

  return {
    score: clamp(score, 0, 100),
    drawdownFrom52wHigh: drawdown,
    pctVs200dma,
    rsi: r,
    valueTrap,
  }
}

// --- Ensamblado del análisis por valor -----------------------------------

/** Detecta deterioro del negocio: BPA o FCF recientes cayendo con fuerza. */
function isQualityDeteriorating(f: Fundamentals): boolean {
  const ys = f.years
  if (ys.length < 3) return false
  const last = ys[ys.length - 1]
  const prev = ys[ys.length - 2]
  const epsDrop = prev.eps > 0 ? (last.eps - prev.eps) / prev.eps : 0
  const fcfNegative = last.fcf <= 0
  return epsDrop < -0.2 || fcfNegative
}

function convictionFor(total: number, mos: number): Conviction {
  if (total >= 72 && mos >= 0.35) return 'Alta'
  if (total >= 58 && mos >= MIN_MARGIN_OF_SAFETY) return 'Media'
  return 'Baja'
}

function buildThesis(
  f: Fundamentals,
  q: QualityDetail,
  v: ValuationDetail,
  t: TimingDetail,
): string {
  const roic = q.avgRoic10y.toFixed(0)
  const mos = (v.marginOfSafety * 100).toFixed(0)
  const dd = (t.drawdownFrom52wHigh * 100).toFixed(0)
  const quality = `${f.name} es un negocio de calidad: ROIC medio del ${roic}% a 10 años, FCF positivo ${q.fcfPositiveYears} de 10 años y balance sano (Deuda/EBITDA ${q.debtToEbitda.toFixed(1)}).`
  const value = `Cotiza un ${mos}% por debajo de su valor intrínseco estimado`
  const timing =
    t.drawdownFrom52wHigh > 0.1
      ? `, tras caer un ${dd}% desde máximos sin deterioro del negocio.`
      : `, ofreciendo margen de seguridad con fundamentales intactos.`
  return `${quality} ${value}${timing}`
}

export function analyzeStock(
  f: Fundamentals,
  quote: Quote,
  history: PricePoint[],
): Analysis {
  const quality = assessQuality(f)
  const valuation = assessValuation(f, quote.price)
  const deteriorating = isQualityDeteriorating(f)
  const timing = assessTiming(quote, history, deteriorating)

  const total =
    WEIGHTS.quality * quality.score +
    WEIGHTS.valuation * valuation.score +
    WEIGHTS.timing * timing.score

  const eligible =
    quality.passesHardFilters &&
    valuation.marginOfSafety >= MIN_MARGIN_OF_SAFETY &&
    !timing.valueTrap

  return {
    ticker: f.ticker,
    name: f.name,
    sector: f.sector,
    price: quote.price,
    changePct: quote.changePct,
    quality,
    valuation,
    timing,
    scores: {
      quality: quality.score,
      valuation: valuation.score,
      timing: timing.score,
      total,
    },
    eligible,
    conviction: convictionFor(total, valuation.marginOfSafety),
    thesis: buildThesis(f, quality, valuation, timing),
  }
}
