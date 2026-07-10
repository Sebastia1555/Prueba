import { useState } from 'react'
import type { Player } from '../types'
import { useData } from '../context/DataContext'
import { Modal } from './Modal'

const CREATE_NEW = '__create_new__'

interface PlayerSelectProps {
  label: string
  players: Player[]
  value: string
  onChange: (id: string) => void
  excludeIds?: string[]
}

export function PlayerSelect({ label, players, value, onChange, excludeIds = [] }: PlayerSelectProps) {
  const { addPlayer } = useData()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const excludedSet = new Set(excludeIds.filter((id) => id !== value))

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === CREATE_NEW) {
      setCreating(true)
      return
    }
    onChange(val)
  }

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      setError('Escribe un nombre para el jugador.')
      return
    }
    const alreadyExists = players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    if (alreadyExists) {
      setError('Ya existe un jugador con ese nombre.')
      return
    }
    const created = addPlayer(trimmed)
    onChange(created.id)
    setNewName('')
    setError('')
    setCreating(false)
  }

  return (
    <div>
      <label className="ap-label">{label}</label>
      <select value={value} onChange={handleSelect} className="ap-input">
        <option value="" disabled>
          Selecciona un jugador…
        </option>
        {sortedPlayers.map((p) => (
          <option key={p.id} value={p.id} disabled={excludedSet.has(p.id)}>
            {p.name}
            {excludedSet.has(p.id) ? ' (ya seleccionado)' : ''}
          </option>
        ))}
        <option value={CREATE_NEW}>+ Añadir jugador nuevo…</option>
      </select>

      <Modal
        open={creating}
        onClose={() => {
          setCreating(false)
          setError('')
          setNewName('')
        }}
        title="Nuevo jugador"
        maxWidth="max-w-sm"
      >
        <div>
          <label className="ap-label">Nombre</label>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
            placeholder="Ej. Sara"
            className="ap-input"
          />
          {error && <p className="mt-2 text-[13px]" style={{ color: 'var(--loss)' }}>{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false)
                setError('')
                setNewName('')
              }}
              className="ap-btn ap-btn-sm ap-btn-neutral"
            >
              Cancelar
            </button>
            <button type="button" onClick={handleCreate} className="ap-btn ap-btn-sm ap-btn-primary">
              Crear y seleccionar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
