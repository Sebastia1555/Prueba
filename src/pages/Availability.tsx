import { useMemo, useRef, useState } from 'react'
import type { BusyBlock, CalendarSource } from '../types'
import { useData } from '../context/DataContext'
import {
  addDays,
  dateTimeMs,
  formatDate,
  formatDayMedium,
  formatDayShort,
  msToISODate,
  msToTime,
  todayISO,
  WEEKDAYS,
} from '../lib/dates'
import { buildIcs, careEvents, fetchIcs, parseIcs } from '../lib/ics'
import { IS_PREVIEW } from '../lib/env'
import { downloadBlob, newId } from '../lib/labels'
import { conflictLabel, memberConflicts } from '../lib/shifts'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { Icon } from '../components/Icon'
import { Avatar, Checkbox, EmptyState, Field, Notice, PageHeader, Section, Segmented, WeekdayPicker } from '../components/ui'

export function Availability() {
  const { data, me, can } = useData()
  const [memberId, setMemberId] = useState(me?.id ?? '')
  const member = data.members.find((m) => m.id === memberId) ?? me
  const [editingBlock, setEditingBlock] = useState<BusyBlock | 'new' | null>(null)
  const isMe = member?.id === me?.id

  if (!member) return null

  const blocks = data.busyBlocks.filter((b) => b.memberId === member.id)
  const calendars = data.calendars.filter((c) => c.memberId === member.id)

  return (
    <div>
      <PageHeader
        title={isMe ? 'Mi disponibilidad' : `Disponibilidad de ${member.name}`}
        subtitle="Tu vida también cuenta: indica cuándo no puedes para que nadie te asigne un turno que te pise otro compromiso"
      />

      {can('manageMembers') && data.members.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {data.members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMemberId(m.id)}
              className={`ap-btn ap-btn-sm ${m.id === member.id ? 'ap-btn-primary' : 'ap-btn-neutral'}`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      <Section
        title="Compromisos fijos y ausencias"
        action={
          <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost" onClick={() => setEditingBlock('new')}>
            <Icon name="plus" size={16} /> Añadir
          </button>
        }
      >
        {blocks.length === 0 ? (
          <EmptyState icon="🗓️" title="Nada todavía">
            Ej.: «Tenis de los niños, martes de 17:00 a 19:00» o «Vacaciones del 1 al 15 de agosto».
          </EmptyState>
        ) : (
          <ul className="ap-card divide-y overflow-hidden">
            {blocks.map((b) => (
              <li key={b.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                <button type="button" onClick={() => setEditingBlock(b)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[16px] font-medium">
                      {b.title || 'Ocupado'}
                      {b.private && <Icon name="lock" size={14} className="text-[color:var(--ap-ink-3)]" />}
                    </div>
                    <div className="text-[14px] text-[color:var(--ap-ink-2)]">{describeBlock(b)}</div>
                  </div>
                  <Icon name="edit" size={18} className="text-[color:var(--ap-ink-3)]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CalendarsSection memberId={member.id} calendars={calendars} />

      <UpcomingBusy memberId={member.id} />

      <ExportSection memberId={member.id} memberName={member.name} />

      {editingBlock && (
        <BusyBlockForm
          memberId={member.id}
          block={editingBlock === 'new' ? undefined : editingBlock}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  )
}

function describeBlock(b: BusyBlock): string {
  const hours = b.allDay ? 'todo el día' : `${b.startTime}–${b.endTime}`
  if (b.repeat === 'weekly') {
    const days =
      b.weekdays.length === 7
        ? 'Todos los días'
        : b.weekdays.length === 5 && !b.weekdays.includes(6) && !b.weekdays.includes(7)
          ? 'De lunes a viernes'
          : `Cada ${WEEKDAYS.filter((w) => b.weekdays.includes(w.n))
              .map((w) => w.label.toLowerCase())
              .join(', ')}`
    return `${days} · ${hours}${b.endDate ? ` · hasta el ${formatDate(b.endDate)}` : ''}`
  }
  if (b.endDate && b.endDate !== b.startDate) return `Del ${formatDayShort(b.startDate)} al ${formatDayShort(b.endDate)} · ${hours}`
  return `${formatDayMedium(b.startDate)} · ${hours}`
}

function BusyBlockForm({ memberId, block, onClose }: { memberId: string; block?: BusyBlock; onClose: () => void }) {
  const { upsert, remove } = useData()
  const [b, setB] = useState<BusyBlock>(
    () =>
      block ?? {
        id: newId(),
        memberId,
        title: '',
        repeat: 'weekly',
        weekdays: [],
        startDate: todayISO(),
        endDate: '',
        allDay: false,
        startTime: '17:00',
        endTime: '19:00',
        private: true,
      },
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof BusyBlock>(key: K, value: BusyBlock[K]) => setB((prev) => ({ ...prev, [key]: value }))
  const valid =
    (b.repeat === 'none' || b.weekdays.length > 0) &&
    b.startDate &&
    (b.allDay || (b.startTime && b.endTime)) &&
    (!b.endDate || b.endDate >= b.startDate)

  return (
    <Modal open onClose={onClose} title={block ? 'Editar compromiso' : 'Nuevo compromiso'}>
      <div className="space-y-4">
        <Field label="¿Qué es?">
          <input className="ap-input" value={b.title} onChange={(e) => set('title', e.target.value)} placeholder="Trabajo, tenis de los niños, vacaciones…" autoFocus={!block} />
        </Field>
        <Segmented
          value={b.repeat}
          onChange={(v) => set('repeat', v)}
          options={[
            { value: 'weekly', label: 'Cada semana' },
            { value: 'none', label: 'Fechas concretas' },
          ]}
        />
        {b.repeat === 'weekly' ? (
          <>
            <WeekdayPicker value={b.weekdays} onChange={(v) => set('weekdays', v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desde">
                <input type="date" className="ap-input" value={b.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </Field>
              <Field label="Hasta" hint="Vacío = sin fecha de fin">
                <input type="date" className="ap-input" value={b.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </Field>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde el día">
              <input type="date" className="ap-input" value={b.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </Field>
            <Field label="Hasta el día" hint="Vacío = un solo día">
              <input type="date" className="ap-input" value={b.endDate} min={b.startDate} onChange={(e) => set('endDate', e.target.value)} />
            </Field>
          </div>
        )}
        <Checkbox checked={b.allDay} onChange={(v) => set('allDay', v)}>
          Todo el día
        </Checkbox>
        {!b.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="De">
              <input type="time" className="ap-input" value={b.startTime} onChange={(e) => set('startTime', e.target.value)} />
            </Field>
            <Field label="A" hint={b.endTime && b.endTime <= b.startTime ? 'Termina al día siguiente' : undefined}>
              <input type="time" className="ap-input" value={b.endTime} onChange={(e) => set('endTime', e.target.value)} />
            </Field>
          </div>
        )}
        <Checkbox checked={b.private} onChange={(v) => set('private', v)}>
          Privado: los demás solo verán «Ocupado»
        </Checkbox>
      </div>
      <div className="mt-6 flex items-center justify-between gap-2">
        {block ? (
          <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={() => setConfirmDelete(true)}>
            Eliminar
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ap-btn ap-btn-sm ap-btn-primary"
            disabled={!valid}
            onClick={() => {
              upsert('busyBlocks', { ...b, title: b.title.trim() })
              onClose()
            }}
          >
            Guardar
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar compromiso"
        message="¿Seguro?"
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (block) remove('busyBlocks', block.id)
          onClose()
        }}
      />
    </Modal>
  )
}

function CalendarsSection({ memberId, calendars }: { memberId: string; calendars: CalendarSource[] }) {
  const { upsert, remove } = useData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<CalendarSource | null>(null)
  const [help, setHelp] = useState(false)

  const store = (name: string, text: string, sourceUrl: string, existing?: CalendarSource) => {
    let events: CalendarSource['events']
    try {
      events = parseIcs(text)
    } catch {
      throw new Error('No se ha podido leer el calendario: el archivo parece dañado o incompleto.')
    }
    upsert('calendars', {
      id: existing?.id ?? newId(),
      memberId,
      name: existing?.name ?? name,
      url: sourceUrl,
      importedAt: Date.now(),
      private: existing?.private ?? true,
      events,
    })
    const n = events.length
    setInfo(
      existing
        ? `Calendario actualizado: ${n} ${n === 1 ? 'evento' : 'eventos'} entre la semana pasada y el próximo año.`
        : `${n} ${n === 1 ? 'evento importado' : 'eventos importados'} entre la semana pasada y el próximo año.`,
    )
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido importar el calendario.')
    } finally {
      setBusy(false)
    }
  }

  const importFile = (file: File) =>
    run(async () => {
      const text = await file.text()
      if (!text.includes('BEGIN:VCALENDAR')) throw new Error('El archivo no es un calendario .ics.')
      const name = file.name.replace(/\.ics$/i, '')
      // Volver a importar el mismo archivo lo actualiza en vez de duplicarlo.
      const previous = calendars.find((c) => !c.url && c.name === name)
      store(name, text, '', previous)
    })

  const importUrl = () =>
    run(async () => {
      const text = await fetchIcs(url)
      store('Calendario enlazado', text, url.trim())
      setUrl('')
    })

  const refresh = (cal: CalendarSource) =>
    run(async () => {
      store(cal.name, await fetchIcs(cal.url), cal.url, cal)
    })

  return (
    <Section title="Calendarios personales">
      <div className="ap-card p-4">
        <p className="text-[15px] text-[color:var(--ap-ink-2)]">
          Importa tu calendario de Google, Apple u Outlook para que la agenda sepa cuándo estás ocupado. Por defecto
          es privado: el resto solo verá «Ocupado», nunca el título.
        </p>

        {calendars.length > 0 && (
          <ul className="mt-3 divide-y rounded-[12px] border" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
            {calendars.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                <Icon name="calendar" size={18} className="text-[color:var(--ap-ink-3)]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium">{c.name}</div>
                  <div className="text-[13px] text-[color:var(--ap-ink-3)]">
                    {c.events.length} eventos · actualizado el {formatDate(msToISODate(c.importedAt))}
                    {c.url ? ' · enlazado' : ' · desde archivo'}
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-[13px] text-[color:var(--ap-ink-2)]">
                  <input
                    type="checkbox"
                    className="accent-[color:var(--ap-blue)]"
                    checked={c.private}
                    onChange={(e) => upsert('calendars', { ...c, private: e.target.checked })}
                  />
                  Privado
                </label>
                {c.url && (
                  <button type="button" className="rounded-full p-2 text-[color:var(--ap-ink-2)] hover:bg-black/5" onClick={() => refresh(c)} disabled={busy} aria-label="Actualizar">
                    <Icon name="refresh" size={16} />
                  </button>
                )}
                <button type="button" className="rounded-full p-2 text-[color:var(--ap-ink-3)] hover:bg-black/5" onClick={() => setDeleting(c)} aria-label="Quitar calendario">
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Icon name="upload" size={16} /> Importar archivo .ics
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".ics,text/calendar"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ''
            }}
          />
        </div>
        {!IS_PREVIEW && (
        <div className="mt-3 flex gap-2">
          <input
            className="ap-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="o pega un enlace webcal:// o https://…ics"
          />
          <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral shrink-0" onClick={importUrl} disabled={busy || !url.trim()}>
            <Icon name="link" size={16} /> Enlazar
          </button>
        </div>
        )}

        {busy && <p className="mt-3 text-[14px] text-[color:var(--ap-ink-3)]">Importando…</p>}
        {error && (
          <div className="mt-3">
            <Notice tone="red">{error}</Notice>
          </div>
        )}
        {info && (
          <div className="mt-3">
            <Notice tone="green" icon="check">
              {info}
            </Notice>
          </div>
        )}

        <button type="button" className="ap-link mt-3 text-[14px]" onClick={() => setHelp(!help)}>
          {help ? 'Ocultar ayuda' : IS_PREVIEW ? '¿Cómo consigo el archivo de mi calendario?' : '¿Cómo consigo el archivo o el enlace de mi calendario?'}
        </button>
        {help && IS_PREVIEW && (
          <div className="mt-2 space-y-2 text-[14px] text-[color:var(--ap-ink-2)]">
            <p>
              <strong>Google Calendar</strong> (desde el ordenador): Configuración → Importar y exportar → Exportar. Se
              descarga un .zip con un .ics por calendario; sube el tuyo.
            </p>
            <p>
              <strong>Apple Calendar</strong> (Mac): selecciona el calendario → Archivo → Exportar → Exportar…
            </p>
            <p>
              <strong>Outlook</strong>: Configuración → Calendario → Calendarios compartidos → Publicar un calendario →
              descarga el enlace ICS.
            </p>
            <p>En la app instalada también se podrá enlazar el calendario para que se actualice solo.</p>
          </div>
        )}
        {help && !IS_PREVIEW && (
          <div className="mt-2 space-y-2 text-[14px] text-[color:var(--ap-ink-2)]">
            <p>
              <strong>Google Calendar</strong> (desde el ordenador): Configuración → elige tu calendario → «Integrar el
              calendario» → copia la «Dirección secreta en formato iCal». O bien Configuración → Importar y exportar →
              Exportar, y sube el .ics.
            </p>
            <p>
              <strong>Apple / iCloud</strong>: en la app Calendario, mantén pulsado el calendario → Compartir → «Calendario
              público» y copia el enlace (webcal://).
            </p>
            <p>
              <strong>Outlook</strong>: Configuración → Calendario → Calendarios compartidos → Publicar un calendario →
              copia el enlace ICS.
            </p>
            <p>
              Algunos proveedores no dejan leer el enlace directamente desde una página web; en ese caso, descarga el .ics
              e impórtalo como archivo. Con el archivo hay que volver a importarlo de vez en cuando para tenerlo al día.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Quitar calendario"
        message={`Se quitará «${deleting?.name ?? ''}» y sus eventos dejarán de contar como ocupado.`}
        confirmLabel="Quitar"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove('calendars', deleting.id)
          setDeleting(null)
        }}
      />
    </Section>
  )
}

function UpcomingBusy({ memberId }: { memberId: string }) {
  const { data, me } = useData()
  const today = todayISO()
  const items = useMemo(
    () =>
      memberConflicts(data, memberId, dateTimeMs(today, '00:00'), dateTimeMs(addDays(today, 14), '00:00')).filter(
        (c) => c.kind === 'busy' || c.kind === 'calendar',
      ),
    [data, memberId, today],
  )
  const member = data.members.find((m) => m.id === memberId)

  return (
    <Section title="Así te ven los demás (próximos 14 días)">
      {items.length === 0 ? (
        <p className="ap-card p-4 text-[15px] text-[color:var(--ap-ink-3)]">Sin compromisos personales en las próximas dos semanas.</p>
      ) : (
        <ul className="ap-card divide-y overflow-hidden">
          {items.slice(0, 40).map((c, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
              <Avatar member={member} size={26} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium">
                  {c.private ? 'Ocupado' : c.title}
                  {c.private && memberId === me?.id && (
                    <span className="font-normal text-[color:var(--ap-ink-3)]"> · solo tú ves «{conflictLabel(c, me.id)}»</span>
                  )}
                </div>
                <div className="text-[13px] text-[color:var(--ap-ink-2)]">
                  {formatDayMedium(msToISODate(c.start))} ·{' '}
                  {c.end - c.start >= 23 * 3600_000 ? 'todo el día' : `${msToTime(c.start)}–${msToTime(c.end)}`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function ExportSection({ memberId, memberName }: { memberId: string; memberName: string }) {
  const { data } = useData()
  const mine = careEvents(data, memberId)
  const all = careEvents(data, null)
  const patient = data.patient.name.split(' ')[0] || 'cuidados'

  const download = (events: typeof all, name: string, file: string) =>
    downloadBlob(new Blob([buildIcs(name, events)], { type: 'text/calendar' }), file)

  return (
    <Section title="Llevar los turnos a tu calendario">
      <div className="ap-card p-4">
        <p className="text-[15px] text-[color:var(--ap-ink-2)]">
          Descarga tus turnos y las citas en las que acompañas y ábrelo con tu calendario (Google, Apple, Outlook) para
          tenerlo todo junto. Si cambia algo, vuelve a descargarlo: los eventos se actualizan sin duplicarse.
        </p>
        {IS_PREVIEW ? (
          <div className="mt-3">
            <Notice icon="calendar">
              En esta vista previa no se pueden descargar archivos de calendario. Ahora mismo tendrías {mine.length}{' '}
              {mine.length === 1 ? 'evento' : 'eventos'} de {memberName} y {all.length} de toda la agenda.
            </Notice>
          </div>
        ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="ap-btn ap-btn-sm ap-btn-primary"
            disabled={!mine.length}
            onClick={() => download(mine, `Cuidar a ${patient} (${memberName})`, `turnos-${memberName.toLowerCase()}.ics`)}
          >
            <Icon name="download" size={16} /> Turnos de {memberName} ({mine.length})
          </button>
          <button
            type="button"
            className="ap-btn ap-btn-sm ap-btn-neutral"
            disabled={!all.length}
            onClick={() => download(all, `Cuidados de ${patient}`, 'cuidados-completo.ics')}
          >
            <Icon name="download" size={16} /> Agenda completa ({all.length})
          </button>
        </div>
        )}
      </div>
    </Section>
  )
}
