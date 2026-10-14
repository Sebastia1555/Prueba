import type { AppData, Patient } from '../types'
import {
  deleteFile,
  deleteFilesExcept,
  getFile,
  keepFilesInMemory,
  listFileIds,
  saveData,
  saveFile,
  storageAvailable,
} from './db'
import { newId } from './labels'
import { DEFAULT_SLOTS } from './shifts'

export function emptyPatient(): Patient {
  return {
    name: '',
    birthDate: '',
    address: '',
    idNumber: '',
    healthCardNumber: '',
    socialSecurityNumber: '',
    bloodType: '',
    allergies: '',
    conditions: '',
    mobility: '',
    diet: '',
    gpName: '',
    gpPhone: '',
    healthCenter: '',
    insurance: '',
    dependencyGrade: '',
    notes: '',
    emergencyContacts: [],
  }
}

export function emptyData(): AppData {
  return {
    version: 1,
    patient: emptyPatient(),
    members: [],
    slots: DEFAULT_SLOTS.map((s) => ({ ...s, id: newId() })),
    shifts: [],
    busyBlocks: [],
    calendars: [],
    medications: [],
    doseLogs: [],
    appointments: [],
    documents: [],
    diary: [],
    expenses: [],
    settlements: [],
    cameras: [],
  }
}

/** Completa campos que falten (datos guardados por versiones anteriores o copias). */
export function normalizeData(raw: Partial<AppData>): AppData {
  const base = emptyData()
  return {
    ...base,
    ...raw,
    version: 1,
    patient: { ...base.patient, ...(raw.patient ?? {}) },
    slots: raw.slots ?? base.slots,
  }
}

// --- Copia de seguridad ------------------------------------------------------

interface BackupFile {
  app: 'cuidamos'
  exportedAt: string
  data: AppData
  files: Record<string, { type: string; base64: string }>
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, type: string): Blob {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

export async function exportBackup(data: AppData): Promise<Blob> {
  const files: BackupFile['files'] = {}
  for (const doc of data.documents) {
    const blob = await getFile(doc.id)
    if (blob) files[doc.id] = { type: blob.type || doc.mimeType, base64: await blobToBase64(blob) }
  }
  const backup: BackupFile = { app: 'cuidamos', exportedAt: new Date().toISOString(), data, files }
  return new Blob([JSON.stringify(backup)], { type: 'application/json' })
}

/**
 * Sustituye todos los datos de este dispositivo por los de la copia. Con
 * `persist = false` solo se cargan para esta sesión, sin tocar lo guardado.
 */
export async function importBackup(file: Blob, persist = true): Promise<{ data: AppData; persisted: boolean }> {
  let parsed: BackupFile
  try {
    parsed = JSON.parse(await file.text()) as BackupFile
  } catch {
    throw new Error('El archivo no es una copia de seguridad válida.')
  }
  if (parsed?.app !== 'cuidamos' || !parsed.data) {
    throw new Error('El archivo no es una copia de seguridad de Cuidamos.')
  }
  const data = normalizeData(parsed.data)
  const files: Record<string, Blob> = {}
  try {
    for (const [id, f] of Object.entries(parsed.files ?? {})) files[id] = base64ToBlob(f.base64, f.type)
  } catch {
    throw new Error('La copia de seguridad está dañada: algún documento no se puede leer.')
  }
  const outcome = await replaceAllData(data, files, persist)
  if (outcome === 'failed') {
    throw new Error('No hay espacio suficiente en este dispositivo para restaurar la copia. No se ha cambiado nada.')
  }
  return { data, persisted: outcome === 'stored' }
}

/**
 * Sustituye todos los datos y archivos. Primero escribe lo nuevo y solo
 * después borra lo antiguo, así que si algo falla no se pierde nada.
 * - `'stored'`: guardado de forma permanente.
 * - `'memory'`: solo para esta sesión (el navegador no deja guardar, o se
 *   ha pedido `persist = false` para no tocar lo guardado).
 * - `'failed'`: no se ha podido escribir (p. ej. sin espacio); no ha cambiado nada.
 */
export async function replaceAllData(
  data: AppData,
  files: Record<string, Blob> = {},
  persist = true,
): Promise<'stored' | 'memory' | 'failed'> {
  if (!persist || !(await storageAvailable())) {
    keepFilesInMemory(files)
    return 'memory'
  }
  const existing = await listFileIds()
  const written: string[] = []
  try {
    for (const [id, blob] of Object.entries(files)) {
      if ((await saveFile(id, blob)) === 'memory') {
        keepFilesInMemory(files)
        return 'memory'
      }
      written.push(id)
    }
    await saveData(data)
  } catch {
    // No dejar a medias los archivos nuevos que no estaban antes.
    for (const id of written) if (!existing.has(id)) await deleteFile(id).catch(() => undefined)
    return 'failed'
  }
  await deleteFilesExcept(new Set(Object.keys(files)))
  return 'stored'
}
