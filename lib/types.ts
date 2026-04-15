export type DateRange = '24h' | '1m' | '1y' | '5y'

export interface ChartPoint {
  time: string
  value: number
}

export interface MarketItem {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  type: 'crypto' | 'stock'
  dataByRange: Record<DateRange, ChartPoint[]>
}

export type CardSize = 'sm' | 'md' | 'lg'
