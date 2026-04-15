'use client'

import { useState } from 'react'
import { Plus, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CRYPTO_CATALOG } from '@/lib/binance-api'
import { stockAssets } from '@/lib/fake-data'
import type { MarketItem } from '@/lib/types'
import { cn } from '@/lib/utils'

// Minimal catalog entries for the picker when full data isn't needed
const cryptoCatalogAsItems: MarketItem[] = CRYPTO_CATALOG.map((c) => ({
  id: c.id,
  symbol: c.symbol,
  name: c.name,
  price: 0,
  change24h: 0,
  type: 'crypto' as const,
  dataByRange: { '24h': [], '1m': [], '1y': [], '5y': [] },
}))

interface AddAssetDialogProps {
  selectedIds: string[]
  onAddAsset: (asset: MarketItem) => void
  type: 'crypto' | 'stock'
  disabled?: boolean
  /** Live assets to show prices in the picker. Falls back to catalog if not provided. */
  availableAssets?: MarketItem[]
}

export function AddAssetDialog({ selectedIds, onAddAsset, type, disabled, availableAssets }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const catalog = type === 'crypto' ? cryptoCatalogAsItems : stockAssets
  const assets = availableAssets ?? catalog
  const filtered = assets.filter(
    (a) =>
      a.type === type &&
      !selectedIds.includes(a.id) &&
      (a.symbol.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = (asset: MarketItem) => {
    onAddAsset(asset)
    setOpen(false)
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 border-dashed px-2 text-[11px]"
          disabled={disabled}
        >
          <Plus className="h-3 w-3" />
          {type === 'crypto' ? 'Cripto' : 'Ação'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            Adicionar {type === 'crypto' ? 'Criptomoeda' : 'Ação'}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        <div className="max-h-[280px] space-y-0.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {search ? 'Nenhum resultado' : 'Todos os ativos adicionados'}
            </p>
          ) : (
            filtered.map((asset) => {
              const isPositive = asset.change24h >= 0
              return (
                <button
                  key={asset.id}
                  onClick={() => handleAdd(asset)}
                  className="flex w-full items-center justify-between rounded-md p-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      type === 'crypto' ? 'bg-primary/20 text-primary' : 'bg-chart-2/20 text-chart-2'
                    )}>
                      {asset.symbol.slice(0, 2)}
                    </span>
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">{asset.symbol}</p>
                      <p className="text-[11px] text-muted-foreground">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {asset.price > 0 && (
                      <>
                        <p className="font-mono text-xs font-medium text-foreground">
                          ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={cn(
                          'flex items-center justify-end gap-0.5 text-[11px] font-medium',
                          isPositive ? 'text-success' : 'text-destructive'
                        )}>
                          {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                          {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </p>
                      </>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
