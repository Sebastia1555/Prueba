import { Link, useNavigate, useParams } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../context/DataContext'
import { eloToLevel, isProvisional, STARTING_ELO } from '../lib/elo'
import { formatDate, formatPercent, winRate } from '../lib/format'
import { bestAndWorstPartner } from '../lib/stats'
import { LevelBadge, ProvisionalBadge } from '../components/Badges'
import { RenamePlayerButton } from '../components/RenamePlayerButton'

export function PlayerProfile() {
  const { id } = useParams<{ id: string }>()
  const { players, matches } = useData()
  const navigate = useNavigate()

  const player = players.find((p) => p.id === id)

  if (!player) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-800">Jugador no encontrado</h1>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Volver al ranking
        </button>
      </div>
    )
  }

  const nameById = new Map(players.map((p) => [p.id, p.name]))
  const name = (pid: string) => nameById.get(pid) ?? '???'

  const provisional = isProvisional(player.matchesPlayed)
  const chartData = [
    { label: 'Inicio', elo: STARTING_ELO, date: '' },
    ...player.eloHistory.map((h, i) => ({
      label: `#${i + 1}`,
      elo: Math.round(h.elo),
      date: formatDate(h.date),
    })),
  ]

  const { best, worst } = bestAndWorstPartner(player.id, matches)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-700">
        ← Ranking
      </Link>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">{player.name}</h1>
          <RenamePlayerButton playerId={player.id} currentName={player.name} />
          <LevelBadge level={eloToLevel(player.elo)} />
          {provisional && <ProvisionalBadge />}
        </div>
        <p className="mt-1 text-sm text-slate-500">ELO actual: {Math.round(player.elo)}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Partidos" value={player.matchesPlayed} />
          <Stat label="Victorias" value={player.wins} />
          <Stat label="Derrotas" value={player.losses} />
          <Stat label="% Victorias" value={formatPercent(winRate(player.wins, player.matchesPlayed))} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Evolución del ELO
        </h2>
        {player.eloHistory.length === 0 ? (
          <p className="text-sm text-slate-500">Este jugador todavía no tiene partidos registrados.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [Math.round(Number(value)), 'ELO']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date || 'Inicio'}
                />
                <Line type="monotone" dataKey="elo" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Mejor compañero
          </h2>
          {best ? (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{name(best.partnerId)}</span> — {formatPercent(best.winRate)} de
              victorias en {best.matchesTogether} partidos juntos
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Aún no hay un compañero con el que haya jugado al menos 2 partidos.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Peor compañero
          </h2>
          {worst ? (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{name(worst.partnerId)}</span> — {formatPercent(worst.winRate)} de
              victorias en {worst.matchesTogether} partidos juntos
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Aún no hay un compañero con el que haya jugado al menos 2 partidos.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-3 text-center">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
