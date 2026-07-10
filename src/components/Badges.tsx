export function LevelBadge({ level }: { level: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ backgroundColor: 'var(--ap-parchment)', color: 'var(--ap-ink-2)', border: '1px solid var(--ap-hairline)' }}
    >
      Nivel {level}
    </span>
  )
}

export function ProvisionalBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ backgroundColor: 'var(--warn-bg)', color: 'var(--warn)', border: '1px solid var(--warn-border)' }}
    >
      Provisional
    </span>
  )
}

export function FormBadges({ form }: { form: ('W' | 'L')[] }) {
  if (form.length === 0) {
    return <span className="text-[13px]" style={{ color: 'var(--ap-ink-3)' }}>Sin datos</span>
  }
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: r === 'W' ? 'var(--win)' : 'var(--loss)' }}
        >
          {r}
        </span>
      ))}
    </div>
  )
}
