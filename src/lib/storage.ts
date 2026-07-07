import type { AppData } from '../types'

const STORAGE_KEY = 'padel-tracker-data-v1'

export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.players || !parsed.matches) return null
    return parsed
  } catch {
    return null
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // almacenamiento no disponible (modo privado, cuota excedida, etc.)
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
