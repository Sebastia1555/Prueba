import { Logo } from '../components/Icons'
import { empresa, contacto, productos } from '../content'

export function Footer() {
  return (
    <footer className="bg-piedra-900 text-mares-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="font-display text-xl font-semibold text-white">{empresa.nombre}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mares-100/70">
            Taller de piedra de Santanyí. Tradición en piedra natural desde {empresa.fundacion}.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-mares-300">Productos</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {productos.slice(0, 5).map((p) => (
              <li key={p.titulo}>
                <a href="#productos" className="text-mares-100/70 transition-colors hover:text-white">
                  {p.titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-mares-300">Empresa</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { href: '#empresa', label: 'Sobre nosotros' },
              { href: '#servicios', label: 'Servicios' },
              { href: '#proceso', label: 'Proceso' },
              { href: '#proyectos', label: 'Proyectos' },
              { href: '#contacto', label: 'Contacto' },
            ].map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-mares-100/70 transition-colors hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-mares-300">Contacto</h3>
          <ul className="mt-4 space-y-2 text-sm text-mares-100/70">
            <li>{contacto.telefono}</li>
            <li>{contacto.email}</li>
            <li>{contacto.direccion}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-mares-100/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {empresa.nombre}. Todos los derechos reservados.</p>
          <p>
            Propuesta de web corporativa · diseño de demostración basado en información pública.
          </p>
        </div>
      </div>
    </footer>
  )
}
