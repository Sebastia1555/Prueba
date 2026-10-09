import { v4 as uuidv4 } from 'uuid'
import type { DiaryTag, DocCategory } from '../types'

export const newId = (): string => uuidv4()

export const MEMBER_COLORS = [
  '#0066cc',
  '#c2410c',
  '#7c3aed',
  '#0f766e',
  '#be185d',
  '#a16207',
  '#4d7c0f',
  '#475569',
]

export const DOC_CATEGORIES: Record<DocCategory, { label: string; emoji: string }> = {
  informe: { label: 'Informe médico', emoji: '📄' },
  analitica: { label: 'Analítica', emoji: '🧪' },
  prueba: { label: 'Prueba / imagen', emoji: '🩻' },
  receta: { label: 'Receta', emoji: '💊' },
  administrativo: { label: 'Administrativo', emoji: '🗂️' },
  otro: { label: 'Otro', emoji: '📎' },
}

export const DIARY_TAGS: Record<DiaryTag, { label: string; emoji: string }> = {
  comida: { label: 'Comida', emoji: '🍲' },
  sueno: { label: 'Sueño', emoji: '😴' },
  animo: { label: 'Ánimo', emoji: '🙂' },
  salud: { label: 'Salud', emoji: '🩺' },
  caida: { label: 'Caída', emoji: '⚠️' },
  incidencia: { label: 'Incidencia', emoji: '❗' },
  visita: { label: 'Visita', emoji: '👋' },
  otro: { label: 'Otro', emoji: '📝' },
}

export const SPECIALTIES = [
  'Médico de cabecera',
  'Enfermería',
  'Analítica',
  'Cardiología',
  'Neurología',
  'Traumatología',
  'Oftalmología',
  'Otorrinolaringología',
  'Urología',
  'Geriatría',
  'Endocrinología',
  'Neumología',
  'Dermatología',
  'Digestivo',
  'Rehabilitación',
  'Dentista',
  'Podología',
  'Urgencias',
]

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

/** Descarga un contenido como archivo. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
