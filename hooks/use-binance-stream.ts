'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { CRYPTO_STREAM_MAP, BINANCE_SYMBOL_TO_ID } from '@/lib/symbol-maps'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface PriceUpdate {
  price: number
  change24h: number
}

const FLUSH_INTERVAL = 1000
const MAX_BACKOFF = 30_000

export function useBinanceStream(activeIds: string[]) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(() => new Map())
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  const bufferRef = useRef<Map<string, PriceUpdate>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(1000)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stable stream list derived from activeIds
  const streams = useMemo(
    () => activeIds
      .map((id) => CRYPTO_STREAM_MAP[id])
      .filter(Boolean)
      .map((pair) => `${pair}@miniTicker`),
    [activeIds]
  )

  useEffect(() => {
    if (streams.length === 0) {
      setStatus('disconnected')
      return
    }

    let disposed = false

    function connect() {
      if (disposed) return

      const url = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`
      const ws = new WebSocket(url)
      wsRef.current = ws
      setStatus('connecting')

      ws.onopen = () => {
        if (disposed) { ws.close(); return }
        backoffRef.current = 1000
        setStatus('connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          const d = msg.data
          if (!d?.s || !d?.c || !d?.o) return

          const id = BINANCE_SYMBOL_TO_ID[d.s]
          if (!id) return

          const close = parseFloat(d.c)
          const open = parseFloat(d.o)
          const change24h = open !== 0 ? ((close - open) / open) * 100 : 0

          bufferRef.current.set(id, { price: close, change24h })
        } catch {
          // malformed message, skip
        }
      }

      ws.onclose = () => {
        if (disposed) return
        scheduleReconnect()
      }

      ws.onerror = () => {
        // onclose fires after onerror, reconnect handled there
      }
    }

    function scheduleReconnect() {
      setStatus('reconnecting')
      const delay = backoffRef.current
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF)
      reconnectTimerRef.current = setTimeout(connect, delay)
    }

    // Flush buffer to state periodically
    flushTimerRef.current = setInterval(() => {
      if (bufferRef.current.size === 0) return
      setPrices(new Map(bufferRef.current))
    }, FLUSH_INTERVAL)

    connect()

    return () => {
      disposed = true
      wsRef.current?.close()
      wsRef.current = null
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (flushTimerRef.current) clearInterval(flushTimerRef.current)
    }
  }, [streams])

  return { prices, status }
}
