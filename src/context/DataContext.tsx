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
import { deleteFile, loadData, loadMeId, requestPersistentStorage, saveData, saveMeId } from '../lib/db'
import { can as roleCan, type Permission } from '../lib/permissions'
import { emptyData, normalizeData } from '../lib/store'

interface DataContextValue {
  data: AppData
  ready: boolean
  /** No se pudo guardar en este navegador (modo privado, sin espacio…). */
  storageError: boolean
  /** Perfil con el que se usa la app en este dispositivo. */
  me: Member | undefined
  setMeId: (id: string | null) => void
  can: (perm: Permission) => boolean
  memberById: (id: string | null | undefined) => Member | undefined
  update: (fn: (d: AppData) => AppData) => void
  upsert: <K extends ListKey>(key: K, item: ListItem<K>) => void
  upsertMany: <K extends ListKey>(key: K, items: ListItem<K>[]) => void
  remove: <K extends ListKey>(key: K, id: string) => void
  /** Sustituye todos los datos (copia de seguridad, datos de ejemplo, borrar). */
  replaceData: (data: AppData) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => emptyData())
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [meId, setMeIdState] = useState<string | null>(() => loadMeId())
  const dirty = useRef(false)

  useEffect(() => {
    let cancelled = false
    loadData()
      .then((stored) => {
        if (!cancelled && stored) setData(normalizeData(stored))
      })
      .catch(() => {
        if (!cancelled) setStorageError(true)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready || !dirty.current) return
    saveData(data)
      .then(() => setStorageError(false))
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

  const replaceData = useCallback((next: AppData) => {
    // Quien llama ya ha guardado (o borrado) los datos en IndexedDB.
    dirty.current = false
    setData(next)
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
    [data, ready, storageError, me, setMeId, can, memberById, update, upsert, upsertMany, remove, replaceData],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}
