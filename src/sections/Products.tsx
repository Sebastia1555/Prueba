import { Icon } from '../components/Icons'
import { productos } from '../content'

export function Products() {
  return (
    <section id="productos" className="bg-mares-50 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mares-600">Productos</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-piedra-900 sm:text-5xl">
            De la fachada al jardín, todo en piedra de Santanyí
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-piedra-700">
            Fabricamos cualquier elemento arquitectónico, tanto piezas normalizadas como despieces
            a medida según proyecto, combinando tradición y tecnología para garantizar la máxima
            durabilidad.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((p) => (
            <article
              key={p.titulo}
              className="group rounded-2xl border border-mares-200 bg-white p-7 transition-all hover:-translate-y-1 hover:border-mares-400 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mares-100 p-2.5 text-mares-600 transition-colors group-hover:bg-mares-600 group-hover:text-white">
                <Icon name={p.icono} />
              </div>
              <h3 className="mt-5 font-display text-2xl font-medium text-piedra-900">{p.titulo}</h3>
              <p className="mt-2.5 leading-relaxed text-piedra-700">{p.descripcion}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
