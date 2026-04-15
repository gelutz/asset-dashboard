import type { MarketItem, ChartPoint, DateRange } from './types'

// Taxa de câmbio USD -> BRL (fake)
export const USD_TO_BRL = 5.08

function generateRange(
  baseValue: number,
  volatility: number,
  points: number,
  labelFn: (i: number) => string
): ChartPoint[] {
  const data: ChartPoint[] = []
  let current = baseValue * (0.6 + Math.random() * 0.2)
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.48) * volatility * current
    current = Math.max(current + change, baseValue * 0.1)
    data.push({ time: labelFn(i), value: parseFloat(current.toFixed(4)) })
  }
  // force last point near baseValue for realism
  data[data.length - 1].value = baseValue
  return data
}

function buildRanges(base: number, vol: number): Record<DateRange, ChartPoint[]> {
  return {
    '24h': generateRange(base, vol * 0.01, 24, (i) => `${String(i).padStart(2, '0')}:00`),
    '1m': generateRange(base, vol * 0.015, 30, (i) => `Dia ${i + 1}`),
    '1y': generateRange(base, vol * 0.02, 52, (i) => `Sem ${i + 1}`),
    '5y': generateRange(base, vol * 0.025, 60, (i) => {
      const year = 2020 + Math.floor(i / 12)
      const month = (i % 12) + 1
      return `${String(month).padStart(2, '0')}/${year}`
    }),
  }
}

export const cryptoAssets: MarketItem[] = [
  { id: 'btc',  symbol: 'BTC',  name: 'Bitcoin',    price: 67432.50, change24h:  2.45, type: 'crypto', dataByRange: buildRanges(67432.50, 1) },
  { id: 'eth',  symbol: 'ETH',  name: 'Ethereum',   price:  3521.80, change24h: -1.23, type: 'crypto', dataByRange: buildRanges(3521.80,  1) },
  { id: 'sol',  symbol: 'SOL',  name: 'Solana',     price:   142.65, change24h:  5.67, type: 'crypto', dataByRange: buildRanges(142.65,   1) },
  { id: 'ada',  symbol: 'ADA',  name: 'Cardano',    price:     0.58, change24h: -2.89, type: 'crypto', dataByRange: buildRanges(0.58,     1) },
  { id: 'xrp',  symbol: 'XRP',  name: 'Ripple',     price:     0.52, change24h:  1.12, type: 'crypto', dataByRange: buildRanges(0.52,     1) },
  { id: 'dot',  symbol: 'DOT',  name: 'Polkadot',   price:     7.23, change24h: -0.45, type: 'crypto', dataByRange: buildRanges(7.23,     1) },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin',   price:     0.12, change24h:  8.34, type: 'crypto', dataByRange: buildRanges(0.12,     1) },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche',  price:    35.67, change24h:  3.21, type: 'crypto', dataByRange: buildRanges(35.67,    1) },
]

export const stockAssets: MarketItem[] = [
  { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.',     price:  178.50, change24h:  1.23, type: 'stock', dataByRange: buildRanges(178.50,  1) },
  { id: 'msft', symbol: 'MSFT', name: 'Microsoft',      price:  378.92, change24h: -0.45, type: 'stock', dataByRange: buildRanges(378.92,  1) },
  { id: 'googl', symbol: 'GOOGL', name: 'Alphabet',     price:  141.80, change24h:  2.15, type: 'stock', dataByRange: buildRanges(141.80,  1) },
  { id: 'amzn', symbol: 'AMZN', name: 'Amazon',         price:  178.25, change24h: -1.87, type: 'stock', dataByRange: buildRanges(178.25,  1) },
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA',         price:  875.30, change24h:  4.56, type: 'stock', dataByRange: buildRanges(875.30,  1) },
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla',          price:  245.60, change24h: -3.21, type: 'stock', dataByRange: buildRanges(245.60,  1) },
  { id: 'meta', symbol: 'META', name: 'Meta Platforms', price:  485.20, change24h:  1.89, type: 'stock', dataByRange: buildRanges(485.20,  1) },
  { id: 'nflx', symbol: 'NFLX', name: 'Netflix',        price:  612.45, change24h:  0.67, type: 'stock', dataByRange: buildRanges(612.45,  1) },
]

export const allAssets = [...cryptoAssets, ...stockAssets]
