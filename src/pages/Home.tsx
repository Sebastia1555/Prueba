import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MainPickCard } from '../components/MainPickCard'
import { AltPickCard } from '../components/AltPickCard'
import { NoBuyToday } from '../components/NoBuyToday'
import { WatchlistRow } from '../components/WatchlistRow'
import { Disclaimer } from '../components/Disclaimer'
import { formatLongDate } from '../lib/format'

function MarketVerdict({
  hasOpportunity,
  eligibleCount,
  analyzed,
  qualityPassed,
}: {
  hasOpportunity: boolean
  eligibleCount: number
  analyzed: number
  qualityPassed: number
}) {
  const color = hasOpportunity ? 'var(--win)' : 'var(--warn)'
  const bg = hasOpportunity ? 'var(--win-bg)' : 'var(--warn-bg)'
  const border = hasOpportunity ? 'var(--win-border)' : 'var(--warn-border)'
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--r-md)] px-4 py-2.5 text-[14px]"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      <span className="font-semibold">
        {hasOpportunity
          ? `${eligibleCount} ${eligibleCount === 1 ? 'oportunidad' : 'oportunidades'} con margen de seguridad`
          : 'Sin oportunidades hoy'}
      </span>
      <span style={{ color: 'var(--ap-ink-3)' }}>
        {analyzed} valores analizados · {qualityPassed} pasan calidad
      </span>
    </div>
  )
}

export function Home() {
  const { loading, error, date, recommendation } = useApp()
  const [toast, setToast] = useState<string | null>(null)

  const handleRegister = (ticker: string) => {
    setToast(`Registrar compra de ${ticker} — el registro de operaciones llega en la Fase 2.`)
    window.setTimeout(() => setToast(null), 3200)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[color:var(--ap-ink-3)]">
        <div className="mb-3 text-[15px]">Analizando el S&P 500…</div>
        <div className="mx-auto h-1 w-40 overflow-hidden rounded-full" style={{ background: 'var(--ap-hairline-soft)' }}>
          <div className="h-full w-1/3 rounded-full" style={{ background: 'var(--ap-blue)', animation: 'slide 1.1s ease-in-out infinite' }} />
        </div>
      </div>
    )
  }

  if (error || !recommendation) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[color:var(--loss)]">
        {error ?? 'No se pudo generar la recomendación.'}
      </div>
    )
  }

  const rec = recommendation

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Encabezado */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em]">Recomendación del día</h1>
          <p className="mt-0.5 text-[15px] capitalize text-[color:var(--ap-ink-2)]">
            {formatLongDate(date)}
          </p>
        </div>
      </div>

      <div className="mb-5">
        <MarketVerdict
          hasOpportunity={rec.hasOpportunity}
          eligibleCount={rec.eligibleCount}
          analyzed={rec.analyzed}
          qualityPassed={rec.qualityPassed}
        />
      </div>

      {/* Pick principal o mensaje de disciplina */}
      {rec.hasOpportunity && rec.main ? (
        <MainPickCard pick={rec.main} onRegister={handleRegister} />
      ) : (
        <NoBuyToday analyzed={rec.analyzed} qualityPassed={rec.qualityPassed} />
      )}

      {/* Alternativas */}
      {rec.alternatives.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[19px] font-semibold tracking-[-0.02em]">Alternativas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {rec.alternatives.map((a) => (
              <AltPickCard key={a.ticker} pick={a} />
            ))}
          </div>
        </div>
      )}

      {/* Watchlist */}
      {rec.watchlist.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-1 text-[19px] font-semibold tracking-[-0.02em]">
            En la lista de la compra
          </h2>
          <p className="mb-3 text-[14px] text-[color:var(--ap-ink-2)]">
            Negocios excelentes que aún no están baratos. Esperando a que caigan.
          </p>
          <div className="ap-card overflow-hidden">
            {rec.watchlist.map((a) => (
              <WatchlistRow key={a.ticker} pick={a} />
            ))}
          </div>
        </div>
      )}

      <Disclaimer />

      {toast && (
        <div
          className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90%] rounded-full px-5 py-3 text-[14px] text-white shadow-[var(--shadow-product)]"
          style={{ background: 'var(--ap-ink)' }}
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
