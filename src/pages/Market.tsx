import { Link } from 'react-router-dom'
import { useMarket } from '../context/MarketContext'
import { SearchBar } from '../components/SearchBar'
import { QuoteCard } from '../components/QuoteCard'

export function Market() {
  const { watchlist, quotes, series, removeSymbol, hasKey, error } = useMarket()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Mercado</h1>
        <p className="mt-1 text-[15px] text-[color:var(--ap-ink-2)]">
          Cotizaciones en tiempo real de tus valores favoritos.
        </p>
      </div>

      <div className="mb-5">
        <SearchBar />
      </div>

      {error && (
        <div
          className="mb-4 rounded-[var(--r-md)] px-4 py-3 text-[14px]"
          style={{ background: 'var(--loss-bg)', color: 'var(--loss)', border: '1px solid var(--loss-border)' }}
        >
          {error}
        </div>
      )}

      {!hasKey && (
        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-md)] px-4 py-3 text-[14px]"
          style={{ background: 'var(--ap-pearl)', color: 'var(--ap-ink-2)', border: '1px solid var(--ap-hairline-soft)' }}
        >
          <span>
            Estás en <strong>modo demo</strong> con datos simulados. Conecta una clave gratuita de Finnhub para
            datos reales en vivo.
          </span>
          <Link to="/ajustes" className="ap-btn ap-btn-primary ap-btn-sm shrink-0">
            Conectar datos reales
          </Link>
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="ap-card p-10 text-center">
          <p className="text-[17px] text-[color:var(--ap-ink-2)]">Tu lista está vacía.</p>
          <p className="mt-1 text-[15px] text-[color:var(--ap-ink-3)]">
            Busca una acción arriba para empezar a seguirla.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlist.map((symbol) => {
            const q = quotes[symbol]
            if (!q) {
              return (
                <div
                  key={symbol}
                  className="ap-card flex h-[172px] items-center justify-center p-4 text-[color:var(--ap-ink-3)]"
                >
                  Cargando {symbol}…
                </div>
              )
            }
            return (
              <QuoteCard
                key={symbol}
                quote={q}
                series={series[symbol] ?? []}
                onRemove={removeSymbol}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
