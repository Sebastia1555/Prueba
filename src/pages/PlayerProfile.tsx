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
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-[28px] font-semibold" style={{ color: 'var(--ap-ink)' }}>Jugador no encontrado</h1>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 text-[15px] font-medium hover:opacity-70"
          style={{ color: 'var(--ap-blue)' }}
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-[14px] font-medium hover:opacity-70" style={{ color: 'var(--ap-blue)' }}>
        ← Ranking
      </Link>

      <div className="ap-card mt-4 p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[34px] font-semibold tracking-[-0.03em]" style={{ color: 'var(--ap-ink)' }}>{player.name}</h1>
          <RenamePlayerButton playerId={player.id} currentName={player.name} />
          <LevelBadge level={eloToLevel(player.elo)} />
          {provisional && <ProvisionalBadge />}
        </div>
        <p className="mt-1.5 text-[15px]" style={{ color: 'var(--ap-ink-3)' }}>ELO actual: {Math.round(player.elo)}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Partidos" value={player.matchesPlayed} />
          <Stat label="Victorias" value={player.wins} />
          <Stat label="Derrotas" value={player.losses} />
          <Stat label="% Victorias" value={formatPercent(winRate(player.wins, player.matchesPlayed))} />
        </div>
      </div>

      <div className="ap-card mt-4 p-6">
        <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-ink-3)' }}>
          Evolución del ELO
        </h2>
        {player.eloHistory.length === 0 ? (
          <p className="text-[15px]" style={{ color: 'var(--ap-ink-3)' }}>Este jugador todavía no tiene partidos registrados.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#86868b' }} stroke="#d2d2d7" />
                <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 11, fill: '#86868b' }} stroke="#d2d2d7" />
                <Tooltip
                  formatter={(value) => [Math.round(Number(value)), 'ELO']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date || 'Inicio'}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e8e8ed', fontSize: 13 }}
                />
                <Line type="monotone" dataKey="elo" stroke="#0066cc" strokeWidth={2.5} dot={{ r: 3, fill: '#0066cc' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="ap-card p-6">
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-ink-3)' }}>
            Mejor compañero
          </h2>
          {best ? (
            <p className="text-[15px]" style={{ color: 'var(--ap-ink-2)' }}>
              <span className="font-semibold" style={{ color: 'var(--ap-ink)' }}>{name(best.partnerId)}</span> — {formatPercent(best.winRate)} de
              victorias en {best.matchesTogether} partidos juntos
            </p>
          ) : (
            <p className="text-[15px]" style={{ color: 'var(--ap-ink-3)' }}>
              Aún no hay un compañero con el que haya jugado al menos 2 partidos.
            </p>
          )}
        </div>
        <div className="ap-card p-6">
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-ink-3)' }}>
            Peor compañero
          </h2>
          {worst ? (
            <p className="text-[15px]" style={{ color: 'var(--ap-ink-2)' }}>
              <span className="font-semibold" style={{ color: 'var(--ap-ink)' }}>{name(worst.partnerId)}</span> — {formatPercent(worst.winRate)} de
              victorias en {worst.matchesTogether} partidos juntos
            </p>
          ) : (
            <p className="text-[15px]" style={{ color: 'var(--ap-ink-3)' }}>
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
    <div className="rounded-[14px] px-3 py-4 text-center" style={{ backgroundColor: 'var(--ap-parchment)' }}>
      <p className="text-[22px] font-semibold tabular-nums" style={{ color: 'var(--ap-ink)' }}>{value}</p>
      <p className="mt-0.5 text-[12px]" style={{ color: 'var(--ap-ink-3)' }}>{label}</p>
    </div>
  )
}
