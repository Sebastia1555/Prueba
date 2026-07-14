import { Link } from 'react-router-dom'
import type { Point, Quote } from '../types'
import { ChangeBadge } from './ChangeBadge'
import { Sparkline } from './Sparkline'
import { formatChange, formatUsd, trendColor } from '../lib/format'

interface Props {
  quote: Quote
  series: Point[]
  onRemove: (symbol: string) => void
}

export function QuoteCard({ quote, series, onRemove }: Props) {
  const color = trendColor(quote.change)

  return (
    <div className="ap-card group relative flex flex-col p-4 transition-shadow hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        aria-label={`Quitar ${quote.symbol}`}
        onClick={() => onRemove(quote.symbol)}
        className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[color:var(--ap-ink-3)] opacity-0 transition-opacity hover:bg-[color:var(--ap-parchment)] hover:text-[color:var(--loss)] group-hover:opacity-100"
      >
        ✕
      </button>

      <Link to={`/accion/${quote.symbol}`} className="flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-2 pr-6">
          <span className="text-[19px] font-semibold tracking-[-0.02em] text-[color:var(--ap-ink)]">
            {quote.symbol}
          </span>
        </div>

        <div className="my-3">
          <Sparkline data={series} color={color} width={220} height={44} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <div className="text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-[color:var(--ap-ink)]">
              {formatUsd(quote.price)}
            </div>
            <div className="mt-0.5 text-[14px] font-medium tabular-nums" style={{ color }}>
              {formatChange(quote.change)}
            </div>
          </div>
          <ChangeBadge changePct={quote.changePct} />
        </div>
      </Link>
    </div>
  )
}
