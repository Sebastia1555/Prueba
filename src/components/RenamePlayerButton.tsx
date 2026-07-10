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
        className="ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-[color:var(--ap-ink-3)] hover:bg-black/5 hover:text-[color:var(--ap-ink)] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Renombrar jugador" maxWidth="max-w-sm">
        <div>
          <label className="ap-label">Nombre</label>
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
            className="ap-input"
          />
          {error && <p className="mt-2 text-[13px]" style={{ color: 'var(--loss)' }}>{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="ap-btn ap-btn-sm ap-btn-neutral">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} className="ap-btn ap-btn-sm ap-btn-primary">
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
