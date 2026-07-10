import { useState } from 'react'
import type { SetScore } from '../types'
import { useData } from '../context/DataContext'
import { PlayerSelect } from './PlayerSelect'

interface SetRow {
  a: string
  b: string
}

export interface MatchFormValues {
  date: string
  teamA: [string, string]
  teamB: [string, string]
  sets: SetScore[]
}

interface MatchFormProps {
  initial?: MatchFormValues
  onSubmit: (values: MatchFormValues) => void
  onCancel?: () => void
  submitLabel?: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function setsToRows(sets: SetScore[] | undefined): SetRow[] {
  if (!sets || sets.length === 0) {
    return [
      { a: '', b: '' },
      { a: '', b: '' },
    ]
  }
  return sets.map(([a, b]) => ({ a: String(a), b: String(b) }))
}

export function MatchForm({ initial, onSubmit, onCancel, submitLabel = 'Guardar partido' }: MatchFormProps) {
  const { players } = useData()
  const [date, setDate] = useState(initial?.date ?? today())
  const [teamA1, setTeamA1] = useState(initial?.teamA[0] ?? '')
  const [teamA2, setTeamA2] = useState(initial?.teamA[1] ?? '')
  const [teamB1, setTeamB1] = useState(initial?.teamB[0] ?? '')
  const [teamB2, setTeamB2] = useState(initial?.teamB[1] ?? '')
  const [setRows, setSetRows] = useState<SetRow[]>(setsToRows(initial?.sets))
  const [error, setError] = useState('')

  const updateSetRow = (index: number, field: 'a' | 'b', value: string) => {
    setSetRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const addSetRow = () => setSetRows((rows) => [...rows, { a: '', b: '' }])
  const removeSetRow = (index: number) =>
    setSetRows((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows))

  const selectedIds = [teamA1, teamA2, teamB1, teamB2]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!date) {
      setError('Selecciona una fecha para el partido.')
      return
    }
    if (!teamA1 || !teamA2 || !teamB1 || !teamB2) {
      setError('Selecciona los 4 jugadores.')
      return
    }
    const uniqueIds = new Set(selectedIds)
    if (uniqueIds.size !== 4) {
      setError('Los 4 jugadores deben ser distintos.')
      return
    }

    const validSets: SetScore[] = []
    for (const row of setRows) {
      const aFilled = row.a.trim() !== ''
      const bFilled = row.b.trim() !== ''
      if (!aFilled && !bFilled) continue
      if (!aFilled || !bFilled) {
        setError('Hay un set incompleto: rellena los juegos de ambos equipos o deja el set vacío.')
        return
      }
      const a = Number(row.a)
      const b = Number(row.b)
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
        setError('Los juegos de cada set deben ser números enteros positivos.')
        return
      }
      if (a === b) {
        setError('Un set no puede acabar en empate: debe haber un ganador.')
        return
      }
      validSets.push([a, b])
    }

    if (validSets.length === 0) {
      setError('Introduce el resultado de al menos un set.')
      return
    }

    onSubmit({
      date,
      teamA: [teamA1, teamA2],
      teamB: [teamB1, teamB2],
      sets: validSets,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="ap-label">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="ap-input sm:w-56"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[18px] border p-4" style={{ borderColor: 'var(--ap-hairline)', backgroundColor: 'var(--ap-parchment)' }}>
          <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-blue)' }}>Equipo A</h3>
          <div className="space-y-3">
            <PlayerSelect label="Jugador 1" players={players} value={teamA1} onChange={setTeamA1} excludeIds={selectedIds} />
            <PlayerSelect label="Jugador 2" players={players} value={teamA2} onChange={setTeamA2} excludeIds={selectedIds} />
          </div>
        </div>
        <div className="rounded-[18px] border p-4" style={{ borderColor: 'var(--ap-hairline)', backgroundColor: 'var(--ap-parchment)' }}>
          <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-ink-2)' }}>Equipo B</h3>
          <div className="space-y-3">
            <PlayerSelect label="Jugador 1" players={players} value={teamB1} onChange={setTeamB1} excludeIds={selectedIds} />
            <PlayerSelect label="Jugador 2" players={players} value={teamB2} onChange={setTeamB2} excludeIds={selectedIds} />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[14px] font-semibold" style={{ color: 'var(--ap-ink-2)' }}>Resultado por sets</label>
          <button type="button" onClick={addSetRow} className="ap-link text-[15px] bg-transparent">
            + Añadir set
          </button>
        </div>
        <div className="space-y-2">
          {setRows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-[13px] font-medium" style={{ color: 'var(--ap-ink-3)' }}>Set {index + 1}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="A"
                value={row.a}
                onChange={(e) => updateSetRow(index, 'a', e.target.value)}
                className="ap-input w-16 text-center"
                style={{ padding: '9px 8px' }}
              />
              <span style={{ color: 'var(--ap-ink-3)' }}>-</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="B"
                value={row.b}
                onChange={(e) => updateSetRow(index, 'b', e.target.value)}
                className="ap-input w-16 text-center"
                style={{ padding: '9px 8px' }}
              />
              {setRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSetRow(index)}
                  aria-label={`Eliminar set ${index + 1}`}
                  className="ml-1 rounded-full p-1.5 text-[color:var(--ap-ink-3)] hover:bg-black/5 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-[12px] px-3.5 py-2.5 text-[14px]" style={{ backgroundColor: 'var(--loss-bg)', color: 'var(--loss)' }}>
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="ap-btn ap-btn-neutral">
            Cancelar
          </button>
        )}
        <button type="submit" className="ap-btn ap-btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
