'use client'

import { TrendingUp, TrendingDown, X, Maximize2, Minimize2 } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import type { MarketItem, CardSize, DateRange } from '@/lib/types'
import { USD_TO_BRL } from '@/lib/fake-data'
import { cn } from '@/lib/utils'

interface MarketCardProps {
  item: MarketItem
  size: CardSize
  dateRange: DateRange
  onRemove: (id: string) => void
  onResize: (id: string, size: CardSize) => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  isDragging?: boolean
}

const nextSize: Record<CardSize, CardSize> = { sm: 'md', md: 'lg', lg: 'sm' }

export function MarketCard({ item, size, dateRange, onRemove, onResize, dragHandleProps, isDragging }: MarketCardProps) {
  const isPositive = item.change24h >= 0
  const chartColor = isPositive ? '#22c55e' : '#ef4444'
  const priceInBRL = item.price * USD_TO_BRL
  const chartData = item.dataByRange[dateRange]

  const formatUSD = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: price < 1 ? 4 : 2,
      maximumFractionDigits: price < 1 ? 4 : 2,
    }).format(price)

  const formatBRL = (price: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: price < 1 ? 4 : 2,
      maximumFractionDigits: price < 1 ? 4 : 2,
    }).format(price)

  return (
    <div
      className={cn(
        'relative flex h-full max-w-xs flex-col overflow-hidden rounded-lg border border-border bg-card px-3 pt-3 pb-2',
        isDragging && 'opacity-50 shadow-2xl'
      )}
    >
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between gap-1">
        {/* Drag handle + symbol */}
        <div
          {...dragHandleProps}
          className="flex min-w-0 cursor-grab items-center gap-1.5 active:cursor-grabbing"
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" className="shrink-0 text-muted-foreground opacity-30">
            <circle cx="2" cy="2"  r="1.2" /><circle cx="6" cy="2"  r="1.2" />
            <circle cx="2" cy="6"  r="1.2" /><circle cx="6" cy="6"  r="1.2" />
            <circle cx="2" cy="10" r="1.2" /><circle cx="6" cy="10" r="1.2" />
          </svg>
          <span className="font-mono text-sm font-bold text-foreground">{item.symbol}</span>
        </div>

        {/* Badge + controls */}
        <div className="flex shrink-0 items-center gap-0.5">
          <span className={cn(
            'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
            isPositive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
          )}>
            {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {isPositive ? '+' : ''}{item.change24h.toFixed(2)}%
          </span>
          <button
            onClick={() => onResize(item.id, nextSize[size])}
            className="rounded p-0.5 text-muted-foreground opacity-30"
            aria-label={size === 'lg' ? 'Diminuir' : 'Ampliar'}
          >
            {size === 'lg' ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="rounded p-0.5 text-muted-foreground opacity-30"
            aria-label="Remover"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Prices */}
      <div className="mb-1.5">
        <p className="font-mono text-lg font-bold leading-tight text-foreground">
          {formatUSD(item.price)}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {formatBRL(priceInBRL)}
        </p>
      </div>

      {/* Chart */}
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={1.5}
              fill={`url(#grad-${item.id})`}
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
