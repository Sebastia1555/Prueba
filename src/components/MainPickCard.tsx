import type { Analysis } from '../types'
import { ConvictionBadge } from './ConvictionBadge'
import { ScoreMeter } from './ScoreMeter'
import { Metric } from './Metric'
import {
  formatNumber,
  formatPctFrac,
  formatPctSigned,
  formatUsd,
  trendColor,
} from '../lib/format'

interface Props {
  pick: Analysis
  onRegister?: (ticker: string) => void
}

/** Tarjeta "hero" de la recomendación principal del día. */
export function MainPickCard({ pick, onRegister }: Props) {
  const v = pick.valuation
  const q = pick.quality
  const t = pick.timing

  return (
    <section
      className="ap-card overflow-hidden"
      style={{ boxShadow: 'var(--shadow-product)' }}
    >
      {/* Cabecera */}
      <div
        className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-5"
        style={{ borderColor: 'var(--ap-hairline-soft)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ap-blue)]">
              Recomendación del día
            </span>
          </div>
          <h2 className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.03em]">
            {pick.ticker}
          </h2>
          <p className="mt-1 text-[15px] text-[color:var(--ap-ink-2)]">
            {pick.name} · {pick.sector}
          </p>
        </div>
        <ConvictionBadge conviction={pick.conviction} />
      </div>

      {/* Tesis */}
      <div className="px-6 pt-5">
        <p className="text-[17px] leading-relaxed text-[color:var(--ap-ink)]">{pick.thesis}</p>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-2 gap-4 px-6 py-5 sm:grid-cols-4">
        <Metric label="Precio" value={formatUsd(pick.price)} />
        <Metric label="Valor intrínseco" value={formatUsd(v.intrinsicValue)} />
        <Metric
          label="Margen de seguridad"
          value={formatPctFrac(v.marginOfSafety)}
          color="var(--win)"
        />
        <Metric
          label="Desde máximos"
          value={`−${formatPctFrac(t.drawdownFrom52wHigh)}`}
          color={trendColor(-1)}
        />
      </div>

      {/* Scores */}
      <div
        className="grid grid-cols-1 gap-x-8 gap-y-3 border-t px-6 py-5 sm:grid-cols-2"
        style={{ borderColor: 'var(--ap-hairline-soft)' }}
      >
        <ScoreMeter label="Calidad" weightLabel="· 45%" value={pick.scores.quality} />
        <ScoreMeter label="Valoración" weightLabel="· 40%" value={pick.scores.valuation} />
        <ScoreMeter label="Timing" weightLabel="· 15%" value={pick.scores.timing} />
        <ScoreMeter label="Puntuación total" value={pick.scores.total} emphasis />
      </div>

      {/* Datos de apoyo */}
      <div
        className="flex flex-wrap gap-x-6 gap-y-1 border-t px-6 py-4 text-[13px] text-[color:var(--ap-ink-2)]"
        style={{ borderColor: 'var(--ap-hairline-soft)' }}
      >
        <span>ROIC medio 10a: <strong className="tabular-nums">{formatNumber(q.avgRoic10y, 0)}%</strong></span>
        <span>Deuda/EBITDA: <strong className="tabular-nums">{formatNumber(q.debtToEbitda, 1)}</strong></span>
        <span>FCF+ : <strong className="tabular-nums">{q.fcfPositiveYears}/10 años</strong></span>
        <span>BPA 10a: <strong className="tabular-nums">{formatPctSigned(q.epsCagr, 0)}/año</strong></span>
        <span>vs media 200s: <strong className="tabular-nums">{formatPctSigned(t.pctVs200dma * 100, 0)}</strong></span>
      </div>

      {/* CTA */}
      <div
        className="flex items-center justify-between gap-3 border-t px-6 py-4"
        style={{ borderColor: 'var(--ap-hairline-soft)' }}
      >
        <span className="text-[13px] text-[color:var(--ap-ink-3)]">
          Cotiza por debajo de su valor con negocio intacto.
        </span>
        <button
          type="button"
          className="ap-btn ap-btn-primary"
          onClick={() => onRegister?.(pick.ticker)}
        >
          Registrar compra
        </button>
      </div>
    </section>
  )
}
