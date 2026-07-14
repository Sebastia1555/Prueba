interface Props {
  label: string
  value: number // 0-100
  weightLabel?: string
  emphasis?: boolean
}

/** Barra de puntuación 0-100, sobria y alineada con el acento azul. */
export function ScoreMeter({ label, value, weightLabel, emphasis }: Props) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-[color:var(--ap-ink-2)]">
          {label}
          {weightLabel && (
            <span className="ml-1 text-[color:var(--ap-ink-3)]">{weightLabel}</span>
          )}
        </span>
        <span
          className="text-[13px] font-semibold tabular-nums"
          style={{ color: emphasis ? 'var(--ap-blue)' : 'var(--ap-ink)' }}
        >
          {v.toFixed(0)}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--ap-hairline-soft)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${v}%`,
            backgroundColor: emphasis ? 'var(--ap-blue)' : 'rgba(0,102,204,0.55)',
          }}
        />
      </div>
    </div>
  )
}
