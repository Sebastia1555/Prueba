import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Home } from './pages/Home'

// Secciones del producto completo. En la Fase 1 solo la Home está activa;
// el resto se habilita en fases posteriores (registro, cartera, track record…).
const SECTIONS = [
  { label: 'Hoy', active: true },
  { label: 'Cartera', active: false },
  { label: 'Track record', active: false },
  { label: 'Watchlist', active: false },
]

function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        borderColor: 'var(--ap-hairline-soft)',
        backgroundColor: 'rgba(245, 245, 247, 0.8)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧭</span>
          <span className="text-[19px] font-semibold tracking-[-0.02em] text-[color:var(--ap-ink)]">
            Buffett Daily
          </span>
        </div>

        <nav className="hidden gap-1 sm:flex">
          {SECTIONS.map((s) => (
            <span
              key={s.label}
              className="rounded-full px-3.5 py-1.5 text-[14px] tracking-[-0.01em]"
              style={
                s.active
                  ? { backgroundColor: 'var(--ap-blue)', color: '#fff' }
                  : { color: 'var(--ap-ink-3)' }
              }
              title={s.active ? undefined : 'Disponible en próximas fases'}
            >
              {s.label}
            </span>
          ))}
        </nav>
      </div>
    </header>
  )
}

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="min-h-screen">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppProvider>
  )
}

export default App
