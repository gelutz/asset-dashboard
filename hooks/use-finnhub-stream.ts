'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { STOCK_SYMBOL_MAP, FINNHUB_SYMBOL_TO_ID } from '@/lib/symbol-maps'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

interface PriceUpdate {
  price: number
}

const FLUSH_INTERVAL = 1000
const MAX_BACKOFF = 30_000

export function useFinnhubStream(activeIds: string[]) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(() => new Map())
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  const bufferRef = useRef<Map<string, PriceUpdate>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(1000)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const subscribedRef = useRef<Set<string>>(new Set())

  const apiKey = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_FINNHUB_API_KEY
    : undefined

  // Ticker symbols to subscribe
  const symbols = useMemo(
    () => activeIds.map((id) => STOCK_SYMBOL_MAP[id]).filter(Boolean),
    [activeIds]
  )

  useEffect(() => {
    if (!apiKey) {
      if (typeof window !== 'undefined') {
        console.warn('[Finnhub] NEXT_PUBLIC_FINNHUB_API_KEY not set — stock prices will use fallback data')
      }
      setStatus('disconnected')
      return
    }

    if (symbols.length === 0) {
      setStatus('disconnected')
      return
    }

    let disposed = false

    function subscribe(ws: WebSocket, sym: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }))
        subscribedRef.current.add(sym)
      }
    }

    function unsubscribe(ws: WebSocket, sym: string) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', symbol: sym }))
        subscribedRef.current.delete(sym)
      }
    }

    function connect() {
      if (disposed) return

      const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`)
      wsRef.current = ws
      subscribedRef.current.clear()
      setStatus('connecting')

      ws.onopen = () => {
        if (disposed) { ws.close(); return }
        backoffRef.current = 1000
        setStatus('connected')
        symbols.forEach((sym) => subscribe(ws, sym))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type !== 'trade' || !Array.isArray(msg.data)) return

          for (const trade of msg.data) {
            const id = FINNHUB_SYMBOL_TO_ID[trade.s]
            if (!id) continue
            bufferRef.current.set(id, { price: trade.p })
          }
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
      subscribedRef.current.clear()
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (flushTimerRef.current) clearInterval(flushTimerRef.current)
    }
  }, [apiKey, symbols])

  // Dynamic subscribe/unsubscribe when symbols change while connected
  useEffect(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const currentSyms = new Set(symbols)
    const prevSyms = subscribedRef.current

    // Subscribe new
    for (const sym of currentSyms) {
      if (!prevSyms.has(sym)) {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }))
        subscribedRef.current.add(sym)
      }
    }

    // Unsubscribe removed
    for (const sym of prevSyms) {
      if (!currentSyms.has(sym)) {
        ws.send(JSON.stringify({ type: 'unsubscribe', symbol: sym }))
        subscribedRef.current.delete(sym)
      }
    }
  }, [symbols])

  return { prices, status }
}
