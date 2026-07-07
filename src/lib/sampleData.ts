import type { AppData, Match, Player } from '../types'
import { createFreshPlayer } from './elo'

const NAMES: Record<string, string> = {
  p1: 'Alba',
  p2: 'Bruno',
  p3: 'Carla',
  p4: 'Diego',
  p5: 'Elena',
  p6: 'Fer',
  p7: 'Gonzalo',
  p8: 'Hugo',
  p9: 'Irene',
  p10: 'Marta',
}

function player(id: string): Player {
  return createFreshPlayer(id, NAMES[id])
}

const RAW_MATCHES: Omit<Match, 'createdAt'>[] = [
  { id: 'm1', date: '2026-05-02', teamA: ['p1', 'p2'], teamB: ['p3', 'p4'], sets: [[6, 3], [6, 4]] },
  { id: 'm2', date: '2026-05-04', teamA: ['p5', 'p6'], teamB: ['p7', 'p8'], sets: [[4, 6], [6, 7]] },
  { id: 'm3', date: '2026-05-06', teamA: ['p1', 'p3'], teamB: ['p2', 'p4'], sets: [[6, 4], [3, 6], [6, 2]] },
  { id: 'm4', date: '2026-05-09', teamA: ['p9', 'p7'], teamB: ['p5', 'p8'], sets: [[6, 2], [6, 3]] },
  { id: 'm5', date: '2026-05-11', teamA: ['p1', 'p2'], teamB: ['p3', 'p4'], sets: [[6, 2], [6, 3]] },
  { id: 'm6', date: '2026-05-13', teamA: ['p6', 'p8'], teamB: ['p7', 'p9'], sets: [[7, 6], [4, 6], [6, 4]] },
  { id: 'm7', date: '2026-05-16', teamA: ['p4', 'p5'], teamB: ['p2', 'p3'], sets: [[6, 3], [2, 6], [6, 4]] },
  { id: 'm8', date: '2026-05-18', teamA: ['p1', 'p4'], teamB: ['p2', 'p3'], sets: [[6, 4], [6, 7], [7, 5]] },
  { id: 'm9', date: '2026-05-21', teamA: ['p7', 'p8'], teamB: ['p5', 'p6'], sets: [[6, 3], [6, 2]] },
  { id: 'm10', date: '2026-05-23', teamA: ['p1', 'p2'], teamB: ['p9', 'p7'], sets: [[6, 4], [3, 6], [6, 3]] },
  { id: 'm11', date: '2026-05-26', teamA: ['p3', 'p4'], teamB: ['p8', 'p9'], sets: [[6, 2], [6, 4]] },
  { id: 'm12', date: '2026-05-29', teamA: ['p1', 'p3'], teamB: ['p2', 'p4'], sets: [[4, 6], [6, 7]] },
  { id: 'm13', date: '2026-06-01', teamA: ['p5', 'p7'], teamB: ['p6', 'p8'], sets: [[6, 4], [4, 6], [7, 5]] },
  { id: 'm14', date: '2026-06-04', teamA: ['p1', 'p2'], teamB: ['p3', 'p4'], sets: [[6, 3], [4, 6], [6, 4]] },
  { id: 'm15', date: '2026-06-07', teamA: ['p9', 'p6'], teamB: ['p7', 'p8'], sets: [[6, 7], [6, 4], [4, 6]] },
  { id: 'm16', date: '2026-06-10', teamA: ['p4', 'p8'], teamB: ['p1', 'p9'], sets: [[6, 4], [6, 2]] },
  { id: 'm17', date: '2026-06-14', teamA: ['p2', 'p5'], teamB: ['p3', 'p7'], sets: [[7, 5], [3, 6], [6, 2]] },
  { id: 'm18', date: '2026-06-18', teamA: ['p1', 'p2'], teamB: ['p5', 'p6'], sets: [[6, 2], [6, 1]] },
  { id: 'm19', date: '2026-06-22', teamA: ['p3', 'p4'], teamB: ['p7', 'p9'], sets: [[6, 4], [2, 6], [6, 3]] },
  { id: 'm20', date: '2026-06-27', teamA: ['p8', 'p9'], teamB: ['p6', 'p5'], sets: [[6, 3], [4, 6], [6, 4]] },
]

export function buildSampleData(): AppData {
  const players = Object.keys(NAMES).map((id) => player(id))
  const matches: Match[] = RAW_MATCHES.map((m, index) => ({
    ...m,
    teamA: [...m.teamA] as [string, string],
    teamB: [...m.teamB] as [string, string],
    sets: m.sets.map((s) => [...s] as [number, number]),
    createdAt: index,
  }))
  return { players, matches }
}
