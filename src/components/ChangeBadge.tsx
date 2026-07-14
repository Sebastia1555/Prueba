import { formatPct } from '../lib/format'

interface Props {
  changePct: number
  size?: 'sm' | 'md' | 'lg'
}

/** Píldora de color con la variación porcentual (verde/rojo/neutro). */
export function ChangeBadge({ changePct, size = 'md' }: Props) {
  const up = changePct > 0
  const down = changePct < 0
  const bg = up ? 'var(--win-bg)' : down ? 'var(--loss-bg)' : 'var(--ap-hairline-soft)'
  const color = up ? 'var(--win)' : down ? 'var(--loss)' : 'var(--ap-ink-2)'
  const border = up ? 'var(--win-border)' : down ? 'var(--loss-border)' : 'var(--ap-hairline)'
  const pad = size === 'lg' ? '4px 12px' : size === 'sm' ? '1px 7px' : '3px 10px'
  const font = size === 'lg' ? 17 : size === 'sm' ? 12 : 14

  return (
    <span
      className="inline-flex items-center rounded-full font-semibold tabular-nums"
      style={{
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        padding: pad,
        fontSize: font,
        letterSpacing: '-0.01em',
      }}
    >
      {up ? '▲' : down ? '▼' : '•'}&nbsp;{formatPct(changePct)}
    </span>
  )
}
