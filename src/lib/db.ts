// Persistencia local con IndexedDB: el estado de la app y los archivos
// adjuntos (informes, analíticas…) que no cabrían en localStorage.

import type { AppData } from '../types'

const DB_NAME = 'cuidamos'
const DB_VERSION = 1
const KV = 'kv'
const FILES = 'files'
const DATA_KEY = 'data'

let dbPromise: Promise<IDBDatabase> | null = null

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

export function loadData(): Promise<AppData | null> {
  return run<AppData | undefined>(KV, 'readonly', (s) => s.get(DATA_KEY)).then((d) => d ?? null)
}

export function saveData(data: AppData): Promise<void> {
  return run(KV, 'readwrite', (s) => s.put(data, DATA_KEY))
}

export function saveFile(id: string, blob: Blob): Promise<void> {
  return run(FILES, 'readwrite', (s) => s.put(blob, id))
}

export function getFile(id: string): Promise<Blob | null> {
  return run<Blob | undefined>(FILES, 'readonly', (s) => s.get(id)).then((b) => b ?? null)
}

export function deleteFile(id: string): Promise<void> {
  return run(FILES, 'readwrite', (s) => s.delete(id))
}

export function clearAll(): Promise<void> {
  return Promise.all([
    run(KV, 'readwrite', (s) => s.clear()),
    run(FILES, 'readwrite', (s) => s.clear()),
  ]).then(() => undefined)
}

/** Pide al navegador que no borre los datos si se queda sin espacio. */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.()
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
