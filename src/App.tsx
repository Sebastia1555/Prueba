import { useEffect, useRef, useState } from 'react'
import { HashRouter, MemoryRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { DataProvider, useData } from './context/DataContext'
import { dismiss, isDismissed } from './lib/db'
import { IS_PREVIEW } from './lib/env'
import { fetchIcs, parseIcs } from './lib/ics'
import { MAIN_NAV, MORE_LINKS } from './lib/nav'
import { ROLE_LABELS } from './lib/permissions'
import { Icon } from './components/Icon'
import { Modal } from './components/Modal'
import { Avatar } from './components/ui'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Home } from './pages/Home'
import { Agenda } from './pages/Agenda'
import { Availability } from './pages/Availability'
import { Medications } from './pages/Medications'
import { MedicationSheet } from './pages/MedicationSheet'
import { Appointments } from './pages/Appointments'
import { AppointmentDetail } from './pages/AppointmentDetail'
import { DocumentsPage } from './pages/DocumentsPage'
import { Diary } from './pages/Diary'
import { Expenses } from './pages/Expenses'
import { EmergencyCard } from './pages/EmergencyCard'
import { Family } from './pages/Family'
import { Settings } from './pages/Settings'
import { More } from './pages/More'
import { ProfilePicker, Welcome } from './pages/Welcome'
import logo from './assets/logo.svg'

// En la vista previa el visor no deja cambiar la URL de la página: la
// navegación vive en memoria.
const Router = IS_PREVIEW ? MemoryRouter : HashRouter

const CALENDAR_REFRESH_MS = 6 * 3600_000

