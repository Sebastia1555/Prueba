import { useEffect, useRef, useState } from 'react'
import type { DocCategory, DocumentMeta } from '../types'
import { useData } from '../context/DataContext'
import { deleteFile, getFile, saveFile } from '../lib/db'
import { formatDate, todayISO } from '../lib/dates'
import { downloadMessage, offerDownload } from '../lib/download'
import { IS_PREVIEW } from '../lib/env'
import { DOC_CATEGORIES, formatFileSize, newId } from '../lib/labels'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'
import { PdfViewer } from './PdfViewer'
import { Icon } from './Icon'
import { Field, Notice } from './ui'

const MAX_FILE_MB = 25

/** Botón + formulario para subir uno o varios archivos. */
export function DocumentUploadButton({
  appointmentId = null,
  defaultCategory = 'informe',
  defaultDate,
  label = 'Añadir documento',
  className = 'ap-btn ap-btn-sm ap-btn-primary',
}: {
  appointmentId?: string | null
  defaultCategory?: DocCategory
  defaultDate?: string
  label?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()}>
        <Icon name="upload" size={16} /> {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
        onChange={(e) => {
          setFiles([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
      {files.length > 0 && (
        <UploadModal
          files={files}
          appointmentId={appointmentId}
          defaultCategory={defaultCategory}
          defaultDate={defaultDate ?? todayISO()}
          onClose={() => setFiles([])}
        />
      )}
    </>
  )
}

function UploadModal({
  files,
  appointmentId,
  defaultCategory,
  defaultDate,
  onClose,
}: {
  files: File[]
  appointmentId: string | null
  defaultCategory: DocCategory
  defaultDate: string
  onClose: () => void
}) {
  const { data, me, upsertMany } = useData()
  const tooBig = files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024)
  const valid = files.filter((f) => !tooBig.includes(f))
  const [title, setTitle] = useState(valid.length === 1 ? valid[0].name.replace(/\.[^.]+$/, '') : '')
  const [category, setCategory] = useState<DocCategory>(defaultCategory)
  const [date, setDate] = useState(defaultDate)
  const [apptId, setApptId] = useState<string>(appointmentId ?? '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    const metas: DocumentMeta[] = []
    try {
      for (const f of valid) {
        const id = newId()
        await saveFile(id, f)
        metas.push({
          id,
          title: valid.length === 1 && title.trim() ? title.trim() : f.name.replace(/\.[^.]+$/, ''),
          fileName: f.name,
          mimeType: f.type || 'application/octet-stream',
          size: f.size,
          category,
          date,
          appointmentId: apptId || null,
          notes: notes.trim(),
          addedBy: me?.id ?? '',
          addedAt: Date.now(),
        })
      }
      upsertMany('documents', metas)
      onClose()
    } catch {
      // No dejar archivos sueltos de una subida a medias.
      for (const m of metas) await deleteFile(m.id).catch(() => undefined)
      setError('No se ha podido guardar. Puede que el dispositivo se haya quedado sin espacio.')
      setSaving(false)
    }
  }

  const appointments = [...data.appointments].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Modal open onClose={onClose} title={valid.length > 1 ? `Subir ${valid.length} documentos` : 'Subir documento'}>
      {tooBig.length > 0 && (
        <div className="mb-3">
          <Notice tone="amber">
            {tooBig.map((f) => f.name).join(', ')} ocupa{tooBig.length > 1 ? 'n' : ''} más de {MAX_FILE_MB} MB y no se subirá.
          </Notice>
        </div>
      )}
      {valid.length > 1 && (
        <ul className="mb-3 space-y-1 text-[14px] text-[color:var(--ap-ink-2)]">
          {valid.map((f) => (
            <li key={f.name}>📎 {f.name}</li>
          ))}
        </ul>
      )}
      <div className="space-y-3">
        {valid.length === 1 && (
          <Field label="Título">
            <input className="ap-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <select className="ap-input" value={category} onChange={(e) => setCategory(e.target.value as DocCategory)}>
              {Object.entries(DOC_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.emoji} {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha del documento">
            <input type="date" className="ap-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Cita relacionada">
          <select className="ap-input" value={apptId} onChange={(e) => setApptId(e.target.value)}>
            <option value="">Ninguna</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {formatDate(a.date)} · {a.specialty}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notas (opcional)">
          <input className="ap-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      {error && (
        <div className="mt-3">
          <Notice tone="red">{error}</Notice>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={save} disabled={saving || !valid.length}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </Modal>
  )
}

/** Lista de documentos con visor. */
export function DocumentList({ documents, showAppointment = true }: { documents: DocumentMeta[]; showAppointment?: boolean }) {
  const { data, memberById } = useData()
  const [open, setOpen] = useState<DocumentMeta | null>(null)

  return (
    <>
      <ul className="ap-card divide-y overflow-hidden">
        {documents.map((doc) => {
          const appt = showAppointment ? data.appointments.find((a) => a.id === doc.appointmentId) : undefined
          return (
            <li key={doc.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
              <button
                type="button"
                onClick={() => setOpen(doc)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02]"
              >
                <span className="text-2xl">{DOC_CATEGORIES[doc.category]?.emoji ?? '📎'}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-medium">{doc.title}</div>
                  <div className="truncate text-[13px] text-[color:var(--ap-ink-3)]">
                    {formatDate(doc.date)} · {DOC_CATEGORIES[doc.category]?.label}
                    {appt && ` · Cita de ${appt.specialty}`}
                    {memberById(doc.addedBy) && ` · subido por ${memberById(doc.addedBy)!.name}`}
                  </div>
                </div>
                <Icon name="chevronRight" size={18} className="shrink-0 text-[color:var(--ap-ink-3)]" />
              </button>
            </li>
          )
        })}
      </ul>
      {open && <DocumentViewer doc={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function DocumentViewer({ doc, onClose }: { doc: DocumentMeta; onClose: () => void }) {
  const { data, can, upsert, remove } = useData()
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(doc.title)
  const [category, setCategory] = useState(doc.category)
  const [notes, setNotes] = useState(doc.notes)
  const [pdfFailed, setPdfFailed] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    getFile(doc.id)
      .then((b) => {
        if (!b) {
          setMissing(true)
          return
        }
        objectUrl = URL.createObjectURL(b)
        setBlob(b)
        setUrl(objectUrl)
      })
      .catch(() => setMissing(true))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [doc.id])

  const appt = data.appointments.find((a) => a.id === doc.appointmentId)
  const isImage = doc.mimeType.startsWith('image/')
  const isPdf = doc.mimeType === 'application/pdf'

  return (
    <Modal open onClose={onClose} title={doc.title} maxWidth="max-w-3xl">
      <div className="mb-3 text-[14px] text-[color:var(--ap-ink-2)]">
        {DOC_CATEGORIES[doc.category]?.label} · {formatDate(doc.date)} · {formatFileSize(doc.size)}
        {appt && ` · Cita de ${appt.specialty} (${formatDate(appt.date)})`}
        {doc.notes && <p className="mt-1">{doc.notes}</p>}
      </div>

      {missing ? (
        <Notice tone="amber">El archivo no está en este dispositivo (quizá se subió desde otro).</Notice>
      ) : !url ? (
        <p className="py-10 text-center text-[color:var(--ap-ink-3)]">Cargando…</p>
      ) : isImage ? (
        <img src={url} alt={doc.title} className="mx-auto max-h-[60vh] rounded-[12px]" />
      ) : isPdf && blob && !pdfFailed ? (
        <PdfViewer blob={blob} onError={() => setPdfFailed(true)} />
      ) : isPdf && !IS_PREVIEW ? (
        <iframe src={url} title={doc.title} className="h-[60vh] w-full rounded-[12px] border" style={{ borderColor: 'var(--ap-hairline-soft)' }} />
      ) : (
        <p className="py-6 text-center text-[15px] text-[color:var(--ap-ink-2)]">Vista previa no disponible. Descárgalo para abrirlo.</p>
      )}

      {editing && (
        <div className="mt-4 space-y-3">
          <Field label="Título">
            <input className="ap-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Tipo">
            <select className="ap-input" value={category} onChange={(e) => setCategory(e.target.value as DocCategory)}>
              {Object.entries(DOC_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notas">
            <input className="ap-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          {can('editDocuments') && (
            <>
              <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={() => setConfirmDelete(true)}>
                Eliminar
              </button>
              {!editing && (
                <button type="button" className="ap-btn ap-btn-sm ap-btn-quiet" onClick={() => setEditing(true)}>
                  Editar datos
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <button
              type="button"
              className="ap-btn ap-btn-sm ap-btn-primary"
              onClick={() => {
                upsert('documents', { ...doc, title: title.trim() || doc.title, category, notes: notes.trim() })
                onClose()
              }}
            >
              Guardar
            </button>
          ) : (
            <>
              {url && !IS_PREVIEW && (
                <a href={url} target="_blank" rel="noreferrer" className="ap-btn ap-btn-sm ap-btn-neutral">
                  Abrir
                </a>
              )}
              {blob && (
                <button
                  type="button"
                  className="ap-btn ap-btn-sm ap-btn-primary"
                  onClick={async () => setDownloadError(downloadMessage(await offerDownload(blob, doc.fileName)))}
                >
                  <Icon name="download" size={16} /> Descargar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {downloadError && (
        <div className="mt-3">
          <Notice tone="amber">{downloadError}</Notice>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar documento"
        message={`Se borrará «${doc.title}» de este dispositivo.`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          remove('documents', doc.id)
          onClose()
        }}
      />
    </Modal>
  )
}
