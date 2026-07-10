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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-[34px] font-semibold tracking-[-0.03em]" style={{ color: 'var(--ap-ink)' }}>Historial de partidos</h1>

      {winsBoard.length > 0 && (
        <div className="ap-card mb-6 p-5">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-ink-3)' }}>
            Ranking de victorias
          </h2>
          <div className="flex flex-wrap gap-2">
            {winsBoard.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-full px-3.5 py-2"
                style={{ backgroundColor: 'var(--ap-parchment)', border: '1px solid var(--ap-hairline)' }}
              >
                <span className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--ap-ink-3)' }}>#{i + 1}</span>
                <span className="text-[14px] font-medium" style={{ color: 'var(--ap-ink)' }}>{p.name}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums"
                  style={{ backgroundColor: 'var(--win-bg)', color: 'var(--win)' }}
                >
                  {p.wins}V
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--ap-ink-2)' }}>
          Filtrar por jugador:
          <select
            value={filterPlayerId}
            onChange={(e) => setFilterPlayerId(e.target.value)}
            className="ap-input w-auto"
            style={{ padding: '8px 12px', fontSize: '15px' }}
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
        <p className="rounded-[18px] border border-dashed px-4 py-12 text-center text-[15px]" style={{ borderColor: 'var(--ap-hairline)', color: 'var(--ap-ink-3)' }}>
          No hay partidos que mostrar.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const derived = deriveMatch(match)
            const aWon = derived.winner === 'A'
            return (
              <div key={match.id} className="ap-card p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--ap-ink-3)' }}>{formatDate(match.date)}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditingMatch(match)} className="ap-btn ap-btn-sm ap-btn-quiet">
                      Editar
                    </button>
                    <button type="button" onClick={() => setDeletingMatch(match)} className="ap-btn ap-btn-sm ap-btn-danger-quiet">
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <div
                    className="rounded-[12px] px-3.5 py-2.5 text-[15px]"
                    style={aWon
                      ? { backgroundColor: 'var(--win-bg)', color: 'var(--win)', fontWeight: 600 }
                      : { color: 'var(--ap-ink-2)' }}
                  >
                    {name(match.teamA[0])} / {name(match.teamA[1])}
                    {aWon && <span className="ml-2 text-[13px]">🏆</span>}
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 text-[13px] font-semibold tabular-nums" style={{ color: 'var(--ap-ink-2)' }}>
                    {match.sets.map((s, i) => (
                      <span key={i} className="rounded-md px-2 py-0.5" style={{ backgroundColor: 'var(--ap-parchment)' }}>
                        {s[0]}-{s[1]}
                      </span>
                    ))}
                  </div>
                  <div
                    className="rounded-[12px] px-3.5 py-2.5 text-[15px] sm:text-right"
                    style={!aWon
                      ? { backgroundColor: 'var(--win-bg)', color: 'var(--win)', fontWeight: 600 }
                      : { color: 'var(--ap-ink-2)' }}
                  >
                    {!aWon && <span className="mr-2 text-[13px]">🏆</span>}
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
