import { stats } from '../content'

export function Hero() {
  return (
    <section id="inicio" className="hero-stone relative flex min-h-screen items-center overflow-hidden">
      {/* Trama sutil de sillería sobre el fondo. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '64px 40px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-28 pb-16">
        <div className="max-w-3xl">
          <p className="animate-rise text-sm font-medium uppercase tracking-[0.28em] text-mares-300">
            Taller de piedra · Santanyí, Mallorca
          </p>
          <h1 className="animate-rise mt-5 font-display text-5xl font-medium leading-[1.05] text-mares-50 sm:text-6xl md:text-7xl">
            La piedra de Santanyí,
            <span className="block text-mares-300">tallada como siempre.</span>
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-mares-100/90">
            Tres generaciones extrayendo, fabricando y suministrando piedra natural a
            constructoras, promotoras, arquitectos y estudios de diseño. De la cantera propia
            a la obra, con el rigor de un oficio artesano.
          </p>

          <div className="animate-rise mt-9 flex flex-wrap gap-4">
            <a
              href="#contacto"
              className="rounded-full bg-mares-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-mares-400"
            >
              Solicitar presupuesto
            </a>
            <a
              href="#productos"
              className="rounded-full border border-mares-200/40 px-7 py-3.5 text-sm font-semibold text-mares-50 transition-colors hover:bg-white/10"
            >
              Ver productos
            </a>
          </div>
        </div>

        <dl className="animate-rise mt-16 grid max-w-3xl grid-cols-2 gap-y-8 border-t border-white/15 pt-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.etiqueta}>
              <dt className="font-display text-4xl font-medium text-mares-300">{s.valor}</dt>
              <dd className="mt-1 text-sm text-mares-100/80">{s.etiqueta}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
