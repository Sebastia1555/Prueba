import { useState } from 'react'
import { Icon } from '../components/Icons'
import { contacto } from '../content'

const DATOS = [
  { icono: 'phone', etiqueta: 'Teléfono', valor: contacto.telefono },
  { icono: 'mail', etiqueta: 'Email', valor: contacto.email },
  { icono: 'pin', etiqueta: 'Taller y cantera', valor: contacto.direccion },
  { icono: 'clock', etiqueta: 'Horario', valor: contacto.horario },
]

export function Contact() {
  const [enviado, setEnviado] = useState(false)

  return (
    <section id="contacto" className="stone-texture py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mares-600">Contacto</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-piedra-900 sm:text-5xl">
            Cuéntenos su proyecto
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-piedra-700">
            Envíenos los planos o una descripción de lo que necesita y preparamos un presupuesto
            sin compromiso. Atendemos consultas de constructoras, promotoras y estudios de
            arquitectura de toda España.
          </p>

          <div className="mt-10 space-y-5">
            {DATOS.map((d) => (
              <div key={d.etiqueta} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mares-600 p-2.5 text-white">
                  <Icon name={d.icono} />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-mares-600">{d.etiqueta}</p>
                  <p className="text-piedra-800">{d.valor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-mares-100">
          {enviado ? (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mares-100 text-mares-600">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-5 font-display text-2xl font-medium text-piedra-900">¡Gracias!</h3>
              <p className="mt-2 text-piedra-700">
                Hemos recibido su consulta. Le responderemos lo antes posible.
              </p>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                setEnviado(true)
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nombre" name="nombre" placeholder="Su nombre" required />
                <Field label="Empresa" name="empresa" placeholder="Constructora / estudio" />
                <Field label="Email" name="email" type="email" placeholder="correo@empresa.com" required />
                <Field label="Teléfono" name="telefono" placeholder="+34 ..." />
              </div>
              <div>
                <label htmlFor="mensaje" className="mb-1.5 block text-sm font-medium text-piedra-800">
                  Su proyecto
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  rows={4}
                  required
                  placeholder="Tipo de piezas, cantidades, plazos, ubicación de la obra..."
                  className="w-full rounded-lg border border-mares-200 bg-mares-50 px-4 py-3 text-piedra-900 outline-none transition-colors placeholder:text-mares-400 focus:border-mares-500 focus:ring-2 focus:ring-mares-500/20"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-mares-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-mares-700"
              >
                Enviar consulta
              </button>
              <p className="text-center text-xs text-mares-500">
                Demostración: el formulario no envía datos reales.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-piedra-800">
        {label}
        {required && <span className="text-mares-600"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-mares-200 bg-mares-50 px-4 py-3 text-piedra-900 outline-none transition-colors placeholder:text-mares-400 focus:border-mares-500 focus:ring-2 focus:ring-mares-500/20"
      />
    </div>
  )
}
