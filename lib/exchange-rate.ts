const FALLBACK_RATE = 5.08

export async function fetchUsdToBrl(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'
    )
    if (!res.ok) return FALLBACK_RATE
    const data: { price: string } = await res.json()
    return parseFloat(data.price) || FALLBACK_RATE
  } catch {
    return FALLBACK_RATE
  }
}
