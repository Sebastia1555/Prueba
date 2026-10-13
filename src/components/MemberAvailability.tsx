import type { ReactNode } from 'react'
import type { Member } from '../types'
import { useData } from '../context/DataContext'
import { conflictLabel, memberConflicts, type Conflict, type ConflictIgnore } from '../lib/shifts'
import { msToISODate, msToTime, formatDayShort } from '../lib/dates'
import { Avatar } from './ui'
import { Icon } from './Icon'

interface Props {
  members: Member[]
  start: number
  end: number
  ignore?: ConflictIgnore
  selectedId: string | null
  onSelect: (id: string) => void
  /** Información extra por persona (p. ej. horas del mes). */
  extra?: (m: Member) => ReactNode
}

/** Lista de personas con su disponibilidad para un intervalo concreto. */
export function MemberAvailability({ members, start, end, ignore, selectedId, onSelect, extra }: Props) {
  const { data, me } = useData()
  const sameDay = msToISODate(start)

  return (
    <ul className="divide-y overflow-hidden rounded-[14px] border" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
      {members.map((m) => {
        const conflicts = memberConflicts(data, m.id, start, end, ignore)
        const hard = conflicts.filter((c) => !c.tentative)
        const soft = conflicts.filter((c) => c.tentative)
        const selected = selectedId === m.id
        const when = (c: Conflict) =>
          `${msToISODate(c.start) !== sameDay ? `${formatDayShort(msToISODate(c.start))} ` : ''}${
            c.end - c.start >= 23 * 3600_000 ? 'todo el día' : `${msToTime(c.start)}–${msToTime(c.end)}`
          }`
        return (
          <li key={m.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
            <button
              type="button"
              onClick={() => onSelect(m.id)}
              aria-pressed={selected}
              className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors"
              style={{ backgroundColor: selected ? '#e8f1fb' : 'var(--ap-white)' }}
            >
              <Avatar member={m} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="text-[16px] font-semibold">{m.name}</span>
                  {m.id === me?.id && <span className="text-[13px] text-[color:var(--ap-ink-3)]">(tú)</span>}
                  {extra && <span className="text-[13px] text-[color:var(--ap-ink-3)]">{extra(m)}</span>}
                </div>
                {hard.length === 0 && (
                  <span className="text-[14px]" style={{ color: 'var(--win)' }}>
                    Disponible
                  </span>
                )}
                {conflicts.length > 0 && (
                  <ul className="mt-0.5 space-y-0.5">
                    {hard.slice(0, 3).map((c, i) => (
                      <li key={`h${i}`} className="flex items-start gap-1 text-[14px]" style={{ color: 'var(--warn)' }}>
                        <Icon name="alert" size={14} className="mt-[3px] shrink-0" />
                        <span>
                          {conflictLabel(c, me?.id)} · {when(c)}
                        </span>
                      </li>
                    ))}
                    {soft.slice(0, 2).map((c, i) => (
                      <li key={`s${i}`} className="text-[13px] text-[color:var(--ap-ink-3)]">
                        Quizá: {conflictLabel(c, me?.id)} · {when(c)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selected && <Icon name="check" size={20} className="mt-1 shrink-0 text-[color:var(--ap-blue)]" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
