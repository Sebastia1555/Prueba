import { useState } from 'react'
import type { Camera, CameraKind } from '../types'
import { useData } from '../context/DataContext'
import { newId } from '../lib/labels'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { Badge, EmptyState, Field, Notice, PageHeader, Section } from '../components/ui'

const KIND_LABELS: Record<CameraKind, string> = {
  interior: 'Interior',
  puerta: 'Timbre / puerta',
  exterior: 'Exterior',
}

const PLANNED = [
  {
    emoji: '📹',
    title: 'En directo',
    text: 'Abrir cualquier cámara de la casa desde aquí, sin cambiar de app ni pedir contraseñas.',
  },
  {
    emoji: '🚪',
    title: 'Quién llama a la puerta',
    text: 'Aviso con foto cuando llaman o se abre la puerta, y queda apuntado en el diario.',
  },
  {
    emoji: '🆘',
    title: 'Avisos de caída',
    text: 'Si la cámara detecta una posible caída, o no hay movimiento a la hora habitual, avisa a quien esté de turno y a la familia.',
  },
  {
    emoji: '🎞️',
    title: 'Grabación de los avisos',
    text: 'Los momentos de cada aviso se guardan unos días para poder revisarlos con calma.',
  },
]

/**
 * Sección de cámaras: de momento muestra lo que se podrá hacer y deja apuntar
 * qué cámaras hay en casa. La vista en directo llegará cuando se conecten.
 */
