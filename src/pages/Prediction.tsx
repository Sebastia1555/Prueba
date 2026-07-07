import { useState } from 'react'
import { useData } from '../context/DataContext'
import { PlayerSelect } from '../components/PlayerSelect'
import { ProvisionalBadge } from '../components/Badges'
import { computePrediction, type PredictionResult } from '../lib/stats'
import { formatPercent } from '../lib/format'

export function Prediction() {
  const { players, matches } = useData()
  const [a1, setA1] = useState('')
  const [a2, setA2] = useState('')
  const [b1, setB1] = useState('')
  const [b2, setB2] = useState('')
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState('')

  const selectedIds = [a1, a2, b1, b2]

  const wrap = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setResult(null)
  }

  const nameById = new Map(players.map((p) => [p.id, p.name]))
  const name = (id: string) => nameById.get(id) ?? '???'

  const handleCalculate = () => {
    setError('')
    if (!a1 || !a2 || !b1 || !b2) {
      setError('Selecciona los 4 jugadores antes de calcular.')
      return
    }
    if (new Set(selectedIds).size !== 4) {
      setError('Los 4 jugadores deben ser distintos.')
      return
    }
    const prediction = computePrediction([a1, a2], [b1, b2], players, matches)
    setResult(prediction)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Predicción de partido</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-emerald-800">Pareja A</h3>
            <div className="space-y-3">
              <PlayerSelect label="Jugador 1" players={players} value={a1} onChange={wrap(setA1)} excludeIds={selectedIds} />
              <PlayerSelect label="Jugador 2" players={players} value={a2} onChange={wrap(setA2)} excludeIds={selectedIds} />
            </div>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-sky-800">Pareja B</h3>
            <div className="space-y-3">
              <PlayerSelect label="Jugador 1" players={players} value={b1} onChange={wrap(setB1)} excludeIds={selectedIds} />
              <PlayerSelect label="Jugador 2" players={players} value={b2} onChange={wrap(setB2)} excludeIds={selectedIds} />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={handleCalculate}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Calcular predicción
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {result.anyProvisional && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <ProvisionalBadge />
              <span>
                Al menos uno de los 4 jugadores tiene menos de 8 partidos jugados, así que su nivel aún no es
                del todo fiable y la predicción puede no ajustarse a la realidad.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {name(a1)} / {name(a2)}
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-800">{formatPercent(result.finalProbA)}</p>
              <p className="mt-1 text-xs text-emerald-700">de ganar el partido</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                {name(b1)} / {name(b2)}
              </p>
              <p className="mt-2 text-3xl font-bold text-sky-800">{formatPercent(result.finalProbB)}</p>
              <p className="mt-1 text-xs text-sky-700">de ganar el partido</p>
            </div>
          </div>

          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700">{result.closenessText}</p>

          <div className="mt-4 rounded-lg border border-slate-100 px-3 py-2.5 text-sm text-slate-600">
            {result.adjusted ? (
              <p>
                <span className="font-semibold text-slate-800">Ajuste por enfrentamientos directos: </span>
                estas dos parejas exactas ya se han enfrentado {result.h2h.count} veces (
                {result.h2h.winsPairA}-{result.h2h.winsPairB} a favor de {name(a1)}/{name(a2)}), así que la
                probabilidad mostrada mezcla un 70% del ELO combinado con un 30% de ese historial de
                enfrentamientos directos.
              </p>
            ) : (
              <p>
                <span className="font-semibold text-slate-800">Sin ajuste por enfrentamientos directos: </span>
                estas dos parejas exactas se han enfrentado {result.h2h.count} {result.h2h.count === 1 ? 'vez' : 'veces'}
                {' '}(se necesitan al menos 2 para ajustar la predicción), así que la probabilidad se basa
                únicamente en el ELO combinado de cada pareja.
              </p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SynergyCard pairLabel={`${name(a1)} / ${name(a2)}`} synergy={result.synergyA} />
            <SynergyCard pairLabel={`${name(b1)} / ${name(b2)}`} synergy={result.synergyB} />
          </div>
        </div>
      )}
    </div>
  )
}

function SynergyCard({
  pairLabel,
  synergy,
}: {
  pairLabel: string
  synergy: { matchesTogether: number; wins: number; winRate: number } | null
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
      <p className="font-semibold text-slate-700">Sinergia: {pairLabel}</p>
      {synergy ? (
        <p className="mt-1 text-slate-600">
          Han jugado juntos {synergy.matchesTogether} veces y ganaron el {formatPercent(synergy.winRate)} de
          esos partidos.
        </p>
      ) : (
        <p className="mt-1 text-slate-500">
          Aún no han jugado juntos al menos 2 partidos, así que no hay datos de sinergia suficientes.
        </p>
      )}
    </div>
  )
}
