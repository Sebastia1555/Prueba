import { useEffect, useRef, useState } from 'react'
import type { CareSlot } from '../types'
import { useData } from '../context/DataContext'
import { clearAll } from '../lib/db'
import { formatHours, todayISO } from '../lib/dates'
import { downloadMessage, offerDownload } from '../lib/download'
import { formatFileSize, newId } from '../lib/labels'
import { buildSampleData } from '../lib/sampleData'
import { slotMinutes, sortSlots } from '../lib/shifts'
import { emptyData, exportBackup, importBackup, replaceAllData } from '../lib/store'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Modal } from '../components/Modal'
import { Icon } from '../components/Icon'
import { Field, Notice, PageHeader, Section, WeekdayPicker } from '../components/ui'

export function Settings() {
  const { data, can } = useData()
  const [editingSlot, setEditingSlot] = useState<CareSlot | 'new' | null>(null)

  return (
    <div>
      <PageHeader title="Ajustes" />

      <Section
        title="Franjas de cuidado"
        action={
          can('manageSettings') && (
            <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost" onClick={() => setEditingSlot('new')}>
              <Icon name="plus" size={16} /> Franja
            </button>
          )
        }
      >
        <p className="mb-2 px-1 text-[14px] text-[color:var(--ap-ink-2)]">
          Los tramos del día en los que alguien tiene que estar con {data.patient.name.split(' ')[0] || 'la persona cuidada'}.
          La agenda se organiza con ellos.
        </p>
        <ul className="ap-card divide-y overflow-hidden">
          {sortSlots(data.slots).map((s) => (
            <li key={s.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
              <button
                type="button"
                disabled={!can('manageSettings')}
                onClick={() => setEditingSlot(s)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-black/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-medium">{s.label}</div>
                  <div className="text-[14px] text-[color:var(--ap-ink-2)]">
                    {s.start}–{s.end} · {formatHours(slotMinutes(s))} ·{' '}
                    {s.weekdays.length === 7 ? 'todos los días' : `${s.weekdays.length} días por semana`}
                  </div>
                </div>
                {can('manageSettings') && <Icon name="edit" size={18} className="text-[color:var(--ap-ink-3)]" />}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <BackupSection />

      {editingSlot && <SlotForm slot={editingSlot === 'new' ? undefined : editingSlot} onClose={() => setEditingSlot(null)} />}
    </div>
  )
}

function SlotForm({ slot, onClose }: { slot?: CareSlot; onClose: () => void }) {
  const { data, upsert, update } = useData()
  const [s, setS] = useState<CareSlot>(slot ?? { id: newId(), label: '', start: '08:00', end: '14:00', weekdays: [1, 2, 3, 4, 5, 6, 7] })
  const [confirm, setConfirm] = useState(false)
  const set = <K extends keyof CareSlot>(key: K, value: CareSlot[K]) => setS((prev) => ({ ...prev, [key]: value }))
  const used = slot ? data.shifts.filter((x) => x.slotId === slot.id).length : 0
  const valid = s.label.trim() && s.start && s.end && s.start !== s.end && s.weekdays.length > 0

  return (
    <Modal open onClose={onClose} title={slot ? 'Editar franja' : 'Nueva franja'} maxWidth="max-w-md">
      <div className="space-y-3">
        <Field label="Nombre">
          <input className="ap-input" value={s.label} onChange={(e) => set('label', e.target.value)} placeholder="Mañana, tarde, noche, comida…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Empieza">
            <input type="time" className="ap-input" value={s.start} onChange={(e) => set('start', e.target.value)} />
          </Field>
          <Field label="Termina" hint={s.end <= s.start ? 'Al día siguiente' : undefined}>
            <input type="time" className="ap-input" value={s.end} onChange={(e) => set('end', e.target.value)} />
          </Field>
        </div>
        <div>
          <span className="ap-label">Días en que hace falta</span>
          <WeekdayPicker value={s.weekdays} onChange={(v) => set('weekdays', v)} />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-2">
        {slot ? (
          <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={() => setConfirm(true)}>
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
              upsert('slots', { ...s, label: s.label.trim() })
              onClose()
            }}
          >
            Guardar
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Eliminar franja"
        message={used ? `Se borrarán también los ${used} turnos asignados a esta franja.` : '¿Seguro?'}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          update((d) => ({ ...d, slots: d.slots.filter((x) => x.id !== s.id), shifts: d.shifts.filter((x) => x.slotId !== s.id) }))
          onClose()
        }}
      />
    </Modal>
  )
}

function BackupSection() {
  const { data, can, replaceData, setMeId, storageLocked } = useData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<File | null>(null)
  const [confirmSample, setConfirmSample] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [usage, setUsage] = useState<string | null>(null)
  const admin = can('manageSettings')

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((e) => {
        if (e.usage !== undefined) setUsage(`${formatFileSize(e.usage)}${e.quota ? ` de ${formatFileSize(e.quota)} disponibles` : ''}`)
      })
      .catch(() => undefined)
  }, [data])

  const doExport = async () => {
    const blob = await exportBackup(data)
    const problem = downloadMessage(await offerDownload(blob, `cuidamos-copia-${todayISO()}.json`))
    if (problem) setMessage({ tone: 'red', text: problem })
  }

  const doImport = async (file: File) => {
    try {
      // Si no se han podido leer los datos guardados, no se tocan: la copia solo se carga para esta sesión.
      const { data: next, persisted } = await importBackup(file, !storageLocked)
      replaceData(next, persisted)
      setMeId(null)
    } catch (e) {
      setMessage({ tone: 'red', text: e instanceof Error ? e.message : 'No se pudo restaurar la copia.' })
    }
  }

  const loadSample = async () => {
    const { data: sample, files } = buildSampleData()
    const outcome = await replaceAllData(sample, files, !storageLocked)
    if (outcome === 'failed') {
      setMessage({ tone: 'red', text: 'No hay espacio en este dispositivo para cargar los datos de ejemplo. No se ha cambiado nada.' })
      return
    }
    replaceData(sample, outcome === 'stored')
    setMeId(sample.members[0].id)
    setMessage({ tone: 'green', text: 'Datos de ejemplo cargados. Estás como Ana (administradora).' })
  }

  const reset = async () => {
    if (storageLocked) {
      // No borrar lo guardado si no se ha podido leer: solo se vacía esta sesión.
      replaceData(emptyData(), false)
    } else {
      await clearAll()
      replaceData(emptyData())
    }
    setMeId(null)
  }

  return (
    <Section title="Datos y copia de seguridad">
      <div className="ap-card space-y-4 p-4">
        <Notice icon="lock">
          Esta versión guarda todo (también los documentos) solo en este navegador. Para pasar los datos a otro móvil o
          compartirlos con la familia, descarga una copia y ábrela en el otro dispositivo con «Restaurar».
        </Notice>
        {usage && <p className="text-[14px] text-[color:var(--ap-ink-2)]">Espacio usado: {usage}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={doExport}>
            <Icon name="download" size={16} /> Descargar copia
          </button>
          {admin && (
            <>
              <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => fileRef.current?.click()}>
                <Icon name="upload" size={16} /> Restaurar copia
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setPendingImport(f)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </div>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        {admin && (
          <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--ap-hairline-soft)' }}>
            <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={() => setConfirmSample(true)}>
              Cargar datos de ejemplo
            </button>
            <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={() => setConfirmReset(true)}>
              Borrar todo
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingImport}
        title="Restaurar copia"
        message="Se sustituirán todos los datos de este dispositivo por los de la copia. ¿Continuar?"
        confirmLabel="Restaurar"
        danger
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) void doImport(pendingImport)
          setPendingImport(null)
        }}
      />
      <ConfirmDialog
        open={confirmSample}
        title="Cargar datos de ejemplo"
        message="Se borrarán los datos actuales de este dispositivo y se cargará una familia de ejemplo."
        confirmLabel="Cargar"
        danger
        onCancel={() => setConfirmSample(false)}
        onConfirm={() => {
          setConfirmSample(false)
          void loadSample()
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Borrar todo"
        message={
          storageLocked
            ? 'Se vaciará lo que ves ahora. Los datos guardados en este navegador no se tocan: al recargar la página se intentará leerlos de nuevo.'
            : 'Se borrarán todos los datos y documentos de este dispositivo. Descarga antes una copia si la necesitas.'
        }
        confirmLabel="Borrar todo"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          void reset()
        }}
      />
    </Section>
  )
}
