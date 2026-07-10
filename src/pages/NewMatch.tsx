import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { MatchForm, type MatchFormValues } from '../components/MatchForm'

export function NewMatch() {
  const { addMatch } = useData()
  const navigate = useNavigate()
  const [justSaved, setJustSaved] = useState(false)

  const handleSubmit = (values: MatchFormValues) => {
    addMatch(values)
    setJustSaved(true)
    setTimeout(() => navigate('/historial'), 600)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-[34px] font-semibold tracking-[-0.03em]" style={{ color: 'var(--ap-ink)' }}>Registrar nuevo partido</h1>
      <div className="ap-card p-5 sm:p-7">
        {justSaved && (
          <p className="mb-5 rounded-[12px] px-3.5 py-2.5 text-[15px] font-medium" style={{ backgroundColor: 'var(--win-bg)', color: 'var(--win)' }}>
            Partido guardado. Redirigiendo al historial…
          </p>
        )}
        <MatchForm onSubmit={handleSubmit} submitLabel="Guardar partido" />
      </div>
    </div>
  )
}
