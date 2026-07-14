import { useState } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { MarketProvider, useMarket } from './context/MarketContext'
import { ConnectionDot } from './components/ConnectionDot'
import { Market } from './pages/Market'
import { StockDetail } from './pages/StockDetail'
import { Settings } from './pages/Settings'

const NAV_ITEMS = [
  { to: '/', label: 'Mercado' },
  { to: '/ajustes', label: 'Ajustes' },
]

function NavBar() {
  const [open, setOpen] = useState(false)
  const { connection } = useMarket()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3.5 py-1.5 text-[14px] tracking-[-0.01em] transition-colors ${
      isActive ? 'text-white' : 'text-[color:var(--ap-ink-2)] hover:text-[color:var(--ap-ink)]'
    }`

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    isActive ? { backgroundColor: 'var(--ap-blue)' } : undefined

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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <span className="text-[19px] font-semibold tracking-[-0.02em] text-[color:var(--ap-ink)]">
            Bolsa
          </span>
          <span className="ml-1 hidden sm:inline">
            <ConnectionDot state={connection} />
          </span>
        </div>

        <nav className="hidden gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass} style={linkStyle}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="rounded-full p-2 text-[color:var(--ap-ink-2)] hover:bg-black/5 sm:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
        <nav
          className="flex flex-col gap-1 border-t px-4 py-2 sm:hidden"
          style={{ borderColor: 'var(--ap-hairline-soft)' }}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={linkClass}
              style={linkStyle}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="px-3.5 py-2">
            <ConnectionDot state={connection} />
          </div>
        </nav>
      )}
    </header>
  )
}

function App() {
  return (
    <MarketProvider>
      <HashRouter>
        <div className="min-h-screen">
          <NavBar />
          <main>
            <Routes>
              <Route path="/" element={<Market />} />
              <Route path="/accion/:symbol" element={<StockDetail />} />
              <Route path="/ajustes" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </MarketProvider>
  )
}

export default App
