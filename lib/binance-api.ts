import { CRYPTO_STREAM_MAP } from './symbol-maps'
import type { MarketItem, ChartPoint, DateRange } from './types'

const BASE = 'https://api.binance.com/api/v3'

const RANGE_CONFIG: Record<DateRange, { interval: string; limit: number }> = {
  '24h': { interval: '1h', limit: 24 },
  '1m':  { interval: '1d', limit: 30 },
  '1y':  { interval: '1w', limit: 52 },
  '5y':  { interval: '1M', limit: 60 },
}

const CRYPTO_CATALOG: { id: string; symbol: string; name: string }[] = [
  { id: 'btc',  symbol: 'BTC',  name: 'Bitcoin' },
  { id: 'eth',  symbol: 'ETH',  name: 'Ethereum' },
  { id: 'sol',  symbol: 'SOL',  name: 'Solana' },
  { id: 'ada',  symbol: 'ADA',  name: 'Cardano' },
  { id: 'xrp',  symbol: 'XRP',  name: 'Ripple' },
  { id: 'dot',  symbol: 'DOT',  name: 'Polkadot' },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche' },
]

export { CRYPTO_CATALOG }

interface TickerResponse {
  symbol: string
  lastPrice: string
  priceChangePercent: string
}

async function fetchTickers(): Promise<Map<string, { price: number; change24h: number }>> {
  const binanceSymbols = Object.values(CRYPTO_STREAM_MAP).map((s) => s.toUpperCase())
  const params = new URLSearchParams({ symbols: JSON.stringify(binanceSymbols) })
  const res = await fetch(`${BASE}/ticker/24hr?${params}`)
  if (!res.ok) throw new Error(`Binance ticker error: ${res.status}`)

  const data: TickerResponse[] = await res.json()
  const map = new Map<string, { price: number; change24h: number }>()

  for (const t of data) {
    const id = Object.entries(CRYPTO_STREAM_MAP).find(
      ([, pair]) => pair.toUpperCase() === t.symbol
    )?.[0]
    if (id) {
      map.set(id, {
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChangePercent),
      })
    }
  }
  return map
}

async function fetchKlines(
  binancePair: string,
  interval: string,
  limit: number
): Promise<ChartPoint[]> {
  const params = new URLSearchParams({
    symbol: binancePair.toUpperCase(),
    interval,
    limit: String(limit),
  })
  const res = await fetch(`${BASE}/klines?${params}`)
  if (!res.ok) throw new Error(`Binance klines error: ${res.status}`)

  const data: unknown[][] = await res.json()
  return data.map((k) => ({
    time: new Date(k[0] as number).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
    value: parseFloat(k[4] as string), // close price
  }))
}

async function fetchAllRanges(binancePair: string): Promise<Record<DateRange, ChartPoint[]>> {
  const entries = await Promise.all(
    (Object.entries(RANGE_CONFIG) as [DateRange, { interval: string; limit: number }][]).map(
      async ([range, { interval, limit }]) => {
        const points = await fetchKlines(binancePair, interval, limit)
        return [range, points] as const
      }
    )
  )
  return Object.fromEntries(entries) as Record<DateRange, ChartPoint[]>
}

export async function fetchAllCryptoData(): Promise<MarketItem[]> {
  const [tickers, ...allRanges] = await Promise.all([
    fetchTickers(),
    ...CRYPTO_CATALOG.map((c) => {
      const pair = CRYPTO_STREAM_MAP[c.id]
      return fetchAllRanges(pair)
    }),
  ])

  return CRYPTO_CATALOG.map((c, i) => {
    const ticker = tickers.get(c.id)
    return {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      price: ticker?.price ?? 0,
      change24h: ticker?.change24h ?? 0,
      type: 'crypto' as const,
      dataByRange: allRanges[i],
    }
  })
}
