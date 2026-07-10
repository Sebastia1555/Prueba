import { useEffect, useRef, useState } from 'react'

interface InfoPopoverProps {
  label: string
  text: string
}

export function InfoPopover({ label, text }: InfoPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={`Qué significa ${label}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="ml-1.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] font-semibold leading-none transition-colors"
        style={{ backgroundColor: 'var(--ap-hairline-soft)', color: 'var(--ap-ink-2)' }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-7 z-30 w-52 -translate-x-1/2 rounded-[12px] px-3.5 py-2.5 text-left text-[13px] font-normal leading-snug text-white"
          style={{ backgroundColor: 'var(--ap-ink)', boxShadow: 'var(--shadow-product)', letterSpacing: '-0.01em' }}
        >
          {text}
        </span>
      )}
    </span>
  )
}
