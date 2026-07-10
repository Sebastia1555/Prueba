import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { eloToLevel, isProvisional } from '../lib/elo'
import { recentForm } from '../lib/elo'
import { formatPercent, winRate } from '../lib/format'
import { InfoPopover } from '../components/InfoPopover'
import { FormBadges, LevelBadge, ProvisionalBadge } from '../components/Badges'
import { RenamePlayerButton } from '../components/RenamePlayerButton'

export function Ranking() {
  const { players, matches } = useData()
  const navigate = useNavigate()

  const ranked = [...players].sort((a, b) => b.elo - a.elo)

  if (players.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-[28px] font-semibold" style={{ color: 'var(--ap-ink)' }}>Todavía no hay jugadores</h1>
        <p className="mt-3 text-[17px]" style={{ color: 'var(--ap-ink-2)' }}>
          Registra un partido para empezar a construir el ranking, o carga los datos de ejemplo desde Ajustes.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-[34px] font-semibold tracking-[-0.03em]" style={{ color: 'var(--ap-ink)' }}>Ranking</h1>

      <div className="ap-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[15px]">
          <thead>
            <tr className="border-b text-[12px] uppercase tracking-[0.04em]" style={{ borderColor: 'var(--ap-hairline-soft)', color: 'var(--ap-ink-3)' }}>
              <th className="px-4 py-3.5 font-semibold">#</th>
              <th className="px-4 py-3.5 font-semibold">Jugador</th>
              <th className="px-4 py-3.5 font-semibold">
                <span className="inline-flex items-center">
                  ELO
                  <InfoPopover
                    label="ELO"
                    text="Puntuación que mide el nivel del jugador. Sube al ganar y baja al perder, más rápido cuanto mayor sea la diferencia de nivel con el rival."
                  />
                </span>
              </th>
              <th className="px-4 py-3.5 font-semibold">
                <span className="inline-flex items-center">
                  Nivel
                  <InfoPopover
                    label="Nivel"
                    text="Traducción del ELO a una escala más sencilla del 1 (inicial) al 7 (avanzado)."
                  />
                </span>
              </th>
              <th className="px-4 py-3.5 font-semibold">Partidos</th>
              <th className="px-4 py-3.5 font-semibold">
                <span className="inline-flex items-center">
                  % Victorias
                  <InfoPopover
                    label="% de victorias"
                    text="Porcentaje de partidos ganados sobre el total de partidos jugados."
                  />
                </span>
              </th>
              <th className="px-4 py-3.5 font-semibold">
                <span className="inline-flex items-center">
                  Forma
                  <InfoPopover
                    label="Forma"
                    text="Resultado (Victoria/Derrota) de los últimos 5 partidos, del más antiguo (izquierda) al más reciente (derecha)."
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((player, index) => {
              const provisional = isProvisional(player.matchesPlayed)
              return (
                <tr
                  key={player.id}
                  onClick={() => navigate(`/jugador/${player.id}`)}
                  className="cursor-pointer border-b last:border-0 transition-colors hover:bg-black/[0.02]"
                  style={{ borderColor: 'var(--ap-hairline-soft)' }}
                >
                  <td className="px-4 py-3.5 font-semibold tabular-nums" style={{ color: 'var(--ap-ink-3)' }}>{index + 1}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center">
                      <Link to={`/jugador/${player.id}`} className="font-medium hover:opacity-70" style={{ color: 'var(--ap-ink)' }}>
                        {player.name}
                      </Link>
                      <RenamePlayerButton playerId={player.id} currentName={player.name} />
                    </span>
                    {provisional && (
                      <span className="ml-2">
                        <ProvisionalBadge />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums font-semibold" style={{ color: 'var(--ap-ink)' }}>{Math.round(player.elo)}</td>
                  <td className="px-4 py-3.5">
                    <LevelBadge level={eloToLevel(player.elo)} />
                  </td>
                  <td className="px-4 py-3.5 tabular-nums" style={{ color: 'var(--ap-ink-2)' }}>{player.matchesPlayed}</td>
                  <td className="px-4 py-3.5 tabular-nums" style={{ color: 'var(--ap-ink-2)' }}>
                    {formatPercent(winRate(player.wins, player.matchesPlayed))}
                  </td>
                  <td className="px-4 py-3.5">
                    <FormBadges form={recentForm(player.id, matches)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
