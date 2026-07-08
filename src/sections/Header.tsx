import { useEffect, useState } from 'react'
import { Logo } from '../components/Icons'
import { empresa } from '../content'

const NAV = [
  { href: '#empresa', label: 'Empresa' },
  { href: '#productos', label: 'Productos' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#proyectos', label: 'Proyectos' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'bg-mares-50/95 shadow-sm backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="#inicio" className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="flex flex-col leading-none">
            <span
              className={`font-display text-xl font-semibold tracking-wide ${
                scrolled || open ? 'text-piedra-900' : 'text-white'
              }`}
            >
              {empresa.nombre}
            </span>
            <span
              className={`text-[0.62rem] uppercase tracking-[0.22em] ${
                scrolled || open ? 'text-mares-600' : 'text-mares-200'
              }`}
            >
              Piedra de Santanyí
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-mares-500 ${
                scrolled ? 'text-piedra-700' : 'text-mares-100'
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contacto"
            className="rounded-full bg-mares-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-mares-700"
          >
            Solicitar presupuesto
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          className={`lg:hidden ${scrolled || open ? 'text-piedra-900' : 'text-white'}`}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-mares-200 bg-mares-50 px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-piedra-800 hover:bg-mares-100"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contacto"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-mares-600 px-5 py-2.5 text-center font-semibold text-white"
            >
              Solicitar presupuesto
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
