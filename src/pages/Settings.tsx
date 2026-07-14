import { useState } from 'react'
import { useMarket } from '../context/MarketContext'
import { ConnectionDot } from '../components/ConnectionDot'

export function Settings() {
  const { apiKey, setApiKey, connection, hasKey } = useMarket()
  const [draft, setDraft] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  const save = () => {
    setApiKey(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const disconnect = () => {
    setDraft('')
    setApiKey('')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Ajustes</h1>
      <p className="mt-1 text-[15px] text-[color:var(--ap-ink-2)]">
        Conecta una fuente de datos real en vivo.
      </p>

      <div className="ap-card mt-5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[19px] font-semibold">Datos en tiempo real</h2>
          <ConnectionDot state={connection} />
        </div>

        <p className="text-[15px] leading-relaxed text-[color:var(--ap-ink-2)]">
          Esta app usa la API gratuita de{' '}
          <a
            className="ap-link"
            href="https://finnhub.io/register"
            target="_blank"
            rel="noreferrer"
          >
            Finnhub
          </a>
          , que ofrece cotizaciones en tiempo real de acciones de EE. UU. vía WebSocket. Crea una cuenta
          gratis, copia tu <strong>API key</strong> y pégala aquí. Se guarda solo en este navegador.
        </p>

        <ol className="mt-3 list-decimal space-y-1 pl-5 text-[14px] text-[color:var(--ap-ink-2)]">
          <li>
            Entra en{' '}
            <a className="ap-link" href="https://finnhub.io/register" target="_blank" rel="noreferrer">
              finnhub.io/register
            </a>{' '}
            y regístrate (gratis).
          </li>
          <li>Copia la API key de tu panel.</li>
          <li>Pégala abajo y pulsa «Conectar».</li>
        </ol>

        <label className="ap-label mt-4" htmlFor="apikey">
          API key de Finnhub
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="apikey"
            className="ap-input flex-1"
            style={{ minWidth: 220 }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="p. ej. cq1a2b3r01q..."
            autoComplete="off"
            spellCheck={false}
            type="password"
          />
          <button
            type="button"
            className="ap-btn ap-btn-primary"
            onClick={save}
            disabled={!draft.trim() || draft.trim() === apiKey}
          >
            {saved ? '✓ Conectado' : 'Conectar'}
          </button>
        </div>

        {hasKey && (
          <div className="mt-3 flex items-center justify-between text-[14px]">
            <span style={{ color: 'var(--win)' }}>Clave conectada.</span>
            <button type="button" className="ap-btn ap-btn-danger-quiet ap-btn-sm" onClick={disconnect}>
              Desconectar (volver a demo)
            </button>
          </div>
        )}

        {!hasKey && (
          <p className="mt-3 text-[13px] text-[color:var(--ap-ink-3)]">
            Sin clave, la app funciona en <strong>modo demo</strong> con datos simulados realistas.
          </p>
        )}
      </div>

      <div className="ap-card mt-4 p-5 text-[14px] text-[color:var(--ap-ink-2)]">
        <h2 className="mb-2 text-[17px] font-semibold text-[color:var(--ap-ink)]">Nota sobre los datos</h2>
        <p className="leading-relaxed">
          El plan gratuito de Finnhub cubre acciones y ETFs de EE. UU. (AAPL, TSLA, SPY…). Los precios llegan
          por WebSocket durante el horario de mercado; fuera de sesión se muestra la última cotización
          disponible. El gráfico se construye en vivo con los ticks recibidos durante tu sesión.
        </p>
      </div>
    </div>
  )
}
