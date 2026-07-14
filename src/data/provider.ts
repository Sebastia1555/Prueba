// Interfaz de datos que la app CONSUME (no implementa la ingesta externa).
//
// En la Fase 1 está respaldada por datos mock deterministas. En fases
// posteriores, cada función puede cablearse a una API real (Finnhub u otra)
// sin cambiar la UI ni el motor de scoring: la firma es el contrato.

import type { Fundamentals, PricePoint, Quote } from '../types'
import { MOCK_DB, MOCK_TICKERS, mockBenchmark } from './mockData'

/** Simula la latencia de red para que la UI ejercite sus estados de carga. */
function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

/** Cotización en tiempo real: precio, cambio %, máx/mín 52s, volumen. */
export async function getQuote(ticker: string): Promise<Quote> {
  const rec = MOCK_DB[ticker]
  if (!rec) throw new Error(`Sin cotización para ${ticker}`)
  return delay(rec.quote)
}

/** 10 años de fundamentales de un valor. */
export async function getFundamentals(ticker: string): Promise<Fundamentals> {
  const rec = MOCK_DB[ticker]
  if (!rec) throw new Error(`Sin fundamentales para ${ticker}`)
  return delay(rec.fundamentals)
}

/** Histórico de cotización (para medias móviles, RSI, caída desde máximos). */
export async function getPriceHistory(
  ticker: string,
  _range = '1y',
): Promise<PricePoint[]> {
  const rec = MOCK_DB[ticker]
  if (!rec) throw new Error(`Sin histórico para ${ticker}`)
  return delay(rec.history)
}

/** Lista de tickers del índice S&P 500. */
export async function getSP500Constituents(): Promise<string[]> {
  return delay(MOCK_TICKERS)
}

/** Serie histórica del S&P 500 (SPY) para comparar. */
export async function getBenchmark(_range = '1y'): Promise<PricePoint[]> {
  return delay(mockBenchmark())
}
