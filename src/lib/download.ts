import { IS_PREVIEW } from './env'
import { downloadBlob } from './labels'

export type DownloadResult = 'saved' | 'declined' | 'unavailable'

interface DownloadsCapability {
  save(req: { filename: string; data: Blob }): Promise<{ status: string }>
}

/**
 * Ofrece un archivo para guardar. En la vista previa pasa por la capacidad
 * `downloads` del visor (que pide confirmación); en la app normal es una
 * descarga directa.
 */
export async function offerDownload(blob: Blob, fileName: string): Promise<DownloadResult> {
  if (!IS_PREVIEW) {
    downloadBlob(blob, fileName)
    return 'saved'
  }
  let downloads: DownloadsCapability | null = null
  try {
    downloads = ((await window.claude?.use('downloads')) as DownloadsCapability | null) ?? null
  } catch {
    downloads = null
  }
  if (!downloads) return 'unavailable'
  try {
    await downloads.save({ filename: fileName, data: blob })
    return 'saved'
  } catch (e) {
    return (e as { code?: string })?.code === 'declined' ? 'declined' : 'unavailable'
  }
}

/** Mensaje para el usuario según el resultado (null si no hace falta decir nada). */
export function downloadMessage(result: DownloadResult): string | null {
  if (result === 'unavailable') return 'No se puede descargar este archivo aquí. En la app instalada sí se puede.'
  return null
}
