import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts'
import type { Point } from '../types'
import { formatTime, formatUsd } from '../lib/format'

interface Props {
  data: Point[]
  color: string
  prevClose?: number
  height?: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: Point }>
}

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div
      className="rounded-lg px-3 py-2 text-[13px] shadow-md"
      style={{ background: 'var(--ap-white)', border: '1px solid var(--ap-hairline)' }}
    >
      <div className="font-semibold tabular-nums" style={{ color: 'var(--ap-ink)' }}>
        {formatUsd(p.price)}
      </div>
      <div style={{ color: 'var(--ap-ink-3)' }}>{formatTime(p.t)}</div>
    </div>
  )
}

/** Gráfico de área de la evolución del precio (sesión en vivo). */
export function PriceChart({ data, color, prevClose, height = 280 }: Props) {
  const prices = data.map((d) => d.price)
  const min = Math.min(...prices, prevClose ?? Infinity)
  const max = Math.max(...prices, prevClose ?? -Infinity)
  const pad = (max - min) * 0.08 || max * 0.01 || 1

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <YAxis domain={[min - pad, max + pad]} hide />
        <Tooltip content={<ChartTooltip />} isAnimationActive={false} />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill="url(#pc-fill)"
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: 'var(--ap-white)', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
