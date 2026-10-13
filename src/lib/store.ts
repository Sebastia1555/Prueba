import type { AppData, Patient } from '../types'
import { clearAll, getFile, saveData, saveFile } from './db'
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

/** Sustituye todos los datos de este dispositivo por los de la copia. */
export async function importBackup(file: Blob): Promise<AppData> {
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
  for (const [id, f] of Object.entries(parsed.files ?? {})) files[id] = base64ToBlob(f.base64, f.type)
  await replaceAllData(data, files)
  return data
}

/**
 * Guarda los datos y archivos indicados sustituyendo lo que hubiera.
 * Devuelve `false` si no se han podido guardar de forma permanente (los
 * archivos quedan en memoria y la app sigue funcionando en esta sesión).
 */
export async function replaceAllData(data: AppData, files: Record<string, Blob> = {}): Promise<boolean> {
  await clearAll()
  for (const [id, blob] of Object.entries(files)) await saveFile(id, blob)
  try {
    await saveData(data)
    return true
  } catch {
    return false
  }
}
