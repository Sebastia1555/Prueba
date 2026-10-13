// Persistencia local con IndexedDB: el estado de la app y los archivos
// adjuntos (informes, analíticas…) que no cabrían en localStorage.
//
// Si el navegador no deja usar IndexedDB en absoluto (ventana privada, visor
// con el almacenamiento bloqueado…), los archivos se guardan en memoria para
// que la sesión funcione igual, aunque se pierdan al cerrar. Si la base de
// datos funciona pero una escritura falla (p. ej. sin espacio), el error se
// propaga para poder avisar.

import type { AppData } from '../types'

const DB_NAME = 'cuidamos'
const DB_VERSION = 1
const KV = 'kv'
const FILES = 'files'
const DATA_KEY = 'data'

let dbPromise: Promise<IDBDatabase> | null = null
const memoryFiles = new Map<string, Blob>()

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV)
        if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      req.onblocked = () => reject(new Error('IndexedDB bloqueada'))
    })
    dbPromise.catch(() => {
      dbPromise = null
    })
  }
  return dbPromise
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = fn(tx.objectStore(store))
        tx.oncomplete = () => resolve(req.result as T)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      }),
  )
}

/** ¿Este navegador deja usar IndexedDB? (no en ventanas privadas de algunos navegadores ni en marcos aislados) */
export function storageAvailable(): Promise<boolean> {
  return openDb().then(
    () => true,
    () => false,
  )
}

export function loadData(): Promise<AppData | null> {
  return run<AppData | undefined>(KV, 'readonly', (s) => s.get(DATA_KEY)).then((d) => d ?? null)
}

export function saveData(data: AppData): Promise<void> {
  return run(KV, 'readwrite', (s) => s.put(data, DATA_KEY))
}

/** `'memory'` si no hay almacenamiento persistente y el archivo solo vive en esta sesión. */
export async function saveFile(id: string, blob: Blob): Promise<'stored' | 'memory'> {
  try {
    await openDb()
  } catch {
    memoryFiles.set(id, blob)
    return 'memory'
  }
  await run(FILES, 'readwrite', (s) => s.put(blob, id))
  return 'stored'
}

/** Deja en memoria (sin tocar IndexedDB) exactamente estos archivos. */
export function keepFilesInMemory(files: Record<string, Blob>): void {
  memoryFiles.clear()
  for (const [id, blob] of Object.entries(files)) memoryFiles.set(id, blob)
}

/** Ids de los archivos guardados de forma permanente (vacío si no hay almacenamiento). */
export async function listFileIds(): Promise<Set<string>> {
  try {
    const ids = await run<IDBValidKey[]>(FILES, 'readonly', (s) => s.getAllKeys())
    return new Set(ids.map(String))
  } catch {
    return new Set()
  }
}

/** Borra los archivos guardados cuyo id no esté en `keep`. */
export async function deleteFilesExcept(keep: Set<string>): Promise<void> {
  for (const id of [...memoryFiles.keys()]) if (!keep.has(id)) memoryFiles.delete(id)
  try {
    const stale = [...(await listFileIds())].filter((id) => !keep.has(id))
    if (stale.length) {
      await run(FILES, 'readwrite', (s) => {
        let last: IDBRequest = s.count()
        for (const id of stale) last = s.delete(id)
        return last
      })
    }
  } catch {
    // sin almacenamiento persistente
  }
}

export async function getFile(id: string): Promise<Blob | null> {
  const inMemory = memoryFiles.get(id)
  if (inMemory) return inMemory
  try {
    return (await run<Blob | undefined>(FILES, 'readonly', (s) => s.get(id))) ?? null
  } catch {
    return null
  }
}

export async function deleteFile(id: string): Promise<void> {
  memoryFiles.delete(id)
  try {
    await run(FILES, 'readwrite', (s) => s.delete(id))
  } catch {
    // no había almacenamiento persistente
  }
}

export async function clearAll(): Promise<void> {
  memoryFiles.clear()
  try {
    await Promise.all([run(KV, 'readwrite', (s) => s.clear()), run(FILES, 'readwrite', (s) => s.clear())])
  } catch {
    // sin almacenamiento persistente: basta con vaciar la memoria
  }
}

/** Pide al navegador que no borre los datos si se queda sin espacio. */
export function requestPersistentStorage(): void {
  try {
    navigator.storage?.persist?.().catch(() => undefined)
  } catch {
    // no soportado
  }
}

// Perfil activo en este dispositivo ("¿quién eres?").
const ME_KEY = 'cuidamos-me'

export function loadMeId(): string | null {
  try {
    return localStorage.getItem(ME_KEY)
  } catch {
    return null
  }
}

export function saveMeId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ME_KEY, id)
    else localStorage.removeItem(ME_KEY)
  } catch {
    // almacenamiento no disponible
  }
}

// Avisos que cada persona ya ha cerrado en este dispositivo.
export function isDismissed(key: string): boolean {
  try {
    return localStorage.getItem(`cuidamos-dismissed-${key}`) === '1'
  } catch {
    return false
  }
}

export function dismiss(key: string): void {
  try {
    localStorage.setItem(`cuidamos-dismissed-${key}`, '1')
  } catch {
    // almacenamiento no disponible
  }
}
