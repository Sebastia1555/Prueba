import { useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { Ranking } from './pages/Ranking'
import { History } from './pages/History'
import { NewMatch } from './pages/NewMatch'
import { Prediction } from './pages/Prediction'
import { PlayerProfile } from './pages/PlayerProfile'
import { Settings } from './pages/Settings'

const NAV_ITEMS = [
  { to: '/', label: 'Ranking' },
  { to: '/historial', label: 'Historial' },
  { to: '/nuevo-partido', label: 'Nuevo partido' },
  { to: '/prediccion', label: 'Predicción' },
  { to: '/ajustes', label: 'Ajustes' },
]

function NavBar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎾</span>
          <span className="text-lg font-bold text-slate-900">Pádel Tracker</span>
        </div>

        <nav className="hidden gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-100 px-4 py-2 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50">
          <NavBar />
          <main>
            <Routes>
              <Route path="/" element={<Ranking />} />
              <Route path="/historial" element={<History />} />
              <Route path="/nuevo-partido" element={<NewMatch />} />
              <Route path="/prediccion" element={<Prediction />} />
              <Route path="/ajustes" element={<Settings />} />
              <Route path="/jugador/:id" element={<PlayerProfile />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </DataProvider>
  )
}

export default App
