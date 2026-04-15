'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bitcoin, LineChart, Plus, ChevronDown, ChevronUp, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useBinanceStream, type ConnectionStatus } from '@/hooks/use-binance-stream'
import { useFinnhubStream } from '@/hooks/use-finnhub-stream'
import { useCryptoData } from '@/hooks/use-crypto-data'
import { MarketCard } from './market-card'
import { AddAssetDialog } from './add-asset-dialog'
import { stockAssets } from '@/lib/fake-data'
import type { MarketItem, CardSize, DateRange } from '@/lib/types'
import { cn } from '@/lib/utils'

const MAX_ITEMS = 5
const HAS_FINNHUB_KEY = !!process.env.NEXT_PUBLIC_FINNHUB_API_KEY
const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '1m', label: '1M' },
  { value: '1y', label: '1A' },
  { value: '5y', label: '5A' },
]

const initialStocks = stockAssets.slice(0, 3)

interface SortableCardProps {
  item: MarketItem
  size: CardSize
  dateRange: DateRange
  usdToBrl: number
  onRemove: (id: string) => void
  onResize: (id: string, size: CardSize) => void
}

function SortableCard({ item, size, dateRange, usdToBrl, onRemove, onResize }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        size === 'sm' && 'col-span-1',
        size === 'md' && 'col-span-2',
        size === 'lg' && 'col-span-3',
      )}
    >
      <MarketCard
        item={item}
        size={size}
        dateRange={dateRange}
        usdToBrl={usdToBrl}
        onRemove={onRemove}
        onResize={onResize}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}

function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  if (status === 'connected') return <Wifi className="h-3 w-3 text-success" />
  if (status === 'connecting' || status === 'reconnecting') return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
  return <WifiOff className="h-3 w-3 text-muted-foreground opacity-50" />
}

interface MarketSectionProps {
  label: string
  icon: React.ReactNode
  items: MarketItem[]
  sizes: Record<string, CardSize>
  dateRange: DateRange
  usdToBrl: number
  onAdd: (asset: MarketItem) => void
  onRemove: (id: string) => void
  onResize: (id: string, size: CardSize) => void
  onReorder: (ids: string[]) => void
  type: 'crypto' | 'stock'
  connectionStatus?: ConnectionStatus
}

