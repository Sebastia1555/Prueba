import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Modal } from './Modal'

export function RenamePlayerButton({ playerId, currentName }: { playerId: string; currentName: string }) {
  const { renamePlayer, players } = useData()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('El nombre no puede estar vacío.')
      return
    }
    const duplicate = players.some(
      (p) => p.id !== playerId && p.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      setError('Ya existe otro jugador con ese nombre.')
      return
    }
    renamePlayer(playerId, trimmed)
    setOpen(false)
    setError('')
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setName(currentName)
          setError('')
          setOpen(true)
        }}
        aria-label={`Renombrar a ${currentName}`}
        className="ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Renombrar jugador" maxWidth="max-w-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
