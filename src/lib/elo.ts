import type { Match, MatchDerived, Player } from '../types'

export const STARTING_ELO = 1000
export const PROVISIONAL_THRESHOLD = 8

export function kFactor(matchesPlayedBefore: number): number {
  return matchesPlayedBefore < PROVISIONAL_THRESHOLD ? 40 : 32
}

export function expectedScore(ownElo: number, rivalElo: number): number {
  return 1 / (1 + Math.pow(10, (rivalElo - ownElo) / 400))
}

export function isProvisional(matchesPlayed: number): boolean {
  return matchesPlayed < PROVISIONAL_THRESHOLD
}

export interface LevelInfo {
  level: number
  label: string
}

// Nivel 1-7, rangos simétricos alrededor del ELO inicial (1000).
const LEVEL_RANGES: { max: number; level: number }[] = [
  { max: 799, level: 1 },
  { max: 899, level: 2 },
  { max: 999, level: 3 },
  { max: 1099, level: 4 },
  { max: 1199, level: 5 },
  { max: 1299, level: 6 },
  { max: Infinity, level: 7 },
]

export function eloToLevel(elo: number): number {
  for (const range of LEVEL_RANGES) {
    if (elo <= range.max) return range.level
  }
  return 7
}

export function deriveMatch(match: Pick<Match, 'sets'>): MatchDerived {
  let setsWonA = 0
  let setsWonB = 0
  let totalGamesA = 0
  let totalGamesB = 0
  for (const [gamesA, gamesB] of match.sets) {
    totalGamesA += gamesA
    totalGamesB += gamesB
    if (gamesA > gamesB) setsWonA++
    else if (gamesB > gamesA) setsWonB++
  }
  // Ganador por sets; si hay empate a sets, decide quién hizo más juegos.
  let winner: 'A' | 'B'
  if (setsWonA !== setsWonB) winner = setsWonA > setsWonB ? 'A' : 'B'
  else winner = totalGamesA >= totalGamesB ? 'A' : 'B'
  return {
    setsWonA,
    setsWonB,
    winner,
    totalGamesA,
    totalGamesB,
    gameDiff: totalGamesA - totalGamesB,
  }
}

export function createFreshPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    elo: STARTING_ELO,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    eloHistory: [],
  }
}

/**
 * Recalcula el ELO de todos los jugadores desde cero, reproduciendo
 * todos los partidos ordenados por fecha ascendente (y orden de creación
 * como criterio de desempate). Devuelve un nuevo mapa de jugadores;
 * no muta los objetos originales.
 */
export function recomputeElo(players: Player[], matches: Match[]): Player[] {
  const byId = new Map<string, Player>()
  for (const p of players) {
    byId.set(p.id, { ...createFreshPlayer(p.id, p.name) })
  }

  const orderedMatches = [...matches].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.createdAt - b.createdAt
  })

  for (const match of orderedMatches) {
    const derived = deriveMatch(match)
    const [a1id, a2id] = match.teamA
    const [b1id, b2id] = match.teamB
    const a1 = byId.get(a1id)
    const a2 = byId.get(a2id)
    const b1 = byId.get(b1id)
    const b2 = byId.get(b2id)
    if (!a1 || !a2 || !b1 || !b2) continue

    const eloA = (a1.elo + a2.elo) / 2
    const eloB = (b1.elo + b2.elo) / 2
    const expectedA = expectedScore(eloA, eloB)
    const expectedB = 1 - expectedA
    const actualA = derived.winner === 'A' ? 1 : 0
    const actualB = 1 - actualA

    for (const player of [a1, a2]) {
      const k = kFactor(player.matchesPlayed)
      const newElo = player.elo + k * (actualA - expectedA)
      player.elo = newElo
      player.matchesPlayed += 1
      if (actualA === 1) player.wins += 1
      else player.losses += 1
      player.eloHistory.push({ matchId: match.id, date: match.date, elo: newElo })
    }
    for (const player of [b1, b2]) {
      const k = kFactor(player.matchesPlayed)
      const newElo = player.elo + k * (actualB - expectedB)
      player.elo = newElo
      player.matchesPlayed += 1
      if (actualB === 1) player.wins += 1
      else player.losses += 1
      player.eloHistory.push({ matchId: match.id, date: match.date, elo: newElo })
    }
  }

  return Array.from(byId.values())
}

/** Resultado W/L de los últimos N partidos de un jugador, del más antiguo al más reciente. */
export function recentForm(playerId: string, matches: Match[], n = 5): ('W' | 'L')[] {
  const played = [...matches]
    .filter((m) => m.teamA.includes(playerId) || m.teamB.includes(playerId))
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.createdAt - b.createdAt
    })
  const lastN = played.slice(-n)
  return lastN.map((m) => {
    const derived = deriveMatch(m)
    const onTeamA = m.teamA.includes(playerId)
    const won = (onTeamA && derived.winner === 'A') || (!onTeamA && derived.winner === 'B')
    return won ? 'W' : 'L'
  })
}
