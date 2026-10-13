import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Member } from '../types'
import { initials } from '../lib/labels'
import { WEEKDAYS } from '../lib/dates'
import { IS_PREVIEW } from '../lib/env'
import { Icon, type IconName } from './Icon'

export function Avatar({ member, size = 32 }: { member: Member | undefined; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: member?.color ?? 'var(--ap-ink-3)',
      }}
      aria-hidden="true"
    >
      {member ? initials(member.name) : '?'}
    </span>
  )
}

/** Nombre con su color, en una píldora. */
export function MemberTag({ member, suffix }: { member: Member | undefined; suffix?: string }) {
  if (!member) return <span className="text-[color:var(--ap-ink-3)]">—</span>
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-[14px] font-medium"
      style={{ backgroundColor: `${member.color}14`, color: member.color }}
    >
      <Avatar member={member} size={20} />
      <span className="truncate">
        {member.name}
        {suffix}
      </span>
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-[color:var(--ap-ink-2)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  )
}

export function Section({
  title,
  action,
  children,
  className = '',
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`mb-6 ${className}`}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          {title && <h2 className="text-[19px]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="ap-card px-6 py-10 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-3 text-[17px] font-semibold">{title}</p>
      {children && <div className="mt-1 text-[15px] text-[color:var(--ap-ink-2)]">{children}</div>}
    </div>
  )
}

export type Tone = 'neutral' | 'blue' | 'green' | 'amber' | 'red'

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#f0f0f3', fg: 'var(--ap-ink-2)' },
  blue: { bg: '#e8f1fb', fg: 'var(--ap-blue)' },
  green: { bg: 'var(--win-bg)', fg: 'var(--win)' },
  amber: { bg: 'var(--warn-bg)', fg: 'var(--warn)' },
  red: { bg: 'var(--loss-bg)', fg: 'var(--loss)' },
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const t = TONES[tone]
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-medium"
      style={{ backgroundColor: t.bg, color: t.fg }}
    >
      {children}
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-full p-1" style={{ backgroundColor: '#e8e8ed' }} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-[14px] transition-colors ${
            value === o.value ? 'bg-white font-semibold shadow-sm' : 'text-[color:var(--ap-ink-2)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex gap-1.5">
      {WEEKDAYS.map((w) => {
        const on = value.includes(w.n)
        return (
          <button
            key={w.n}
            type="button"
            aria-pressed={on}
            aria-label={w.label}
            onClick={() => onChange(on ? value.filter((x) => x !== w.n) : [...value, w.n].sort())}
            className="h-9 w-9 rounded-full text-[14px] font-semibold transition-colors"
            style={
              on
                ? { backgroundColor: 'var(--ap-blue)', color: '#fff' }
                : { backgroundColor: 'var(--ap-white)', color: 'var(--ap-ink-2)', border: '1px solid var(--ap-hairline)' }
            }
          >
            {w.short}
          </button>
        )
      })}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="ap-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] text-[color:var(--ap-ink-3)]">{hint}</span>}
    </label>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-1 text-[15px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[color:var(--ap-blue)]"
      />
      <span>{children}</span>
    </label>
  )
}

export function Notice({ tone = 'blue', icon = 'alert', children }: { tone?: Tone; icon?: IconName; children: ReactNode }) {
  const t = TONES[tone]
  return (
    <div className="flex gap-2.5 rounded-[14px] px-4 py-3 text-[14px] leading-snug" style={{ backgroundColor: t.bg, color: t.fg }}>
      <Icon name={icon} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Fila de lista con enlace o acción. */
export function ListRow({
  to,
  onClick,
  children,
  chevron = true,
}: {
  to?: string
  onClick?: () => void
  children: ReactNode
  chevron?: boolean
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">{children}</div>
      {chevron && <Icon name="chevronRight" size={18} className="shrink-0 text-[color:var(--ap-ink-3)]" />}
    </>
  )
  const cls =
    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]'
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    )
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

/** Campo numérico que admite coma decimal y deja borrar mientras se escribe. */
export function NumberInput({
  value,
  onChange,
  min = 0,
  integer = false,
  className = '',
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  integer?: boolean
  className?: string
  ariaLabel?: string
}) {
  const fmt = (n: number) => String(n).replace('.', ',')
  const [text, setText] = useState(fmt(value))
  return (
    <input
      inputMode={integer ? 'numeric' : 'decimal'}
      className={`ap-input ${className}`}
      value={text}
      aria-label={ariaLabel}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value.replace(',', '.'))
        if (e.target.value.trim() !== '' && Number.isFinite(n) && n >= min) onChange(integer ? Math.round(n) : n)
      }}
      onBlur={() => setText(fmt(value))}
    />
  )
}

/**
 * Teléfono que se puede pulsar para llamar. En la vista previa los enlaces
 * tel: no funcionan, así que se muestra como texto seleccionable.
 */
export function PhoneLink({ phone, className = '', children }: { phone: string; className?: string; children?: ReactNode }) {
  if (IS_PREVIEW) {
    return <span className="inline-flex select-all items-center gap-1.5 text-[15px] font-medium">{children ?? phone}</span>
  }
  return (
    <a href={`tel:${phone.replace(/\s/g, '')}`} className={className}>
      {children ?? phone}
    </a>
  )
}
