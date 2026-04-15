'use client'

import { useEffect, useState } from 'react'
import { fetchAllCryptoData } from '@/lib/binance-api'
import { fetchUsdToBrl } from '@/lib/exchange-rate'
import type { MarketItem } from '@/lib/types'

export function useCryptoData() {
  const [assets, setAssets] = useState<MarketItem[]>([])
  const [usdToBrl, setUsdToBrl] = useState(5.08)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [data, rate] = await Promise.all([
          fetchAllCryptoData(),
          fetchUsdToBrl(),
        ])
        if (cancelled) return
        setAssets(data)
        setUsdToBrl(rate)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to fetch data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { assets, usdToBrl, loading, error }
}
