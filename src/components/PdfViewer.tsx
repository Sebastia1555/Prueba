import { useEffect, useRef, useState } from 'react'

// pdf.js se carga bajo demanda desde cdnjs la primera vez que se abre un PDF.
// El "worker" se carga como script normal y pdf.js lo usa en el hilo
// principal: así funciona también dentro de visores que no permiten workers
// externos ni visores de PDF incrustados.
const PDFJS_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/'
const MAX_PAGES = 20

interface PdfViewport {
  width: number
  height: number
}
interface PdfPage {
  getViewport(opts: { scale: number }): PdfViewport
  render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }): { promise: Promise<void> }
}
interface PdfDocument {
  numPages: number
  getPage(n: number): Promise<PdfPage>
  destroy(): Promise<void>
}
interface PdfJs {
  getDocument(opts: { data: Uint8Array; isEvalSupported: boolean }): { promise: Promise<PdfDocument> }
}

declare global {
  interface Window {
    pdfjsLib?: PdfJs
  }
}

let loader: Promise<PdfJs> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    document.head.appendChild(s)
  })
}

function loadPdfJs(): Promise<PdfJs> {
  if (!loader) {
    loader = (async () => {
      await loadScript(`${PDFJS_BASE}pdf.min.js`)
      await loadScript(`${PDFJS_BASE}pdf.worker.min.js`)
      if (!window.pdfjsLib) throw new Error('pdf.js no disponible')
      return window.pdfjsLib
    })()
    loader.catch(() => {
      loader = null
    })
  }
  return loader
}

/** Muestra las páginas de un PDF como imágenes. Llama a `onError` si no puede. */
export function PdfViewer({ blob, onError }: { blob: Blob; onError: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [total, setTotal] = useState(0)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })

  useEffect(() => {
    let cancelled = false
    let doc: PdfDocument | null = null
    const container = ref.current
    ;(async () => {
      try {
        const lib = await loadPdfJs()
        const data = new Uint8Array(await blob.arrayBuffer())
        doc = await lib.getDocument({ data, isEvalSupported: false }).promise
        if (cancelled || !container) return
        container.replaceChildren()
        // El contenedor está oculto hasta pintar la primera página: se mide el padre.
        const width = Math.max(200, (container.parentElement?.clientWidth || 600) - 18)
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const pages = Math.min(doc.numPages, MAX_PAGES)
        for (let i = 1; i <= pages; i++) {
          const page = await doc.getPage(i)
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: (width / base.width) * dpr })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.width = '100%'
          canvas.style.display = 'block'
          canvas.style.background = '#fff'
          canvas.setAttribute('aria-label', `Página ${i}`)
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('canvas no disponible')
          container.appendChild(canvas)
          await page.render({ canvasContext: ctx, viewport }).promise
          if (cancelled) return
          if (i === 1) setStatus('ready')
        }
        setTotal(doc.numPages)
      } catch {
        if (!cancelled) onErrorRef.current()
      }
    })()
    return () => {
      cancelled = true
      void doc?.destroy().catch(() => undefined)
    }
  }, [blob])

  return (
    <div>
      {status === 'loading' && <p className="py-10 text-center text-[color:var(--ap-ink-3)]">Abriendo el PDF…</p>}
      <div
        ref={ref}
        className="max-h-[60vh] space-y-3 overflow-y-auto rounded-[12px] border p-2"
        style={{ borderColor: 'var(--ap-hairline-soft)', backgroundColor: 'var(--ap-parchment)', display: status === 'ready' ? undefined : 'none' }}
      />
      {total > MAX_PAGES && (
        <p className="mt-2 text-[13px] text-[color:var(--ap-ink-3)]">
          Se muestran las {MAX_PAGES} primeras páginas de {total}. Descárgalo para verlo entero.
        </p>
      )}
    </div>
  )
}