export function Cameras() {
  const { data, can } = useData()
  const [editing, setEditing] = useState<Camera | 'new' | null>(null)
  const first = data.patient.name.split(' ')[0] || 'la persona cuidada'

  if (!can('viewCameras')) {
    return <Notice icon="lock">Tu rol no tiene acceso a las cámaras.</Notice>
  }

  const cameras = data.cameras
  const examples: Camera[] = [
    { id: 'ejemplo-salon', name: 'Salón (ejemplo)', kind: 'interior', model: '', viewApp: '', notes: '', createdAt: 0 },
    { id: 'ejemplo-puerta', name: 'Entrada (ejemplo)', kind: 'puerta', model: '', viewApp: '', notes: '', createdAt: 0 },
  ]

  return (
    <div>
      <PageHeader
        title="Cámaras"
        subtitle={`Ver la casa de ${first} en directo desde la app`}
        actions={<Badge tone="amber">Próximamente</Badge>}
      />

      <Notice icon="camera">
        Estamos preparando la conexión con las cámaras de casa. Mientras tanto, apuntad abajo qué cámaras hay y con qué
        app se ven hoy: así todos lo sabéis y estarán listas para conectarlas.
      </Notice>

      <Section title="Así se verá" className="mt-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(cameras.length ? cameras : examples).map((c) => (
            <li key={c.id}>
              <CameraTile camera={c} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Qué podréis hacer">
        <ul className="grid gap-3 sm:grid-cols-2">
          {PLANNED.map((f) => (
            <li key={f.title} className="ap-card flex gap-3 p-4">
              <span className="text-2xl" aria-hidden="true">
                {f.emoji}
              </span>
              <div className="min-w-0">
                <div className="text-[16px] font-semibold">{f.title}</div>
                <div className="text-[14px] text-[color:var(--ap-ink-2)]">{f.text}</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 px-1 text-[13px] text-[color:var(--ap-ink-3)]">
          La idea es conectarla con las marcas más habituales en casa (Tapo, Xiaomi, Ezviz, Ring, Google Nest…).
        </p>
      </Section>

      <Section
        title="Cámaras de la casa"
        action={
          <button type="button" className="ap-btn ap-btn-sm ap-btn-ghost" onClick={() => setEditing('new')}>
            <Icon name="plus" size={16} /> Añadir
          </button>
        }
      >
        {cameras.length === 0 ? (
          <EmptyState icon="📷" title="Aún no hay cámaras apuntadas">
            Apunta dónde está cada cámara, su marca y con qué app la veis ahora.
          </EmptyState>
        ) : (
          <ul className="ap-card divide-y overflow-hidden">
            {cameras.map((c) => (
              <li key={c.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-black/[0.02]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                    style={{ backgroundColor: '#e8f1fb', color: 'var(--ap-blue)' }}
                  >
                    <Icon name="camera" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 text-[16px] font-semibold [overflow-wrap:anywhere]">{c.name}</span>
                      <Badge>{KIND_LABELS[c.kind]}</Badge>
                    </div>
                    <div className="text-[14px] text-[color:var(--ap-ink-2)] [overflow-wrap:anywhere]">
                      {[c.model, c.viewApp && `Hoy se ve en: ${c.viewApp}`].filter(Boolean).join(' · ')}
                    </div>
                    {c.notes && <div className="text-[14px] text-[color:var(--ap-ink-3)] [overflow-wrap:anywhere]">{c.notes}</div>}
                  </div>
                  <Icon name="edit" size={18} className="mt-1 shrink-0 text-[color:var(--ap-ink-3)]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Privacidad">
        <div className="ap-card p-4 text-[15px]">
          <ul className="list-disc space-y-1.5 pl-5 text-[color:var(--ap-ink-2)]">
            <li>Contad con {first}: explicadle qué cámaras hay y para qué, y respetad su opinión siempre que pueda darla.</li>
            <li>Nada de cámaras en el baño ni en el dormitorio.</li>
            <li>
              Si hay una cuidadora contratada, la ley obliga a informarle antes, de forma clara, de que hay cámaras, dónde
              están y para qué sirven. Mejor por escrito y firmado, para poder demostrarlo.
            </li>
            <li>
              Las cámaras son para la seguridad de {first}, no para vigilar el trabajo de nadie, y nunca en la habitación
              de una cuidadora interna.
            </li>
            <li>Solo la familia con permiso podrá verlas desde la app; la cuidadora, no.</li>
          </ul>
        </div>
      </Section>

      {editing && <CameraForm camera={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

/** Recuadro de vista previa: de momento sin imagen, con el estado "sin conectar". */
function CameraTile({ camera }: { camera: Camera }) {
  return (
    <figure className="m-0">
      <div
        className="relative aspect-video max-w-full overflow-hidden rounded-[16px]"
        style={{ background: 'linear-gradient(160deg, #2a2a2e 0%, #1d1d1f 100%)' }}
        role="img"
        aria-label={`${camera.name}: vista en directo próximamente`}
      >
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#f5f5f7' }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#86868b' }} />
          Sin conectar
        </span>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5" style={{ color: '#86868b' }}>
          <Icon name="camera" size={34} />
          <span className="text-[13px]">Vista en directo próximamente</span>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-2.5 pt-6"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', color: '#fff' }}
        >
          <span className="truncate text-[15px] font-semibold">{camera.name}</span>
          <span className="shrink-0 text-[12px] opacity-80">{KIND_LABELS[camera.kind]}</span>
        </div>
      </div>
      {camera.viewApp && (
        <figcaption className="mt-1.5 px-1 text-[13px] text-[color:var(--ap-ink-3)]">Mientras tanto: {camera.viewApp}</figcaption>
      )}
    </figure>
  )
}

function CameraForm({ camera, onClose }: { camera?: Camera; onClose: () => void }) {
  const { upsert, remove } = useData()
  const [c, setC] = useState<Camera>(
    () => camera ?? { id: newId(), name: '', kind: 'interior', model: '', viewApp: '', notes: '', createdAt: Date.now() },
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof Camera>(key: K, value: Camera[K]) => setC((prev) => ({ ...prev, [key]: value }))
  const valid = c.name.trim().length > 0

  return (
    <Modal open onClose={onClose} title={camera ? 'Editar cámara' : 'Nueva cámara'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dónde está" className="col-span-2 sm:col-span-1">
            <input
              className="ap-input"
              value={c.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Salón, pasillo, entrada…"
              autoFocus={!camera}
            />
          </Field>
          <Field label="Tipo" className="col-span-2 sm:col-span-1">
            <select className="ap-input" value={c.kind} onChange={(e) => set('kind', e.target.value as CameraKind)}>
              {Object.entries(KIND_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Marca y modelo">
          <input className="ap-input" value={c.model} onChange={(e) => set('model', e.target.value)} placeholder="TP-Link Tapo C200, Ring…" />
        </Field>
        <Field label="Con qué app se ve hoy" hint="Y a nombre de quién está la cuenta">
          <input className="ap-input" value={c.viewApp} onChange={(e) => set('viewApp', e.target.value)} placeholder="App Tapo (cuenta de Ana)" />
        </Field>
        <Field label="Notas (opcional)">
          <input className="ap-input" value={c.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Qué enfoca, si graba de noche…" />
        </Field>
      </div>
      <div className="mt-6 flex items-center justify-between gap-2">
        {camera ? (
          <button type="button" className="ap-btn ap-btn-sm ap-btn-danger-quiet" onClick={() => setConfirmDelete(true)}>
            Eliminar
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" className="ap-btn ap-btn-sm ap-btn-neutral" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ap-btn ap-btn-sm ap-btn-primary"
            disabled={!valid}
            onClick={() => {
              upsert('cameras', {
                ...c,
                name: c.name.trim(),
                model: c.model.trim(),
                viewApp: c.viewApp.trim(),
                notes: c.notes.trim(),
              })
              onClose()
            }}
          >
            Guardar
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar cámara"
        message={`Se quitará «${camera?.name ?? c.name}» de la lista.`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (camera) remove('cameras', camera.id)
          onClose()
        }}
      />
    </Modal>
  )
}
