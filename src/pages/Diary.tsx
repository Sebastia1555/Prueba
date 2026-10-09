import { useMemo, useState, type ReactNode } from 'react'
import type { DiaryEntry, DiaryTag } from '../types'
import { useData } from '../context/DataContext'
import { formatRelativeDay, msToISODate, msToTime } from '../lib/dates'
import { DIARY_TAGS, newId } from '../lib/labels'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Icon } from '../components/Icon'
import { Avatar, Badge, Checkbox, EmptyState, PageHeader } from '../components/ui'

export function Diary() {
  const { data, me, can, upsert } = useData()
  const [text, setText] = useState('')
  const [tags, setTags] = useState<DiaryTag[]>([])
  const [important, setImportant] = useState(false)
  const [filter, setFilter] = useState<DiaryTag | 'important' | ''>('')

  const entries = useMemo(
    () =>
      [...data.diary]
        .filter((e) => !filter || (filter === 'important' ? e.important : e.tags.includes(filter)))
        .sort((a, b) => b.at - a.at),
    [data.diary, filter],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>()
    for (const e of entries) {
      const d = msToISODate(e.at)
      map.set(d, [...(map.get(d) ?? []), e])
    }
    return [...map]
  }, [entries])

  const add = () => {
    if (!me || !text.trim()) return
    upsert('diary', { id: newId(), at: Date.now(), memberId: me.id, text: text.trim(), tags, important })
    setText('')
    setTags([])
    setImportant(false)
  }

  return (
    <div>
      <PageHeader title="Diario" subtitle="Cómo ha ido cada turno: comidas, sueño, ánimo, incidencias" />

      {can('writeDiary') && me && (
        <div className="ap-card mb-6 p-4">
          <textarea
            className="ap-input min-h-[5.5rem]"
            placeholder="¿Cómo ha ido? Lo que debería saber quien venga después…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(Object.keys(DIARY_TAGS) as DiaryTag[]).map((t) => {
              const on = tags.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                  className="rounded-full px-3 py-1 text-[14px] transition-colors"
                  style={
                    on
                      ? { backgroundColor: 'var(--ap-blue)', color: '#fff' }
                      : { backgroundColor: 'var(--ap-parchment)', color: 'var(--ap-ink-2)' }
                  }
                >
                  {DIARY_TAGS[t].emoji} {DIARY_TAGS[t].label}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Checkbox checked={important} onChange={setImportant}>
              Importante (se destacará en el inicio)
            </Checkbox>
            <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={add} disabled={!text.trim()}>
              Publicar
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <FilterChip active={filter === ''} onClick={() => setFilter('')}>
          Todo
        </FilterChip>
        <FilterChip active={filter === 'important'} onClick={() => setFilter('important')}>
          ⭐ Importante
        </FilterChip>
        {(Object.keys(DIARY_TAGS) as DiaryTag[]).map((t) => (
          <FilterChip key={t} active={filter === t} onClick={() => setFilter(t)}>
            {DIARY_TAGS[t].emoji} {DIARY_TAGS[t].label}
          </FilterChip>
        ))}
      </div>

      {byDay.length === 0 ? (
        <EmptyState icon="📓" title="Sin notas todavía">
          Apuntad aquí lo importante de cada día para que todos estéis al tanto.
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {byDay.map(([day, list]) => (
            <section key={day}>
              <h3 className="mb-1.5 px-1 text-[15px] text-[color:var(--ap-ink-2)]">{formatRelativeDay(day)}</h3>
              <ul className="space-y-2">
                {list.map((e) => (
                  <DiaryItem key={e.id} entry={e} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full px-3 py-1 text-[14px]"
      style={
        active
          ? { backgroundColor: 'var(--ap-ink)', color: '#fff' }
          : { backgroundColor: 'var(--ap-white)', color: 'var(--ap-ink-2)', border: '1px solid var(--ap-hairline-soft)' }
      }
    >
      {children}
    </button>
  )
}

export function DiaryItem({ entry: e, compact = false }: { entry: DiaryEntry; compact?: boolean }) {
  const { me, can, memberById, remove } = useData()
  const [confirm, setConfirm] = useState(false)
  const author = memberById(e.memberId)
  const canDelete = !compact && (e.memberId === me?.id || can('manageMembers'))
  return (
    <li
      className="ap-card flex gap-3 p-3.5"
      style={e.important ? { borderColor: 'var(--warn-border)', backgroundColor: '#fffcf5' } : undefined}
    >
      <Avatar member={author} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-[14px]">
          <span className="font-semibold">{author?.name ?? 'Alguien'}</span>
          <span className="text-[color:var(--ap-ink-3)]">
            {compact && `${formatRelativeDay(msToISODate(e.at))}, `}
            {msToTime(e.at)}
          </span>
          {e.important && <Badge tone="amber">Importante</Badge>}
        </div>
        <p className="mt-0.5 whitespace-pre-line text-[15px]">{e.text}</p>
        {e.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {e.tags.map((t) => (
              <span key={t} className="text-[13px] text-[color:var(--ap-ink-2)]">
                {DIARY_TAGS[t].emoji} {DIARY_TAGS[t].label}
              </span>
            ))}
          </div>
        )}
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="self-start rounded-full p-1.5 text-[color:var(--ap-ink-3)] hover:bg-black/5"
          aria-label="Borrar nota"
        >
          <Icon name="trash" size={16} />
        </button>
      )}
      <ConfirmDialog
        open={confirm}
        title="Borrar nota"
        message="¿Seguro que quieres borrar esta nota del diario?"
        confirmLabel="Borrar"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => remove('diary', e.id)}
      />
    </li>
  )
}
