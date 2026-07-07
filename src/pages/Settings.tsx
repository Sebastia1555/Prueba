import { useState } from 'react'
import { useData } from '../context/DataContext'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function Settings() {
  const { players, matches, loadSampleData, resetAllData } = useData()
  const [confirmSample, setConfirmSample] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Ajustes</h1>

      {message && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Datos actuales</h2>
        <p className="mt-1 text-sm text-slate-600">
          {players.length} jugadores registrados y {matches.length} partidos guardados en este dispositivo.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Datos de ejemplo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Carga un grupo de ejemplo con jugadores y partidos ya jugados para probar la app. Esto sustituye
          todos los datos actuales.
        </p>
        <button
          type="button"
          onClick={() => setConfirmSample(true)}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Cargar datos de ejemplo
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-600">Zona de peligro</h2>
        <p className="mt-1 text-sm text-slate-600">
          Borra todos los jugadores y partidos para empezar desde cero con tu grupo real. Esta acción no se
          puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
        >
          Borrar todos los datos
        </button>
      </div>

      <ConfirmDialog
        open={confirmSample}
        title="Cargar datos de ejemplo"
        message="Se sustituirán los jugadores y partidos actuales por un grupo de ejemplo (9 jugadores, 20 partidos). ¿Continuar?"
        confirmLabel="Cargar ejemplo"
        onConfirm={() => {
          loadSampleData()
          setConfirmSample(false)
          setMessage('Datos de ejemplo cargados correctamente.')
        }}
        onCancel={() => setConfirmSample(false)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Borrar todos los datos"
        message="Se eliminarán permanentemente todos los jugadores y partidos guardados. ¿Seguro que quieres continuar?"
        confirmLabel="Borrar todo"
        danger
        onConfirm={() => {
          resetAllData()
          setConfirmReset(false)
          setMessage('Todos los datos han sido borrados. Puedes empezar a registrar tu grupo real.')
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
