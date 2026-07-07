export interface EloHistoryEntry {
  matchId: string
  date: string // ISO date string of the match
  elo: number
}

export interface Player {
  id: string
  name: string
  elo: number
  matchesPlayed: number
  wins: number
  losses: number
  eloHistory: EloHistoryEntry[]
}

export type SetScore = [number, number]

export interface Match {
  id: string
  date: string // ISO date string (yyyy-mm-dd)
  createdAt: number // insertion order tiebreaker
  teamA: [string, string] // player ids
  teamB: [string, string]
  sets: SetScore[]
}

export interface MatchDerived {
  setsWonA: number
  setsWonB: number
  winner: 'A' | 'B'
  totalGamesA: number
  totalGamesB: number
  gameDiff: number // totalGamesA - totalGamesB
}

export interface AppData {
  players: Player[]
  matches: Match[]
}
