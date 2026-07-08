import { servicios } from '../content'

const PERFILES = ['Constructoras', 'Promotoras', 'Arquitectos', 'Estudios de diseño', 'Interioristas']

export function Services() {
  return (
    <section id="servicios" className="hero-stone py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mares-300">
            Para profesionales
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-mares-50 sm:text-5xl">
            Su proveedor de piedra natural en cada fase de la obra
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-mares-100/85">
            Trabajamos codo con codo con quienes construyen y proyectan. Nos integramos en su
            flujo de trabajo con soluciones de piedra fiables, medibles y entregadas a tiempo.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {PERFILES.map((p) => (
            <span
              key={p}
              className="rounded-full border border-mares-200/30 bg-white/5 px-4 py-1.5 text-sm font-medium text-mares-100"
            >
              {p}
            </span>
          ))}
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
          {servicios.map((s) => (
            <div key={s.titulo} className="bg-piedra-900/60 p-8 backdrop-blur-sm">
              <h3 className="font-display text-2xl font-medium text-mares-200">{s.titulo}</h3>
              <p className="mt-3 leading-relaxed text-mares-100/80">{s.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
