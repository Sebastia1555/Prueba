import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, ListItem, ListKey, Member } from '../types'
import {
  deleteFile,
  keepFilesInMemory,
  loadData,
  loadMeId,
  requestPersistentStorage,
  storageAvailable,
  saveData,
  saveMeId,
} from '../lib/db'
import { IS_PREVIEW } from '../lib/env'
import { can as roleCan, type Permission } from '../lib/permissions'
import { buildSampleData } from '../lib/sampleData'
import { emptyData, normalizeData, replaceAllData } from '../lib/store'

interface DataContextValue {
  data: AppData
  ready: boolean
  /** No se pudo guardar en este navegador (modo privado, sin espacio…). */
  storageError: boolean
  /** No se pudieron leer los datos guardados: no se escribe nada para no pisarlos. */
  storageLocked: boolean
  /** Perfil con el que se usa la app en este dispositivo. */
  me: Member | undefined
  setMeId: (id: string | null) => void
  can: (perm: Permission) => boolean
  memberById: (id: string | null | undefined) => Member | undefined
  update: (fn: (d: AppData) => AppData) => void
  upsert: <K extends ListKey>(key: K, item: ListItem<K>) => void
  upsertMany: <K extends ListKey>(key: K, items: ListItem<K>[]) => void
  remove: <K extends ListKey>(key: K, id: string) => void
  /**
   * Sustituye todos los datos (copia de seguridad, datos de ejemplo, borrar).
   * Quien llama ya los ha guardado; `persisted` indica si ha podido.
   */
  replaceData: (data: AppData, persisted?: boolean) => void
}

const DataContext = createContext<DataContextValue | null>(null)

const CHANNEL = 'cuidamos-data'

function openChannel(): BroadcastChannel | null {
  try {
    return new BroadcastChannel(CHANNEL)
  } catch {
    return null
  }
}

/** Lee los datos guardados, con un reintento por si el primer intento falla de forma puntual. */
async function loadWithRetry(): Promise<AppData | null> {
  try {
    return await loadData()
  } catch {
    await new Promise((r) => setTimeout(r, 300))
    return loadData()
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => emptyData())
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [storageLocked, setStorageLocked] = useState(false)
  const [meId, setMeIdState] = useState<string | null>(() => loadMeId())
  const dirty = useRef(false)
  const locked = useRef(false)
  const channel = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    let cancelled = false
    // En la vista previa se abre directamente con la familia de ejemplo.
    const showSample = (persist: boolean) => {
      const sample = buildSampleData()
      setData(sample.data)
      const firstId = sample.data.members[0].id
      setMeIdState(firstId)
      saveMeId(firstId)
      if (persist) {
        void replaceAllData(sample.data, sample.files).then((outcome) => {
          if (outcome !== 'stored') setStorageError(true)
        })
      } else {
        keepFilesInMemory(sample.files)
      }
    }
    loadWithRetry()
      .then((stored) => {
        if (cancelled) return
        if (stored) setData(normalizeData(stored))
        else if (IS_PREVIEW) showSample(true)
      })
      .catch(async () => {
        if (cancelled) return
        setStorageError(true)
        // Si la base de datos existe pero no se ha podido leer, nunca escribir
        // encima: ahí pueden estar los datos de la familia y el fallo puede
        // ser pasajero. Si directamente no hay almacenamiento, no hay nada que
        // proteger.
        if (await storageAvailable()) {
          locked.current = true
          setStorageLocked(true)
        }
        if (cancelled) return
        if (IS_PREVIEW) showSample(false)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Si otra pestaña guarda cambios, se recargan aquí para no pisarlos después.
  useEffect(() => {
    const ch = openChannel()
    channel.current = ch
    if (!ch) return
    ch.onmessage = () => {
      if (locked.current) return
      loadData()
        .then((stored) => {
          dirty.current = false
          setData(stored ? normalizeData(stored) : emptyData())
        })
        .catch(() => undefined)
    }
    return () => {
      ch.close()
      channel.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready || !dirty.current || locked.current) return
    saveData(data)
      .then(() => {
        setStorageError(false)
        channel.current?.postMessage('saved')
      })
      .catch(() => setStorageError(true))
  }, [data, ready])

  const update = useCallback((fn: (d: AppData) => AppData) => {
    dirty.current = true
    setData((prev) => fn(prev))
    requestPersistentStorage()
  }, [])

  const upsert = useCallback(
    <K extends ListKey>(key: K, item: ListItem<K>) => {
      update((d) => {
        const list = d[key] as ListItem<K>[]
        const exists = list.some((x) => x.id === item.id)
        const next = exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]
        return { ...d, [key]: next }
      })
    },
    [update],
  )

  const upsertMany = useCallback(
    <K extends ListKey>(key: K, items: ListItem<K>[]) => {
      if (!items.length) return
      update((d) => {
        const byId = new Map(items.map((x) => [x.id, x]))
        const list = (d[key] as ListItem<K>[]).map((x) => {
          const repl = byId.get(x.id)
          if (repl) byId.delete(x.id)
          return repl ?? x
        })
        return { ...d, [key]: [...list, ...byId.values()] }
      })
    },
    [update],
  )

  const remove = useCallback(
    <K extends ListKey>(key: K, id: string) => {
      if (key === 'documents') void deleteFile(id).catch(() => undefined)
      update((d) => ({ ...d, [key]: (d[key] as ListItem<K>[]).filter((x) => x.id !== id) }))
    },
    [update],
  )

  const replaceData = useCallback((next: AppData, persisted = true) => {
    // Quien llama ya ha guardado (o borrado) los datos en IndexedDB.
    dirty.current = false
    setData(next)
    setStorageError(!persisted)
    if (persisted) {
      locked.current = false
      setStorageLocked(false)
      channel.current?.postMessage('saved')
    }
  }, [])

  const setMeId = useCallback((id: string | null) => {
    setMeIdState(id)
    saveMeId(id)
  }, [])

  const me = useMemo(
    () => data.members.find((m) => m.id === meId) ?? undefined,
    [data.members, meId],
  )

  const can = useCallback((perm: Permission) => roleCan(me?.role, perm), [me])

  const memberById = useCallback(
    (id: string | null | undefined) => (id ? data.members.find((m) => m.id === id) : undefined),
    [data.members],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      ready,
      storageError,
      storageLocked,
      me,
      setMeId,
      can,
      memberById,
      update,
      upsert,
      upsertMany,
      remove,
      replaceData,
    }),
    [data, ready, storageError, storageLocked, me, setMeId, can, memberById, update, upsert, upsertMany, remove, replaceData],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}
