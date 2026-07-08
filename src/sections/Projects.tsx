import { proyectos } from '../content'

// Tonos de piedra para diferenciar visualmente cada tarjeta de la galería.
const TONOS = ['#d8c1a1', '#c4a274', '#e7d9c3', '#b48a58', '#cbb08a', '#dcc9ab']

export function Projects() {
  return (
    <section id="proyectos" className="bg-mares-100 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mares-600">Proyectos</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-piedra-900 sm:text-5xl">
              Nuestra piedra, en obras de toda España
            </h2>
          </div>
          <a
            href="#contacto"
            className="rounded-full border border-mares-400 px-6 py-3 text-sm font-semibold text-mares-700 transition-colors hover:bg-mares-600 hover:text-white"
          >
            ¿Tiene un proyecto? Hablemos
          </a>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((p, i) => (
            <article
              key={p.titulo}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md"
            >
              {/* Marcador visual de piedra (placeholder de imagen de proyecto). */}
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundColor: TONOS[i % TONOS.length],
                  backgroundImage:
                    'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 40%), radial-gradient(circle at 75% 80%, rgba(0,0,0,0.12) 0%, transparent 45%)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-piedra-900/80 via-piedra-900/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-2xl font-medium text-white">{p.titulo}</h3>
                <p className="mt-1 text-sm text-mares-100/90">{p.tipo}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
