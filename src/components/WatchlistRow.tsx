import type { Analysis } from '../types'
import { formatPctFrac, formatUsd } from '../lib/format'

/**
 * Fila de la watchlist: negocio excelente que aún NO está barato
 * (la "lista de la compra" de Buffett, esperando a que caiga).
 */
export function WatchlistRow({ pick }: { pick: Analysis }) {
  const mos = pick.valuation.marginOfSafety // negativo = cotiza por encima del VI
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3"
      style={{ borderBottom: '1px solid var(--ap-hairline-soft)' }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-semibold">{pick.ticker}</span>
          <span className="truncate text-[13px] text-[color:var(--ap-ink-3)]">{pick.name}</span>
        </div>
        <div className="text-[12px] text-[color:var(--ap-ink-3)]">
          Calidad {pick.scores.quality.toFixed(0)}/100 · {pick.sector}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[15px] font-semibold tabular-nums">{formatUsd(pick.price)}</div>
        <div className="text-[12px] tabular-nums" style={{ color: 'var(--loss)' }}>
          {mos < 0 ? `${formatPctFrac(-mos)} caro` : `${formatPctFrac(mos)} margen`}
        </div>
      </div>
    </div>
  )
}
