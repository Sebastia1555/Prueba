// Iconos SVG en línea (sin dependencias externas). Trazo fino para un aire elegante.
type IconProps = { className?: string }

const base = 'h-full w-full'

export function Icon({ name, className }: { name: string; className?: string }) {
  const props: IconProps = { className: className ?? base }
  switch (name) {
    case 'frame':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <rect x="7" y="7" width="10" height="10" />
        </svg>
      )
    case 'arch':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <path d="M4 21V11a8 8 0 0 1 16 0v10" />
          <path d="M4 21h16" />
        </svg>
      )
    case 'column':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <path d="M5 6h14M4 6v-1M20 6v-1M6 6v13M18 6v13M4 21h16" />
          <path d="M9 8v9M12 8v9M15 8v9" strokeWidth="1" />
        </svg>
      )
    case 'balustrade':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <path d="M3 5h18M3 20h18" />
          <path d="M7 8c0 2-2 2-2 4s2 2 2 4M12 8c0 2-2 2-2 4s2 2 2 4M17 8c0 2-2 2-2 4s2 2 2 4" strokeWidth="1.2" />
        </svg>
      )
    case 'wall':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <path d="M3 4h18v16H3z" />
          <path d="M3 9h18M3 14h18M9 4v5M15 9v5M9 14v6M15 14v6" strokeWidth="1.1" />
        </svg>
      )
    case 'counter':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <path d="M3 9h18v3H3z" />
          <path d="M5 12v8M19 12v8M9 15h6" />
        </svg>
      )
    case 'quarry':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <path d="m3 20 5-9 4 5 3-4 6 8z" />
          <path d="M3 20h18" />
        </svg>
      )
    case 'hand':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <path d="M6 12V7a2 2 0 0 1 4 0v4V4a2 2 0 0 1 4 0v6V6a2 2 0 0 1 4 0v8a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a2 2 0 0 1 3-2l0 0" />
        </svg>
      )
    case 'gear':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </svg>
      )
    case 'ruler':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
          <path d="M3 15 15 3l6 6L9 21z" />
          <path d="M7 11l2 2M11 7l2 2M15 11l1 1" strokeWidth="1.1" />
        </svg>
      )
    case 'phone':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
          <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" />
        </svg>
      )
    case 'mail':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      )
    case 'pin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
          <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    default:
      return null
  }
}

export function Logo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="4" className="fill-mares-600" />
      <path d="M11 27 20 10l9 17z" className="fill-mares-100" />
      <path d="M15 27h10l-5-9z" className="fill-mares-600" />
    </svg>
  )
}
