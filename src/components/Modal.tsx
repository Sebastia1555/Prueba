import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

// Pila de modales abiertos: Escape solo cierra el de más arriba, y el scroll
// de la página se bloquea mientras haya alguno abierto (sea cual sea el orden
// en que se cierren).
const stack: string[] = []
let overflowBeforeLock = ''

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const id = useId()
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    if (stack.length === 0) {
      overflowBeforeLock = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    stack.push(id)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const i = stack.lastIndexOf(id)
      if (i >= 0) stack.splice(i, 1)
      if (stack.length === 0) document.body.style.overflow = overflowBeforeLock
    }
  }, [open, id])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-t-[22px] sm:rounded-[22px] bg-white animate-in`}
        style={{ boxShadow: 'var(--shadow-product)' }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-5 py-4 rounded-t-[22px]"
          style={{ borderColor: 'var(--ap-hairline-soft)' }}
        >
          <h2 className="min-w-0 truncate text-[21px] font-semibold tracking-[-0.02em] text-[color:var(--ap-ink)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-full p-1.5 text-[color:var(--ap-ink-3)] hover:bg-black/5 hover:text-[color:var(--ap-ink)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
