import { useState } from 'react'
import { useData } from '../context/DataContext'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function Settings() {
  const { players, matches, loadSampleData, resetAllData } = useData()
  const [confirmSample, setConfirmSample] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-[34px] font-semibold tracking-[-0.03em]" style={{ color: 'var(--ap-ink)' }}>Ajustes</h1>

      {message && (
        <p className="mb-4 rounded-[12px] px-3.5 py-2.5 text-[15px] font-medium" style={{ backgroundColor: 'var(--win-bg)', color: 'var(--win)' }}>{message}</p>
      )}

      <div className="ap-card p-6">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-ink-3)' }}>Datos actuales</h2>
        <p className="mt-1.5 text-[15px]" style={{ color: 'var(--ap-ink-2)' }}>
          {players.length} jugadores registrados y {matches.length} partidos guardados en este dispositivo.
        </p>
      </div>

      <div className="ap-card mt-4 p-6">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ap-ink-3)' }}>Datos de ejemplo</h2>
        <p className="mt-1.5 text-[15px]" style={{ color: 'var(--ap-ink-2)' }}>
          Carga un grupo de ejemplo con jugadores y partidos ya jugados para probar la app. Esto sustituye
          todos los datos actuales.
        </p>
        <button type="button" onClick={() => setConfirmSample(true)} className="ap-btn ap-btn-primary mt-4">
          Cargar datos de ejemplo
        </button>
      </div>

      <div className="ap-card mt-4 p-6" style={{ borderColor: 'var(--loss-border)' }}>
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--loss)' }}>Zona de peligro</h2>
        <p className="mt-1.5 text-[15px]" style={{ color: 'var(--ap-ink-2)' }}>
          Borra todos los jugadores y partidos para empezar desde cero con tu grupo real. Esta acción no se
          puede deshacer.
        </p>
        <button type="button" onClick={() => setConfirmReset(true)} className="ap-btn ap-btn-danger mt-4">
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