function MarketSection({ label, icon, items, sizes, dateRange, usdToBrl, onAdd, onRemove, onResize, onReorder, type, connectionStatus }: MarketSectionProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = items.map((i) => i.id)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(active.id as string)
      const newIndex = ids.indexOf(over.id as string)
      onReorder(arrayMove(ids, oldIndex, newIndex))
    }
  }

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        {connectionStatus && <ConnectionIndicator status={connectionStatus} />}
      </div>

      {items.length === 0 ? (
        <button
          onClick={() => {}}
          className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar {type === 'crypto' ? 'cripto' : 'ação'}
        </button>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  size={sizes[item.id] ?? 'sm'}
                  dateRange={dateRange}
                  usdToBrl={usdToBrl}
                  onRemove={onRemove}
                  onResize={onResize}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}

// Fixed corner toolbar
interface ToolbarProps {
  cryptoRange: DateRange
  stockRange: DateRange
  onCryptoRangeChange: (r: DateRange) => void
  onStockRangeChange: (r: DateRange) => void
  cryptoItems: MarketItem[]
  stockItems: MarketItem[]
  allCryptoAssets: MarketItem[]
  onAddCrypto: (a: MarketItem) => void
  onAddStock: (a: MarketItem) => void
  showStocks: boolean
}

function Toolbar({
  cryptoRange,
  stockRange,
  onCryptoRangeChange,
  onStockRangeChange,
  cryptoItems,
  stockItems,
  onAddCrypto,
  onAddStock,
  showStocks,
  allCryptoAssets,
}: ToolbarProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-2xl">
          {/* Cripto row */}
          <div className="flex items-center gap-2">
            <Bitcoin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <div className="flex items-center rounded-md border border-border bg-secondary p-0.5">
              {DATE_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => onCryptoRangeChange(r.value)}
                  className={cn(
                    'rounded px-2.5 py-1 text-[11px] font-medium leading-none transition-colors',
                    cryptoRange === r.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <AddAssetDialog
              selectedIds={cryptoItems.map((i) => i.id)}
              onAddAsset={onAddCrypto}
              type="crypto"
              disabled={cryptoItems.length >= MAX_ITEMS}
              availableAssets={allCryptoAssets}
            />
          </div>

          {/* Stock row — only if Finnhub key is set */}
          {showStocks && (
            <div className="flex items-center gap-2">
              <LineChart className="h-3.5 w-3.5 shrink-0 text-chart-2" />
              <div className="flex items-center rounded-md border border-border bg-secondary p-0.5">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => onStockRangeChange(r.value)}
                    className={cn(
                      'rounded px-2.5 py-1 text-[11px] font-medium leading-none transition-colors',
                      stockRange === r.value
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <AddAssetDialog
                selectedIds={stockItems.map((i) => i.id)}
                onAddAsset={onAddStock}
                type="stock"
                disabled={stockItems.length >= MAX_ITEMS}
              />
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-lg text-primary-foreground"
        aria-label="Abrir painel de controle"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function MarketDashboard() {
  const { assets: cryptoAssets, usdToBrl, loading, error } = useCryptoData()

  const [cryptoItems, setCryptoItems] = useState<MarketItem[] | null>(null)
  const [stockItems, setStockItems] = useState<MarketItem[]>(HAS_FINNHUB_KEY ? initialStocks : [])
  const [cryptoSizes, setCryptoSizes] = useState<Record<string, CardSize>>({})
  const [stockSizes, setStockSizes] = useState<Record<string, CardSize>>({})
  const [cryptoRange, setCryptoRange] = useState<DateRange>('24h')
  const [stockRange, setStockRange] = useState<DateRange>('24h')

  // Initialize crypto items once data loads
  const activeCryptoItems = useMemo(() => {
    if (cryptoItems !== null) return cryptoItems
    if (cryptoAssets.length === 0) return []
    return cryptoAssets.slice(0, 3)
  }, [cryptoItems, cryptoAssets])

  // Keep items synced with latest fetched data (chart data, etc.)
  const syncedCryptoItems = useMemo(
    () => activeCryptoItems.map((item) => {
      const fresh = cryptoAssets.find((a) => a.id === item.id)
      return fresh ? { ...fresh, price: item.price, change24h: item.change24h } : item
    }),
    [activeCryptoItems, cryptoAssets]
  )

  // Live price feeds
  const cryptoIds = useMemo(() => syncedCryptoItems.map((i) => i.id), [syncedCryptoItems])
  const stockIds = useMemo(() => stockItems.map((i) => i.id), [stockItems])

  const { prices: cryptoPrices, status: cryptoStatus } = useBinanceStream(cryptoIds)
  const { prices: stockPrices, status: stockStatus } = useFinnhubStream(HAS_FINNHUB_KEY ? stockIds : [])

  const liveCryptoItems = useMemo(
    () => syncedCryptoItems.map((item) => {
      const update = cryptoPrices.get(item.id)
      if (!update) return item
      return { ...item, price: update.price, change24h: update.change24h }
    }),
    [syncedCryptoItems, cryptoPrices]
  )

  const liveStockItems = useMemo(
    () => stockItems.map((item) => {
      const update = stockPrices.get(item.id)
      if (!update) return item
      return { ...item, price: update.price }
    }),
    [stockItems, stockPrices]
  )

  const handleAddCrypto = useCallback((asset: MarketItem) => {
    setCryptoItems((p) => [...(p ?? activeCryptoItems), asset])
  }, [activeCryptoItems])
  const handleAddStock = useCallback((asset: MarketItem) => setStockItems((p) => [...p, asset]), [])
  const handleRemoveCrypto = useCallback((id: string) => {
    setCryptoItems((p) => (p ?? activeCryptoItems).filter((i) => i.id !== id))
  }, [activeCryptoItems])
  const handleRemoveStock = useCallback((id: string) => setStockItems((p) => p.filter((i) => i.id !== id)), [])
  const handleResizeCrypto = useCallback((id: string, size: CardSize) => setCryptoSizes((p) => ({ ...p, [id]: size })), [])
  const handleResizeStock = useCallback((id: string, size: CardSize) => setStockSizes((p) => ({ ...p, [id]: size })), [])
  const handleReorderCrypto = useCallback((newIds: string[]) => {
    setCryptoItems((p) => {
      const items = p ?? activeCryptoItems
      return newIds.map((id) => items.find((i) => i.id === id)!)
    })
  }, [activeCryptoItems])
  const handleReorderStock = useCallback((newIds: string[]) => setStockItems((p) => newIds.map((id) => p.find((i) => i.id === id)!)), [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background">
        <p className="text-sm text-destructive">Erro ao carregar dados: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-muted-foreground underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 font-sans">
      <MarketSection
        label="Cripto"
        icon={<Bitcoin className="h-3.5 w-3.5 text-primary" />}
        items={liveCryptoItems}
        sizes={cryptoSizes}
        dateRange={cryptoRange}
        usdToBrl={usdToBrl}
        onAdd={handleAddCrypto}
        onRemove={handleRemoveCrypto}
        onResize={handleResizeCrypto}
        onReorder={handleReorderCrypto}
        type="crypto"
        connectionStatus={cryptoStatus}
      />

      {HAS_FINNHUB_KEY && (
        <MarketSection
          label="Ações"
          icon={<LineChart className="h-3.5 w-3.5 text-chart-2" />}
          items={liveStockItems}
          sizes={stockSizes}
          dateRange={stockRange}
          usdToBrl={usdToBrl}
          onAdd={handleAddStock}
          onRemove={handleRemoveStock}
          onResize={handleResizeStock}
          onReorder={handleReorderStock}
          type="stock"
          connectionStatus={stockStatus}
        />
      )}

      <Toolbar
        cryptoRange={cryptoRange}
        stockRange={stockRange}
        onCryptoRangeChange={setCryptoRange}
        onStockRangeChange={setStockRange}
        cryptoItems={liveCryptoItems}
        stockItems={stockItems}
        onAddCrypto={handleAddCrypto}
        onAddStock={handleAddStock}
        showStocks={HAS_FINNHUB_KEY}
        allCryptoAssets={cryptoAssets}
      />
    </div>
  )
}
