import type { ConnectionState } from '../types'

const LABELS: Record<ConnectionState, string> = {
  connecting: 'Conectando…',
  live: 'En vivo',
  demo: 'Demo',
  offline: 'Sin conexión',
}

const COLORS: Record<ConnectionState, string> = {
  connecting: 'var(--warn)',
  live: 'var(--win)',
  demo: 'var(--ap-blue)',
  offline: 'var(--loss)',
}

/** Indicador de estado de la conexión de datos, con punto pulsante en vivo. */
export function ConnectionDot({ state }: { state: ConnectionState }) {
  const color = COLORS[state]
  const pulsing = state === 'live' || state === 'demo'
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[13px] font-medium"
      style={{ color }}
    >
      <span className="relative inline-flex h-2 w-2">
        {pulsing && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: color, animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite' }}
          />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </span>
      {LABELS[state]}
    </span>
  )
}
