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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-[34px] font-semibold tracking-[-0.03em]" style={{ color: 'var(--ap-ink)' }}>Predicción de partido</h1>

      <div className="ap-card p-5 sm:p-7">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[18px] border p-4" style={{ borderColor: 'var(--ap-hairline)', backgroundColor: 'var(--ap-parchment)' }}>
            <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-blue)' }}>Pareja A</h3>
            <div className="space-y-3">
              <PlayerSelect label="Jugador 1" players={players} value={a1} onChange={wrap(setA1)} excludeIds={selectedIds} />
              <PlayerSelect label="Jugador 2" players={players} value={a2} onChange={wrap(setA2)} excludeIds={selectedIds} />
            </div>
          </div>
          <div className="rounded-[18px] border p-4" style={{ borderColor: 'var(--ap-hairline)', backgroundColor: 'var(--ap-parchment)' }}>
            <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-ink-2)' }}>Pareja B</h3>
            <div className="space-y-3">
              <PlayerSelect label="Jugador 1" players={players} value={b1} onChange={wrap(setB1)} excludeIds={selectedIds} />
              <PlayerSelect label="Jugador 2" players={players} value={b2} onChange={wrap(setB2)} excludeIds={selectedIds} />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-[12px] px-3.5 py-2.5 text-[14px]" style={{ backgroundColor: 'var(--loss-bg)', color: 'var(--loss)' }}>
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-center">
          <button type="button" onClick={handleCalculate} className="ap-btn ap-btn-primary" style={{ padding: '12px 28px' }}>
            Calcular predicción
          </button>
        </div>
      </div>

      {result && (
        <div className="ap-card mt-6 p-5 sm:p-7">
          {result.anyProvisional && (
            <div className="mb-5 flex items-start gap-2.5 rounded-[12px] px-3.5 py-3 text-[14px]" style={{ backgroundColor: 'var(--warn-bg)', color: 'var(--warn)' }}>
              <ProvisionalBadge />
              <span>
                Al menos uno de los 4 jugadores tiene menos de 8 partidos jugados, así que su nivel aún no es
                del todo fiable y la predicción puede no ajustarse a la realidad.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[18px] p-5 text-center" style={{ backgroundColor: 'var(--ap-parchment)' }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--ap-ink-2)' }}>
                {name(a1)} / {name(a2)}
              </p>
              <p className="mt-2 text-[44px] font-semibold tracking-[-0.03em] tabular-nums" style={{ color: 'var(--ap-blue)' }}>{formatPercent(result.finalProbA)}</p>
              <p className="mt-1 text-[13px]" style={{ color: 'var(--ap-ink-3)' }}>de ganar el partido</p>
            </div>
            <div className="rounded-[18px] p-5 text-center" style={{ backgroundColor: 'var(--ap-parchment)' }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--ap-ink-2)' }}>
                {name(b1)} / {name(b2)}
              </p>
              <p className="mt-2 text-[44px] font-semibold tracking-[-0.03em] tabular-nums" style={{ color: 'var(--ap-ink)' }}>{formatPercent(result.finalProbB)}</p>
              <p className="mt-1 text-[13px]" style={{ color: 'var(--ap-ink-3)' }}>de ganar el partido</p>
            </div>
          </div>

          <p className="mt-4 rounded-[12px] px-3.5 py-3 text-[15px]" style={{ backgroundColor: 'var(--ap-parchment)', color: 'var(--ap-ink)' }}>{result.closenessText}</p>

          <div className="mt-4 rounded-[12px] border px-3.5 py-3 text-[14px]" style={{ borderColor: 'var(--ap-hairline-soft)', color: 'var(--ap-ink-2)' }}>
            {result.adjusted ? (
              <p>
                <span className="font-semibold" style={{ color: 'var(--ap-ink)' }}>Ajuste por enfrentamientos directos: </span>
                estas dos parejas exactas ya se han enfrentado {result.h2h.count} veces (
                {result.h2h.winsPairA}-{result.h2h.winsPairB} a favor de {name(a1)}/{name(a2)}), así que la
                probabilidad mostrada mezcla un 70% del ELO combinado con un 30% de ese historial de
                enfrentamientos directos.
              </p>
            ) : (
              <p>
                <span className="font-semibold" style={{ color: 'var(--ap-ink)' }}>Sin ajuste por enfrentamientos directos: </span>
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
    <div className="rounded-[12px] border p-3.5 text-[14px]" style={{ borderColor: 'var(--ap-hairline-soft)', backgroundColor: 'var(--ap-parchment)' }}>
      <p className="font-semibold" style={{ color: 'var(--ap-ink)' }}>Sinergia: {pairLabel}</p>
      {synergy ? (
        <p className="mt-1" style={{ color: 'var(--ap-ink-2)' }}>
          Han jugado juntos {synergy.matchesTogether} veces y ganaron el {formatPercent(synergy.winRate)} de
          esos partidos.
        </p>
      ) : (
        <p className="mt-1" style={{ color: 'var(--ap-ink-3)' }}>
          Aún no han jugado juntos al menos 2 partidos, así que no hay datos de sinergia suficientes.
        </p>
      )}
    </div>
  )
}