/** Vuelve a descargar los calendarios enlazados que lleven horas sin actualizarse. */
function useCalendarAutoRefresh() {
  const { data, ready, update } = useData()
  const done = useRef(false)
  useEffect(() => {
    if (!ready || done.current || IS_PREVIEW) return
    done.current = true
    for (const cal of data.calendars) {
      if (!cal.url || Date.now() - cal.importedAt < CALENDAR_REFRESH_MS) continue
      fetchIcs(cal.url)
        .then((text) => {
          const events = parseIcs(text)
          // Solo se sustituyen los eventos: lo demás puede haber cambiado mientras tanto.
          update((d) => ({
            ...d,
            calendars: d.calendars.map((c) => (c.id === cal.id ? { ...c, events, importedAt: Date.now() } : c)),
          }))
        })
        .catch(() => undefined)
    }
  }, [ready, data.calendars, update])
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function ProfileButton() {
  const { data, me, setMeId } = useData()
  const [open, setOpen] = useState(false)
  if (!me) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-black/5"
        aria-label="Cambiar de perfil"
      >
        <Avatar member={me} size={30} />
        <span className="hidden text-[15px] font-medium sm:inline">{me.name}</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="¿Quién usa la app?" maxWidth="max-w-sm">
        <ul className="-mx-2">
          {data.members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  setMeId(m.id)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2.5 text-left hover:bg-black/[0.03]"
              >
                <Avatar member={m} size={36} />
                <div className="flex-1">
                  <div className="text-[16px] font-semibold">{m.name}</div>
                  <div className="text-[13px] text-[color:var(--ap-ink-2)]">
                    {m.relation} · {ROLE_LABELS[m.role]}
                  </div>
                </div>
                {m.id === me.id && <Icon name="check" className="text-[color:var(--ap-blue)]" />}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-[color:var(--ap-ink-3)]">
          Versión de prueba: todos los perfiles comparten este dispositivo. En la versión en la nube cada uno entrará con
          su cuenta.
        </p>
      </Modal>
    </>
  )
}

function Header() {
  const { data, can } = useData()
  const desktopLinks = [...MAIN_NAV, ...MORE_LINKS.slice(0, 4)].filter((l) => !l.perm || can(l.perm))
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-[14px] tracking-[-0.01em] transition-colors ${
      isActive ? 'text-white' : 'text-[color:var(--ap-ink-2)] hover:text-[color:var(--ap-ink)]'
    }`
  const linkStyle = ({ isActive }: { isActive: boolean }) => (isActive ? { backgroundColor: 'var(--ap-blue)' } : undefined)

  return (
    <header
      className="no-print sticky top-0 z-40 border-b"
      style={{
        // En la vista previa el visor ya reserva el hueco de la barra de estado.
        top: IS_PREVIEW ? 'env(safe-area-inset-top, 0px)' : 0,
        paddingTop: IS_PREVIEW ? 0 : 'env(safe-area-inset-top)',
        borderColor: 'var(--ap-hairline-soft)',
        backgroundColor: 'rgba(245, 245, 247, 0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <NavLink to="/" className="flex min-w-0 items-center gap-2">
          <img src={logo} alt="" width={26} height={26} className="rounded-[7px]" />
          <span className="text-[19px] font-semibold tracking-[-0.02em]">Cuidamos</span>
          {data.patient.name && (
            <span className="truncate text-[15px] text-[color:var(--ap-ink-3)]">· {data.patient.name.split(' ')[0]}</span>
          )}
        </NavLink>
        <nav className="hidden gap-0.5 lg:flex">
          {desktopLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass} style={linkStyle}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/mas" className={linkClass} style={linkStyle}>
            Más
          </NavLink>
        </nav>
        <ProfileButton />
      </div>
    </header>
  )
}

function BottomNav() {
  const items = [...MAIN_NAV, { to: '/mas', label: 'Más', icon: 'more' as const, description: '' }]
  const { pathname } = useLocation()
  const moreActive = MORE_LINKS.some((l) => pathname.startsWith(l.to)) || pathname === '/mas'
  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderColor: 'var(--ap-hairline-soft)',
        backgroundColor: 'rgba(250, 250, 252, 0.92)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive || (item.to === '/mas' && moreActive) ? 'text-[color:var(--ap-blue)]' : 'text-[color:var(--ap-ink-3)]'
              }`
            }
          >
            <Icon name={item.icon} size={24} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/** Aviso de que se están viendo datos de ejemplo. */
function SampleBanner() {
  const { data } = useData()
  const [hidden, setHidden] = useState(() => isDismissed('sample'))
  if (!data.sample || hidden) return null
  return (
    <div className="no-print border-b px-4 py-2.5" style={{ backgroundColor: '#eef5fc', borderColor: '#cfe2f6' }}>
      <div className="mx-auto flex max-w-5xl items-start gap-3 text-[14px] leading-snug text-[color:var(--ap-ink-2)]">
        <span className="min-w-0 flex-1">
          <strong className="text-[color:var(--ap-ink)]">Datos de ejemplo.</strong> Carmen está cuidada por sus hijos Ana,
          Pedro y Lucía y por la cuidadora Rosa. Toca el avatar de arriba para ver la app como cada uno. Para empezar con
          tu familia: Más → Ajustes → Borrar todo.
        </span>
        <button
          type="button"
          onClick={() => {
            dismiss('sample')
            setHidden(true)
          }}
          className="shrink-0 rounded-full p-1 text-[color:var(--ap-ink-3)] hover:bg-black/5"
          aria-label="Cerrar aviso"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  )
}

/** Pantallas, aisladas para que un fallo en una no deje la app en blanco. */
function RoutedContent() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/disponibilidad" element={<Availability />} />
        <Route path="/medicacion" element={<Medications />} />
        <Route path="/medicacion/imprimir" element={<MedicationSheet />} />
        <Route path="/citas" element={<Appointments />} />
        <Route path="/citas/:id" element={<AppointmentDetail />} />
        <Route path="/documentos" element={<DocumentsPage />} />
        <Route path="/diario" element={<Diary />} />
        <Route path="/gastos" element={<Expenses />} />
        <Route path="/ficha" element={<EmergencyCard />} />
        <Route path="/familia" element={<Family />} />
        <Route path="/ajustes" element={<Settings />} />
        <Route path="/mas" element={<More />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </ErrorBoundary>
  )
}

function Shell() {
  const { data, ready, me, storageError, storageLocked, storageUnavailable } = useData()
  useCalendarAutoRefresh()

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-[color:var(--ap-ink-3)]">Cargando…</div>
  }
  if (data.members.length === 0) return <Welcome />
  if (!me) return <ProfilePicker />

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen">
        <Header />
        <SampleBanner />
        {storageError && (
          <div className="no-print px-4 py-2 text-center text-[14px]" style={{ backgroundColor: 'var(--loss-bg)', color: 'var(--loss)' }}>
            {storageLocked && !storageUnavailable
              ? 'No se han podido leer los datos guardados en este navegador. Para no estropearlos, no se guardará nada hasta que recargues la página.'
              : 'No se están pudiendo guardar los datos en este navegador (¿modo privado o sin espacio?).'}
          </div>
        )}
        <main className="mx-auto max-w-5xl px-4 pt-5 pb-28 lg:pb-12">
          <RoutedContent />
        </main>
        <BottomNav />
      </div>
    </Router>
  )
}

function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}

export default App
