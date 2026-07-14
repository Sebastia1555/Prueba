interface Props {
  label: string
  value: string
  hint?: string
  color?: string
}

/** Celda de métrica: etiqueta pequeña + valor destacado. */
export function Metric({ label, value, hint, color }: Props) {
  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.03em] text-[color:var(--ap-ink-3)]">
        {label}
      </div>
      <div
        className="mt-0.5 text-[19px] font-semibold tabular-nums tracking-[-0.02em]"
        style={{ color: color ?? 'var(--ap-ink)' }}
      >
        {value}
      </div>
      {hint && <div className="text-[12px] text-[color:var(--ap-ink-3)]">{hint}</div>}
    </div>
  )
}
