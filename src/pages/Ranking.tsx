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
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-800">Todavía no hay jugadores</h1>
        <p className="mt-2 text-sm text-slate-500">
          Registra un partido para empezar a construir el ranking, o carga los datos de ejemplo desde Ajustes.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Ranking</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Jugador</th>
              <th className="px-4 py-3 font-semibold">
                <span className="inline-flex items-center">
                  ELO
                  <InfoPopover
                    label="ELO"
                    text="Puntuación que mide el nivel del jugador. Sube al ganar y baja al perder, más rápido cuanto mayor sea la diferencia de nivel con el rival."
                  />
                </span>
              </th>
              <th className="px-4 py-3 font-semibold">
                <span className="inline-flex items-center">
                  Nivel
                  <InfoPopover
                    label="Nivel"
                    text="Traducción del ELO a una escala más sencilla del 1 (inicial) al 7 (avanzado)."
                  />
                </span>
              </th>
              <th className="px-4 py-3 font-semibold">Partidos</th>
              <th className="px-4 py-3 font-semibold">
                <span className="inline-flex items-center">
                  % Victorias
                  <InfoPopover
                    label="% de victorias"
                    text="Porcentaje de partidos ganados sobre el total de partidos jugados."
                  />
                </span>
              </th>
              <th className="px-4 py-3 font-semibold">
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
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center">
                      <Link to={`/jugador/${player.id}`} className="font-medium text-slate-900 hover:text-emerald-700">
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
                  <td className="px-4 py-3 font-mono text-slate-700">{Math.round(player.elo)}</td>
                  <td className="px-4 py-3">
                    <LevelBadge level={eloToLevel(player.elo)} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{player.matchesPlayed}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatPercent(winRate(player.wins, player.matchesPlayed))}
                  </td>
                  <td className="px-4 py-3">
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
