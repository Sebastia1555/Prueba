import { Icon } from '../components/Icons'
import { ventajas } from '../content'

export function WhyUs() {
  return (
    <section id="ventajas" className="bg-mares-50 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mares-600">Por qué elegirnos</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-piedra-900 sm:text-5xl">
            Tradición y tecnología al servicio de su proyecto
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ventajas.map((v) => (
            <div key={v.titulo} className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-mares-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mares-100 p-3.5 text-mares-600">
                <Icon name={v.icono} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-piedra-900">{v.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-piedra-700">{v.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
