import type { Conviction } from '../types'
import { convictionColor } from '../lib/format'

interface Props {
  conviction: Conviction
  size?: 'sm' | 'md'
}

/** Píldora de nivel de convicción (Alta / Media / Baja). */
export function ConvictionBadge({ conviction, size = 'md' }: Props) {
  const c = convictionColor(conviction)
  const pad = size === 'sm' ? '2px 9px' : '4px 12px'
  const font = size === 'sm' ? 12 : 13
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-semibold"
      style={{
        backgroundColor: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        padding: pad,
        fontSize: font,
        letterSpacing: '-0.01em',
      }}
    >
      Convicción {conviction}
    </span>
  )
}
