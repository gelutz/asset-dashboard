// Maps internal asset IDs to exchange-specific symbols

// Binance: id -> lowercase pair (used in stream URLs)
export const CRYPTO_STREAM_MAP: Record<string, string> = {
  btc: 'btcusdt',
  eth: 'ethusdt',
  sol: 'solusdt',
  ada: 'adausdt',
  xrp: 'xrpusdt',
  dot: 'dotusdt',
  doge: 'dogeusdt',
  avax: 'avaxusdt',
}

// Reverse: "BTCUSDT" -> "btc"
export const BINANCE_SYMBOL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(CRYPTO_STREAM_MAP).map(([id, pair]) => [pair.toUpperCase(), id])
)

// Finnhub: id -> ticker symbol
export const STOCK_SYMBOL_MAP: Record<string, string> = {
  aapl: 'AAPL',
  msft: 'MSFT',
  googl: 'GOOGL',
  amzn: 'AMZN',
  nvda: 'NVDA',
  tsla: 'TSLA',
  meta: 'META',
  nflx: 'NFLX',
}

// Reverse: "AAPL" -> "aapl"
export const FINNHUB_SYMBOL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(STOCK_SYMBOL_MAP).map(([id, sym]) => [sym, id])
)
