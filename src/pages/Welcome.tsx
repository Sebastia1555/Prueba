import { useState } from 'react'
import { useData } from '../context/DataContext'
import { MEMBER_COLORS, newId } from '../lib/labels'
import { buildSampleData } from '../lib/sampleData'
import { emptyData, replaceAllData } from '../lib/store'
import { Avatar, Field } from '../components/ui'
import logo from '../assets/logo.svg'

const FEATURES = [
  ['🗓️', 'Turnos repartidos', 'Quién está cada mañana, tarde y noche, con los huecos sin cubrir a la vista.'],
  ['📆', 'Tu vida cuenta', 'Importa tu calendario o marca tus compromisos y nadie te asignará un turno que te pise.'],
  ['💊', 'Medicación clara', 'Qué toca cada día, quién la ha dado y cuándo hay que volver a comprar.'],
  ['🩺', 'Citas y documentos', 'Quién acompaña, qué preguntar y todos los informes en un solo sitio.'],
  ['📓', 'Diario compartido', 'Lo que pasó en cada turno para que el siguiente esté al día.'],
  ['💶', 'Gastos claros', 'Farmacia, cuidadora… y cuánto le toca poner a cada uno.'],
]

export function Welcome() {
  const { update, replaceData, setMeId, storageLocked, storageUnavailable } = useData()
  const [patient, setPatient] = useState('')
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')

  const start = () => {
    if (!patient.trim() || !name.trim()) return
    const me = {
      id: newId(),
      name: name.trim(),
      relation: relation.trim(),
      role: 'admin' as const,
      color: MEMBER_COLORS[0],
      phone: '',
      email: '',
      createdAt: Date.now(),
    }
    update(() => {
      const d = emptyData()
      return { ...d, patient: { ...d.patient, name: patient.trim() }, members: [me] }
    })
    setMeId(me.id)
  }

  const sample = async () => {
    const { data, files } = buildSampleData()
    const outcome = await replaceAllData(data, files, !storageLocked)
    replaceData(data, outcome === 'stored')
    setMeId(data.members[0].id)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10" style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top))' }}>
      <div className="text-center">
        <img src={logo} alt="" width={64} height={64} className="mx-auto rounded-[16px]" />
        <h1 className="mt-3 text-[40px] leading-tight">Cuidamos</h1>
        <p className="mx-auto mt-2 max-w-xl text-[19px] text-[color:var(--ap-ink-2)]">
          Organizad entre hermanos, familia y cuidadores el cuidado de una persona mayor, sin perder el hilo de nada.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {FEATURES.map(([emoji, title, text]) => (
          <div key={title} className="ap-card flex gap-3 p-4">
            <span className="text-2xl">{emoji}</span>
            <div>
              <div className="text-[16px] font-semibold">{title}</div>
              <div className="text-[14px] text-[color:var(--ap-ink-2)]">{text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="ap-card mt-8 p-5 sm:p-6">
        <h2 className="text-[22px]">Empezar</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="¿A quién vais a cuidar?" className="sm:col-span-2">
            <input className="ap-input" value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="Nombre y apellidos" />
          </Field>
          <Field label="Tu nombre">
            <input className="ap-input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Tu relación con él/ella">
            <input className="ap-input" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Hija, hijo, sobrina…" />
          </Field>
        </div>
        <p className="mt-3 text-[14px] text-[color:var(--ap-ink-3)]">
          Serás administrador/a. Después podrás añadir al resto de la familia y a la cuidadora.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="ap-btn ap-btn-primary" onClick={start} disabled={!patient.trim() || !name.trim()}>
            Crear
          </button>
          <button type="button" className="ap-btn ap-btn-neutral" onClick={() => void sample()}>
            Probar con datos de ejemplo
          </button>
        </div>
      </div>
      {storageLocked ? (
        <p className="mt-6 rounded-[12px] px-4 py-3 text-center text-[14px]" style={{ backgroundColor: 'var(--loss-bg)', color: 'var(--loss)' }}>
          {storageUnavailable
            ? 'Este navegador no deja guardar datos (¿ventana privada?): lo que hagas se perderá al cerrar.'
            : 'No se han podido leer los datos guardados en este navegador, así que ahora no se guardará nada para no estropearlos. Recarga la página para volver a intentarlo.'}
        </p>
      ) : (
        <p className="mt-6 text-center text-[13px] text-[color:var(--ap-ink-3)]">
          Versión de prueba: los datos se guardan solo en este dispositivo.
        </p>
      )}
    </div>
  )
}

export function ProfilePicker() {
  const { data, setMeId } = useData()
  return (
    <div className="mx-auto max-w-md px-4 py-12" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
      <div className="text-center">
        <img src={logo} alt="" width={56} height={56} className="mx-auto rounded-[14px]" />
        <h1 className="mt-3 text-[30px]">¿Quién eres?</h1>
        <p className="mt-1 text-[16px] text-[color:var(--ap-ink-2)]">
          Así sabremos quién da cada toma, quién coge cada turno y qué puedes ver.
        </p>
      </div>
      <ul className="ap-card mt-6 divide-y overflow-hidden">
        {data.members.map((m) => (
          <li key={m.id} style={{ borderColor: 'var(--ap-hairline-soft)' }}>
            <button type="button" onClick={() => setMeId(m.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02]">
              <Avatar member={m} size={40} />
              <div>
                <div className="text-[17px] font-semibold">{m.name}</div>
                <div className="text-[14px] text-[color:var(--ap-ink-2)]">{m.relation}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-[14px] text-[color:var(--ap-ink-3)]">
        ¿No estás en la lista? Pide a quien administra la app que te añada desde «Familia».
      </p>
    </div>
  )
}
