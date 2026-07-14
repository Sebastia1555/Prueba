import { Link, useParams } from 'react-router-dom'
import { useMarket } from '../context/MarketContext'
import { PriceChart } from '../components/PriceChart'
import { ChangeBadge } from '../components/ChangeBadge'
import { formatChange, formatTime, formatUsd, trendColor } from '../lib/format'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ap-card px-4 py-3">
      <div className="text-[13px] text-[color:var(--ap-ink-3)]">{label}</div>
      <div className="mt-0.5 text-[17px] font-semibold tabular-nums text-[color:var(--ap-ink)]">{value}</div>
    </div>
  )
}

export function StockDetail() {
  const { symbol = '' } = useParams()
  const sym = symbol.toUpperCase()
  const { quotes, series, isInList, addSymbol, removeSymbol, connection } = useMarket()

  const quote = quotes[sym]
  const points = series[sym] ?? []
  const inList = isInList(sym)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/" className="ap-link text-[15px]">
        ‹ Volver al mercado
      </Link>

      {!quote ? (
        <div className="ap-card mt-4 p-10 text-center text-[color:var(--ap-ink-3)]">
          {connection === 'connecting' ? `Cargando ${sym}…` : `Sin datos para ${sym}.`}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[32px] font-semibold tracking-[-0.03em]">{sym}</h1>
              <div className="mt-1 flex items-center gap-3">
                <span
                  className="text-[34px] font-semibold tabular-nums tracking-[-0.03em]"
                  style={{ color: 'var(--ap-ink)' }}
                >
                  {formatUsd(quote.price)}
                </span>
                <ChangeBadge changePct={quote.changePct} size="lg" />
              </div>
              <div
                className="mt-1 text-[15px] font-medium tabular-nums"
                style={{ color: trendColor(quote.change) }}
              >
                {formatChange(quote.change)} hoy · Actualizado {formatTime(quote.updatedAt)}
              </div>
            </div>

            {inList ? (
              <button
                type="button"
                className="ap-btn ap-btn-neutral ap-btn-sm"
                onClick={() => removeSymbol(sym)}
              >
                En tu lista ✓
              </button>
            ) : (
              <button
                type="button"
                className="ap-btn ap-btn-primary ap-btn-sm"
                onClick={() => addSymbol(sym)}
              >
                + Añadir a mi lista
              </button>
            )}
          </div>

          <div className="ap-card mt-5 p-4">
            <PriceChart data={points} color={trendColor(quote.change)} prevClose={quote.prevClose} />
            <div className="mt-1 text-center text-[12px] text-[color:var(--ap-ink-3)]">
              Evolución de la sesión en vivo
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Apertura" value={formatUsd(quote.open)} />
            <Stat label="Máximo" value={formatUsd(quote.high)} />
            <Stat label="Mínimo" value={formatUsd(quote.low)} />
            <Stat label="Cierre ant." value={formatUsd(quote.prevClose)} />
          </div>
        </>
      )}
    </div>
  )
}
