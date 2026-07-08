import { empresa } from '../content'

export function About() {
  return (
    <section id="empresa" className="stone-texture py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mares-600">La empresa</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-piedra-900 sm:text-5xl">
            Un oficio que pasa de padres a hijos desde {empresa.fundacion}
          </h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-piedra-700">
            <p>
              {empresa.nombre} es la continuación del taller artesanal familiar fundado a mediados
              del siglo pasado en {empresa.localidad}. La tercera generación de artesanos sigue
              creando elementos arquitectónicos en piedra de Santanyí combinando el saber
              tradicional con la tecnología actual.
            </p>
            <p>
              Somos una empresa de referencia en la extracción, fabricación y distribución de
              piedra de Santanyí, una calcarenita reconocida por su resistencia y su belleza.
              Disponer de <strong className="font-semibold text-piedra-900">cantera propia</strong>{' '}
              nos permite garantizar que siempre tenemos la mejor piedra disponible para cada uso.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {['Extracción', 'Fabricación', 'Distribución', 'Rehabilitación'].map((t) => (
              <span
                key={t}
                className="rounded-full border border-mares-300 bg-mares-50 px-4 py-1.5 text-sm font-medium text-mares-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Composición decorativa de sillería en piedra. */}
        <div className="relative">
          <div className="aspect-square overflow-hidden rounded-2xl bg-mares-200 shadow-xl">
            <div className="grid h-full grid-cols-3 grid-rows-3 gap-1.5 p-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    backgroundColor:
                      ['#d8c1a1', '#e7d9c3', '#c4a274', '#e7d9c3', '#d8c1a1', '#b48a58', '#c4a274', '#d8c1a1', '#e7d9c3'][i],
                  }}
                />
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 rounded-xl bg-piedra-900 px-7 py-5 shadow-xl">
            <p className="font-display text-3xl font-medium text-mares-300">Santanyí</p>
            <p className="text-sm text-mares-100/80">Piedra caliza dorada de Mallorca</p>
          </div>
        </div>
      </div>
    </section>
  )
}
