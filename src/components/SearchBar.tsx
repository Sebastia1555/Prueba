import { useEffect, useRef, useState } from 'react'
import type { SymbolInfo } from '../types'
import { useMarket } from '../context/MarketContext'

interface Props {
  onPick?: (symbol: string) => void
  placeholder?: string
}

/** Buscador de símbolos con resultados en vivo y alta directa a la watchlist. */
export function SearchBar({ onPick, placeholder = 'Buscar acción (p. ej. AAPL, Tesla)…' }: Props) {
  const { search, addSymbol, isInList } = useMarket()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SymbolInfo[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const id = window.setTimeout(async () => {
      const found = await search(q)
      setResults(found)
      setLoading(false)
    }, 250)
    return () => window.clearTimeout(id)
  }, [query, search])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const pick = async (symbol: string) => {
    await addSymbol(symbol)
    onPick?.(symbol)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--ap-ink-3)]"
          aria-hidden="true"
        >
          ⌕
        </span>
        <input
          className="ap-input pl-10"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
      </div>

      {open && query.trim() && (
        <div
          className="ap-card absolute z-30 mt-2 max-h-80 w-full overflow-auto p-1 shadow-[var(--shadow-product)]"
        >
          {loading && results.length === 0 && (
            <div className="px-3 py-3 text-[15px] text-[color:var(--ap-ink-3)]">Buscando…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-3 text-[15px] text-[color:var(--ap-ink-3)]">
              Sin resultados para «{query.trim()}».
            </div>
          )}
          {results.map((r) => {
            const added = isInList(r.symbol)
            return (
              <button
                key={r.symbol}
                type="button"
                onClick={() => pick(r.symbol)}
                disabled={added}
                className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[color:var(--ap-parchment)] disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="font-semibold text-[color:var(--ap-ink)]">{r.symbol}</span>
                  <span className="ml-2 truncate text-[14px] text-[color:var(--ap-ink-3)]">
                    {r.description}
                  </span>
                </span>
                <span className="shrink-0 text-[14px] font-medium" style={{ color: added ? 'var(--ap-ink-3)' : 'var(--ap-blue)' }}>
                  {added ? 'Añadida' : '+ Añadir'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
