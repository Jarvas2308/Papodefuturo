import type { MarketQuote } from './types.ts'

const RECORD_SIZE = 245
const CASH_MARKET_CODE = '010'
const SUPPORTED_BDI_CODES = new Set(['02', '12'])

// Official COTAHIST positions are one-based and inclusive. JavaScript slices
// below are zero-based and end-exclusive.
const FIELD_OFFSETS = {
  recordType: [0, 2], // TIPREG: 1-2
  tradingDate: [2, 10], // DATAPRE: 3-10
  bdiCode: [10, 12], // CODBDI: 11-12
  ticker: [12, 24], // CODNEG: 13-24
  marketType: [24, 27], // TPMERC: 25-27
  lastPrice: [108, 121], // PREULT: 109-121, N(11)V99
} as const

export type CotahistRecord = {
  recordType: '01'
  tradingDate: string
  bdiCode: string
  ticker: string
  marketType: string
  priceInMinorUnits: number
  pricedAt: string
}

function readField(line: string, offset: readonly [number, number]): string {
  return line.slice(offset[0], offset[1])
}

export function parseCotahistPriceInMinorUnits(value: string): number {
  if (!/^\d{13}$/.test(value)) {
    throw new RangeError('COTAHIST PREULT must contain exactly 13 digits')
  }

  const amount = BigInt(value)

  if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('COTAHIST PREULT is outside the supported range')
  }

  return Number(amount)
}

export function normalizeCotahistTradingDate(value: string): string {
  if (!/^\d{8}$/.test(value)) {
    throw new RangeError('COTAHIST DATAPRE must use YYYYMMDD')
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  const timestamp = Date.UTC(year, month - 1, day, 21, 0, 0)
  const date = new Date(timestamp)

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError('COTAHIST DATAPRE is invalid')
  }

  return date.toISOString()
}

export function parseCotahistRecord(line: string): CotahistRecord | null {
  if (line.length !== RECORD_SIZE) {
    return null
  }

  const recordType = readField(line, FIELD_OFFSETS.recordType)

  if (recordType !== '01') {
    return null
  }

  const marketType = readField(line, FIELD_OFFSETS.marketType)
  const bdiCode = readField(line, FIELD_OFFSETS.bdiCode)

  if (marketType !== CASH_MARKET_CODE || !SUPPORTED_BDI_CODES.has(bdiCode)) {
    return null
  }

  const tradingDate = readField(line, FIELD_OFFSETS.tradingDate)

  return {
    recordType,
    tradingDate,
    bdiCode,
    ticker: readField(line, FIELD_OFFSETS.ticker).trim().toUpperCase(),
    marketType,
    priceInMinorUnits: parseCotahistPriceInMinorUnits(
      readField(line, FIELD_OFFSETS.lastPrice)
    ),
    pricedAt: normalizeCotahistTradingDate(tradingDate),
  }
}

export function parseCotahistQuotes(
  content: string,
  requestedTickers: readonly string[]
): MarketQuote[] {
  const requested = new Set(
    requestedTickers.map((ticker) => ticker.trim().toUpperCase())
  )
  const latestByTicker = new Map<string, CotahistRecord>()

  for (const line of content.split(/\r?\n/)) {
    let record: CotahistRecord | null

    try {
      record = parseCotahistRecord(line)
    } catch {
      continue
    }

    if (!record || !requested.has(record.ticker)) {
      continue
    }

    const current = latestByTicker.get(record.ticker)

    if (
      !current ||
      record.tradingDate > current.tradingDate ||
      (record.tradingDate === current.tradingDate &&
        record.priceInMinorUnits > current.priceInMinorUnits)
    ) {
      latestByTicker.set(record.ticker, record)
    }
  }

  return Array.from(latestByTicker.values())
    .sort((left, right) => left.ticker.localeCompare(right.ticker))
    .map((record) => ({
      ticker: record.ticker,
      currency: 'BRL',
      priceInMinorUnits: record.priceInMinorUnits,
      pricedAt: record.pricedAt,
    }))
}
