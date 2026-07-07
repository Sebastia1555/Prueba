import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { deriveMatch } from '../lib/elo'
import { formatDate } from '../lib/format'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { MatchForm, type MatchFormValues } from '../components/MatchForm'
import type { Match } from '../types'

export function History() {
  const { players, matches, updateMatch, deleteMatch } = useData()
  const [filterPlayerId, setFilterPlayerId] = useState('')
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null)

  const nameById = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players])
  const name = (id: string) => nameById.get(id) ?? '???'

  const winsBoard = useMemo(() => {
    return [...players]
      .filter((p) => p.matchesPlayed > 0)
      .sort((a, b) => b.wins - a.wins)
  }, [players])

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.createdAt - a.createdAt
    })
  }, [matches])

  const filteredMatches = filterPlayerId
    ? sortedMatches.filter((m) => m.teamA.includes(filterPlayerId) || m.teamB.includes(filterPlayerId))
    : sortedMatches

  const handleUpdate = (values: MatchFormValues) => {
    if (!editingMatch) return
    updateMatch(editingMatch.id, values)
    setEditingMatch(null)
  }

  const handleDelete = () => {
    if (!deletingMatch) return
    deleteMatch(deletingMatch.id)
    setDeletingMatch(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Historial de partidos</h1>

      {winsBoard.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Ranking de victorias
          </h2>
          <div className="flex flex-wrap gap-2">
            {winsBoard.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                <span className="text-sm font-medium text-slate-800">{p.name}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {p.wins}V
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Filtrar por jugador:
          <select
            value={filterPlayerId}
            onChange={(e) => setFilterPlayerId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">Todos</option>
            {[...players]
              .sort((a, b) => a.name.localeCompare(b.name, 'es'))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
      </div>

      {filteredMatches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No hay partidos que mostrar.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const derived = deriveMatch(match)
            const aWon = derived.winner === 'A'
            return (
              <div key={match.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{formatDate(match.date)}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingMatch(match)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingMatch(match)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      aWon ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-600'
                    }`}
                  >
                    {name(match.teamA[0])} / {name(match.teamA[1])}
                    {aWon && <span className="ml-2 text-xs">🏆</span>}
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 text-xs font-mono text-slate-500">
                    {match.sets.map((s, i) => (
                      <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5">
                        {s[0]}-{s[1]}
                      </span>
                    ))}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm sm:text-right ${
                      !aWon ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-600'
                    }`}
                  >
                    {!aWon && <span className="mr-2 text-xs">🏆</span>}
                    {name(match.teamB[0])} / {name(match.teamB[1])}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={!!editingMatch}
        onClose={() => setEditingMatch(null)}
        title="Editar partido"
        maxWidth="max-w-2xl"
      >
        {editingMatch && (
          <MatchForm
            initial={{
              date: editingMatch.date,
              teamA: editingMatch.teamA,
              teamB: editingMatch.teamB,
              sets: editingMatch.sets,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingMatch(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingMatch}
        title="Eliminar partido"
        message="¿Seguro que quieres eliminar este partido? Se recalculará el ELO de todos los jugadores. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingMatch(null)}
      />
    </div>
  )
}
