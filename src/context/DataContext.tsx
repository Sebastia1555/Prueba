import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { AppData, Match, Player, SetScore } from '../types'
import { createFreshPlayer, recomputeElo } from '../lib/elo'
import { clearData, loadData, saveData } from '../lib/storage'
import { buildSampleData } from '../lib/sampleData'

interface NewMatchInput {
  date: string
  teamA: [string, string]
  teamB: [string, string]
  sets: SetScore[]
}

interface DataContextValue {
  players: Player[]
  matches: Match[]
  addPlayer: (name: string) => Player
  renamePlayer: (id: string, name: string) => void
  addMatch: (input: NewMatchInput) => void
  updateMatch: (id: string, input: NewMatchInput) => void
  deleteMatch: (id: string) => void
  loadSampleData: () => void
  resetAllData: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

function initialData(): AppData {
  const stored = loadData()
  if (stored) return stored
  const sample = buildSampleData()
  const recomputed = recomputeElo(sample.players, sample.matches)
  const data = { players: recomputed, matches: sample.matches }
  saveData(data)
  return data
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => initialData())

  const persist = useCallback((next: AppData) => {
    setData(next)
    saveData(next)
  }, [])

  const addPlayer = useCallback(
    (name: string): Player => {
      const trimmed = name.trim()
      const newPlayer = createFreshPlayer(uuidv4(), trimmed)
      const nextPlayers = [...data.players, newPlayer]
      persist({ players: nextPlayers, matches: data.matches })
      return newPlayer
    },
    [data, persist],
  )

  const renamePlayer = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const nextPlayers = data.players.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
      persist({ players: nextPlayers, matches: data.matches })
    },
    [data, persist],
  )

  const addMatch = useCallback(
    (input: NewMatchInput) => {
      const newMatch: Match = {
        id: uuidv4(),
        createdAt: Date.now(),
        ...input,
      }
      const nextMatches = [...data.matches, newMatch]
      const nextPlayers = recomputeElo(data.players, nextMatches)
      persist({ players: nextPlayers, matches: nextMatches })
    },
    [data, persist],
  )

  const updateMatch = useCallback(
    (id: string, input: NewMatchInput) => {
      const nextMatches = data.matches.map((m) => (m.id === id ? { ...m, ...input } : m))
      const nextPlayers = recomputeElo(data.players, nextMatches)
      persist({ players: nextPlayers, matches: nextMatches })
    },
    [data, persist],
  )

  const deleteMatch = useCallback(
    (id: string) => {
      const nextMatches = data.matches.filter((m) => m.id !== id)
      const nextPlayers = recomputeElo(data.players, nextMatches)
      persist({ players: nextPlayers, matches: nextMatches })
    },
    [data, persist],
  )

  const loadSampleData = useCallback(() => {
    const sample = buildSampleData()
    const recomputed = recomputeElo(sample.players, sample.matches)
    persist({ players: recomputed, matches: sample.matches })
  }, [persist])

  const resetAllData = useCallback(() => {
    clearData()
    persist({ players: [], matches: [] })
  }, [persist])

  const value = useMemo<DataContextValue>(
    () => ({
      players: data.players,
      matches: data.matches,
      addPlayer,
      renamePlayer,
      addMatch,
      updateMatch,
      deleteMatch,
      loadSampleData,
      resetAllData,
    }),
    [data, addPlayer, renamePlayer, addMatch, updateMatch, deleteMatch, loadSampleData, resetAllData],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}
