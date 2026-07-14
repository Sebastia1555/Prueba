// Ensambla la recomendación diaria a partir de los análisis de todos los valores.

import type { Analysis, DailyRecommendation } from '../types'

/** Umbral de "negocio excelente" para la watchlist (calidad alta sin precio). */
const WATCHLIST_QUALITY = 62

export function buildDailyRecommendation(
  analyses: Analysis[],
  date: string,
): DailyRecommendation {
  const byTotal = [...analyses].sort((a, b) => b.scores.total - a.scores.total)

  const eligible = byTotal.filter((a) => a.eligible)
  const qualityPassed = analyses.filter((a) => a.quality.passesHardFilters).length

  const main = eligible[0] ?? null
  const alternatives = eligible.slice(1, 4)

  // Watchlist: calidad excelente pero SIN margen de seguridad suficiente hoy.
  const watchlist = byTotal
    .filter((a) => a.quality.passesHardFilters && a.quality.score >= WATCHLIST_QUALITY && !a.eligible)
    .sort((a, b) => b.quality.score - a.quality.score)
    .slice(0, 6)

  return {
    date,
    analyzed: analyses.length,
    qualityPassed,
    eligibleCount: eligible.length,
    hasOpportunity: eligible.length > 0,
    main,
    alternatives,
    watchlist,
  }
}
