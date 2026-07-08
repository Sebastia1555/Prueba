import { proceso } from '../content'

export function Process() {
  return (
    <section id="proceso" className="stone-texture py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mares-600">El proceso</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-piedra-900 sm:text-5xl">
            De la cantera a la obra, bajo un mismo control
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-piedra-700">
            Controlar todo el ciclo elimina intermediarios, asegura la trazabilidad de cada
            bloque y nos permite comprometernos con plazos reales.
          </p>
        </div>

        <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {proceso.map((paso, i) => (
            <li key={paso.numero} className="relative">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl font-medium text-mares-300">{paso.numero}</span>
                {i < proceso.length - 1 && (
                  <span className="hidden h-px flex-1 bg-mares-300 lg:block" aria-hidden="true" />
                )}
              </div>
              <h3 className="mt-4 font-display text-2xl font-medium text-piedra-900">{paso.titulo}</h3>
              <p className="mt-2 leading-relaxed text-piedra-700">{paso.descripcion}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
