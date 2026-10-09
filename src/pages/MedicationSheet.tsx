import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { addDays, dateRange, formatDate, formatDayShort, startOfWeek, todayISO, WEEKDAYS } from '../lib/dates'
import { formatAmount, isScheduledOn, scheduleSummary } from '../lib/medication'
import { Icon } from '../components/Icon'
import { Checkbox } from '../components/ui'

/** Hoja de medicación para imprimir (nevera, cuidadora, urgencias). */
export function MedicationSheet() {
  const { data } = useData()
  const [withLog, setWithLog] = useState(true)
  const today = todayISO()
  const meds = data.medications.filter((m) => m.active && (!m.endDate || m.endDate >= today))
  const scheduled = meds.filter((m) => !m.asNeeded && m.doses.length)
  const prn = meds.filter((m) => m.asNeeded)
  const times = [...new Set(scheduled.flatMap((m) => m.doses.map((d) => d.time)))].sort()
  const weekFrom = startOfWeek(today)
  const week = dateRange(weekFrom, addDays(weekFrom, 6))
  const rows = times.flatMap((time) =>
    scheduled
      .filter((m) => m.doses.some((d) => d.time === time))
      .map((m) => ({ time, med: m, amount: m.doses.find((d) => d.time === time)!.amount })),
  )

  return (
    <div className="print-sheet">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/medicacion?vista=pauta" className="ap-btn ap-btn-sm ap-btn-quiet">
          <Icon name="chevronLeft" size={16} /> Volver
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox checked={withLog} onChange={setWithLog}>
            Incluir registro semanal
          </Checkbox>
          <button type="button" className="ap-btn ap-btn-sm ap-btn-primary" onClick={() => window.print()}>
            <Icon name="printer" size={16} /> Imprimir
          </button>
        </div>
      </div>

      <div className="ap-card p-5 sm:p-7 print:border-0 print:p-0">
        <h1 className="text-[26px]">Hoja de medicación</h1>
        <p className="text-[17px] font-semibold">{data.patient.name}</p>
        <p className="text-[14px] text-[color:var(--ap-ink-2)]">Actualizada el {formatDate(today)}</p>
        {data.patient.allergies && (
          <p className="mt-3 rounded-[10px] px-3 py-2 text-[15px]" style={{ backgroundColor: 'var(--loss-bg)', color: 'var(--loss)' }}>
            <strong>Alergias:</strong> {data.patient.allergies}
          </p>
        )}

        {scheduled.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="sheet-table w-full text-[14px]">
              <thead>
                <tr>
                  <th className="text-left">Medicamento</th>
                  {times.map((t) => (
                    <th key={t}>{t}</th>
                  ))}
                  <th className="text-left">Indicaciones</th>
                </tr>
              </thead>
              <tbody>
                {scheduled.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>
                        {m.name} {m.strength}
                      </strong>
                      {m.purpose && <div className="text-[12px] text-[color:var(--ap-ink-2)]">{m.purpose}</div>}
                    </td>
                    {times.map((t) => {
                      const dose = m.doses.find((d) => d.time === t)
                      return (
                        <td key={t} className="text-center">
                          {dose ? formatAmount(dose.amount, m.form) : ''}
                        </td>
                      )
                    })}
                    <td>
                      {m.frequency !== 'daily' && <div className="font-medium">{scheduleSummary(m).split(' · ')[0]}</div>}
                      {m.instructions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {prn.length > 0 && (
          <div className="mt-5">
            <h2 className="text-[17px]">Solo si lo necesita</h2>
            <ul className="mt-1 list-disc pl-5 text-[14px]">
              {prn.map((m) => (
                <li key={m.id}>
                  <strong>
                    {m.name} {m.strength}
                  </strong>
                  {m.purpose && ` — ${m.purpose}`}
                  {m.instructions && `. ${m.instructions}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {withLog && rows.length > 0 && (
          <div className="mt-7 print:break-before-page">
            <h2 className="text-[17px]">
              Registro de tomas · semana del {formatDayShort(week[0])} al {formatDayShort(week[6])}
            </h2>
            <p className="text-[13px] text-[color:var(--ap-ink-2)]">Marca cada toma y pon tus iniciales.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="sheet-table w-full text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left">Hora</th>
                    <th className="text-left">Medicamento</th>
                    {WEEKDAYS.map((w, i) => (
                      <th key={w.n}>
                        {w.short} {Number(week[i].slice(8))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.time + r.med.id}>
                      <td>{r.time}</td>
                      <td>
                        {r.med.name} · {formatAmount(r.amount, r.med.form)}
                      </td>
                      {week.map((d) => (
                        <td key={d} className="h-8 min-w-[2.6rem] text-center">
                          {isScheduledOn(r.med, d) ? '' : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
