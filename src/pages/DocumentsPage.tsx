import { useMemo, useState } from 'react'
import type { DocCategory } from '../types'
import { useData } from '../context/DataContext'
import { DOC_CATEGORIES } from '../lib/labels'
import { DocumentList, DocumentUploadButton } from '../components/Documents'
import { EmptyState, Notice, PageHeader } from '../components/ui'

export function DocumentsPage() {
  const { data, can } = useData()
  const [category, setCategory] = useState<DocCategory | ''>('')
  const [query, setQuery] = useState('')

  const docs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.documents
      .filter((d) => !category || d.category === category)
      .filter((d) => {
        if (!q) return true
        const appt = data.appointments.find((a) => a.id === d.appointmentId)
        return [d.title, d.fileName, d.notes, appt?.specialty ?? ''].some((f) => f.toLowerCase().includes(q))
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.addedAt - a.addedAt)
  }, [data.documents, data.appointments, category, query])

  if (!can('viewDocuments')) {
    return <Notice icon="lock">Tu rol no tiene acceso a los documentos.</Notice>
  }

  const counts = new Map<string, number>()
  for (const d of data.documents) counts.set(d.category, (counts.get(d.category) ?? 0) + 1)

  return (
    <div>
      <PageHeader
        title="Documentos"
        subtitle="Informes, analíticas, recetas y papeles, todo en un sitio"
        actions={can('editDocuments') && <DocumentUploadButton />}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('')}
          className={`ap-btn ap-btn-sm ${category === '' ? 'ap-btn-primary' : 'ap-btn-neutral'}`}
        >
          Todos ({data.documents.length})
        </button>
        {Object.entries(DOC_CATEGORIES)
          .filter(([k]) => counts.get(k))
          .map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setCategory(k as DocCategory)}
              className={`ap-btn ap-btn-sm ${category === k ? 'ap-btn-primary' : 'ap-btn-neutral'}`}
            >
              {v.emoji} {v.label} ({counts.get(k)})
            </button>
          ))}
      </div>

      <input
        type="search"
        className="ap-input mb-4"
        placeholder="Buscar por título, especialidad o notas"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {docs.length ? (
        <DocumentList documents={docs} />
      ) : (
        <EmptyState icon="🗂️" title={data.documents.length ? 'Nada coincide con la búsqueda' : 'Aún no hay documentos'}>
          {!data.documents.length && 'Sube informes, analíticas o fotos de recetas. Se guardan en este dispositivo.'}
        </EmptyState>
      )}

      <p className="mt-4 px-1 text-[13px] text-[color:var(--ap-ink-3)]">
        En esta versión los archivos se guardan solo en este dispositivo. Para pasarlos a otro, usa la copia de seguridad
        en Ajustes.
      </p>
    </div>
  )
}
