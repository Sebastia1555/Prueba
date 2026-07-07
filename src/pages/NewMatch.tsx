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
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Registrar nuevo partido</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {justSaved && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            Partido guardado. Redirigiendo al historial…
          </p>
        )}
        <MatchForm onSubmit={handleSubmit} submitLabel="Guardar partido" />
      </div>
    </div>
  )
}
