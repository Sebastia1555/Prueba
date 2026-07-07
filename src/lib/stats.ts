import type { Match, Player } from '../types'
import { deriveMatch, expectedScore, isProvisional } from './elo'

function samePair(a: [string, string], b: [string, string]): boolean {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])
}

/** Partidos en los que un jugador concreto ha jugado. */
export function matchesOfPlayer(playerId: string, matches: Match[]): Match[] {
  return matches.filter((m) => m.teamA.includes(playerId) || m.teamB.includes(playerId))
}

export interface PartnerStat {
  partnerId: string
  matchesTogether: number
  wins: number
  winRate: number
}

/** Estadísticas de pareja para todos los compañeros con los que un jugador ha jugado. */
export function partnerStats(playerId: string, matches: Match[]): PartnerStat[] {
  const byPartner = new Map<string, { played: number; wins: number }>()
  for (const m of matches) {
    const onA = m.teamA.includes(playerId)
    const onB = m.teamB.includes(playerId)
    if (!onA && !onB) continue
    const team = onA ? m.teamA : m.teamB
    const partnerId = team[0] === playerId ? team[1] : team[0]
    const derived = deriveMatch(m)
    const won = (onA && derived.winner === 'A') || (onB && derived.winner === 'B')
    const entry = byPartner.get(partnerId) ?? { played: 0, wins: 0 }
    entry.played += 1
    if (won) entry.wins += 1
    byPartner.set(partnerId, entry)
  }
  return Array.from(byPartner.entries()).map(([partnerId, { played, wins }]) => ({
    partnerId,
    matchesTogether: played,
    wins,
    winRate: played > 0 ? wins / played : 0,
  }))
}

/** Mejor y peor compañero (con al menos 2 partidos juntos). */
export function bestAndWorstPartner(
  playerId: string,
  matches: Match[],
): { best: PartnerStat | null; worst: PartnerStat | null } {
  const eligible = partnerStats(playerId, matches).filter((s) => s.matchesTogether >= 2)
  if (eligible.length === 0) return { best: null, worst: null }
  const sorted = [...eligible].sort((a, b) => b.winRate - a.winRate)
  return { best: sorted[0], worst: sorted[sorted.length - 1] }
}

/** Partidos anteriores en los que se enfrentaron exactamente estas dos parejas (en cualquier lado). */
export function headToHeadMatches(
  pairA: [string, string],
  pairB: [string, string],
  matches: Match[],
): Match[] {
  return matches.filter((m) => {
    const matchesDirect = samePair(m.teamA, pairA) && samePair(m.teamB, pairB)
    const matchesSwapped = samePair(m.teamA, pairB) && samePair(m.teamB, pairA)
    return matchesDirect || matchesSwapped
  })
}

export interface HeadToHeadResult {
  count: number
  winsPairA: number
  winsPairB: number
}

export function headToHeadRecord(
  pairA: [string, string],
  pairB: [string, string],
  matches: Match[],
): HeadToHeadResult {
  const games = headToHeadMatches(pairA, pairB, matches)
  let winsPairA = 0
  let winsPairB = 0
  for (const m of games) {
    const derived = deriveMatch(m)
    const aIsTeamA = samePair(m.teamA, pairA)
    const pairAWon = (aIsTeamA && derived.winner === 'A') || (!aIsTeamA && derived.winner === 'B')
    if (pairAWon) winsPairA += 1
    else winsPairB += 1
  }
  return { count: games.length, winsPairA, winsPairB }
}

export interface PredictionResult {
  eloProbA: number
  eloProbB: number
  finalProbA: number
  finalProbB: number
  h2h: HeadToHeadResult
  adjusted: boolean
  synergyA: PartnerStat | null
  synergyB: PartnerStat | null
  anyProvisional: boolean
  closenessText: string
}

const MIN_H2H_FOR_ADJUSTMENT = 2
const MIN_PARTNER_MATCHES_FOR_SYNERGY = 2

export function computePrediction(
  pairA: [string, string],
  pairB: [string, string],
  players: Player[],
  matches: Match[],
): PredictionResult {
  const byId = new Map(players.map((p) => [p.id, p]))
  const eloA = ((byId.get(pairA[0])?.elo ?? 1000) + (byId.get(pairA[1])?.elo ?? 1000)) / 2
  const eloB = ((byId.get(pairB[0])?.elo ?? 1000) + (byId.get(pairB[1])?.elo ?? 1000)) / 2
  const eloProbA = expectedScore(eloA, eloB)
  const eloProbB = 1 - eloProbA

  const h2h = headToHeadRecord(pairA, pairB, matches)
  const adjusted = h2h.count >= MIN_H2H_FOR_ADJUSTMENT
  let finalProbA = eloProbA
  let finalProbB = eloProbB
  if (adjusted) {
    const h2hProbA = h2h.winsPairA / h2h.count
    finalProbA = 0.7 * eloProbA + 0.3 * h2hProbA
    finalProbB = 1 - finalProbA
  }

  const synergyOf = (pair: [string, string]): PartnerStat | null => {
    const stats = partnerStats(pair[0], matches).find((s) => s.partnerId === pair[1])
    if (!stats || stats.matchesTogether < MIN_PARTNER_MATCHES_FOR_SYNERGY) return null
    return stats
  }
  const synergyA = synergyOf(pairA)
  const synergyB = synergyOf(pairB)

  const anyProvisional = [...pairA, ...pairB].some((id) => {
    const p = byId.get(id)
    return p ? isProvisional(p.matchesPlayed) : true
  })

  const diff = Math.abs(finalProbA - finalProbB)
  let closenessText: string
  if (diff < 0.1) {
    closenessText = 'Partido muy igualado, cualquiera de las dos parejas puede llevarse la victoria.'
  } else if (diff < 0.25) {
    closenessText = 'Hay una ligera ventaja para una de las parejas, pero el partido está bastante abierto.'
  } else if (diff < 0.5) {
    closenessText = 'Una de las parejas parte como clara favorita.'
  } else {
    closenessText = 'Diferencia de nivel muy marcada entre las dos parejas.'
  }

  return {
    eloProbA,
    eloProbB,
    finalProbA,
    finalProbB,
    h2h,
    adjusted,
    synergyA,
    synergyB,
    anyProvisional,
    closenessText,
  }
}
