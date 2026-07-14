import type { Analysis } from '../types'
import { ConvictionBadge } from './ConvictionBadge'
import { formatPctFrac, formatUsd } from '../lib/format'

/** Tarjeta compacta de una alternativa de compra. */
export function AltPickCard({ pick }: { pick: Analysis }) {
  return (
    <div className="ap-card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[19px] font-semibold tracking-[-0.02em]">{pick.ticker}</div>
          <div className="text-[13px] text-[color:var(--ap-ink-3)]">{pick.name}</div>
        </div>
        <ConvictionBadge conviction={pick.conviction} size="sm" />
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[12px] uppercase tracking-[0.03em] text-[color:var(--ap-ink-3)]">
            Margen de seguridad
          </div>
          <div className="text-[22px] font-semibold tabular-nums" style={{ color: 'var(--win)' }}>
            {formatPctFrac(pick.valuation.marginOfSafety)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-semibold tabular-nums">{formatUsd(pick.price)}</div>
          <div className="text-[12px] text-[color:var(--ap-ink-3)] tabular-nums">
            VI {formatUsd(pick.valuation.intrinsicValue)}
          </div>
        </div>
      </div>

      <div
        className="mt-3 flex justify-between border-t pt-2 text-[12px] text-[color:var(--ap-ink-3)] tabular-nums"
        style={{ borderColor: 'var(--ap-hairline-soft)' }}
      >
        <span>Cal {pick.scores.quality.toFixed(0)}</span>
        <span>Val {pick.scores.valuation.toFixed(0)}</span>
        <span>Tim {pick.scores.timing.toFixed(0)}</span>
        <span>−{formatPctFrac(pick.timing.drawdownFrom52wHigh)} máx.</span>
      </div>
    </div>
  )
}
