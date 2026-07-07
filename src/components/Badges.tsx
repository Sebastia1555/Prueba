export function LevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
      Nivel {level}
    </span>
  )
}

export function ProvisionalBadge() {
  return (
    <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
      Provisional
    </span>
  )
}

export function FormBadges({ form }: { form: ('W' | 'L')[] }) {
  if (form.length === 0) {
    return <span className="text-xs text-slate-400">Sin datos</span>
  }
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
            r === 'W' ? 'bg-emerald-500' : 'bg-rose-400'
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  )
}
