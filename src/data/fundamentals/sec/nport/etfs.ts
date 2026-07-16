import type { SecInternationalEtf, SecInternationalEtfTicker } from './types'

export const SEC_INTERNATIONAL_ETFS = [
  {
    ticker: 'VOO',
    registrantCik: '0000036405',
    registrantName: 'VANGUARD INDEX FUNDS',
    seriesId: 'S000002839',
    seriesName: 'Vanguard 500 Index Fund',
    classId: 'C000092055',
    className: 'ETF Shares',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
  },
  {
    ticker: 'VNQ',
    registrantCik: '0000734383',
    registrantName: 'VANGUARD SPECIALIZED FUNDS',
    seriesId: 'S000002924',
    seriesName: 'Vanguard Real Estate Index Fund',
    classId: 'C000032424',
    className: 'ETF Shares',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
  },
  {
    ticker: 'VEA',
    registrantCik: '0000923202',
    registrantName: 'VANGUARD TAX-MANAGED FUNDS',
    seriesId: 'S000004386',
    seriesName: 'Vanguard Developed Markets Index Fund',
    classId: 'C000051262',
    className: 'ETF Shares',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
  },
] as const satisfies readonly SecInternationalEtf[]

export function getSecInternationalEtf(ticker: string): SecInternationalEtf {
  const normalizedTicker = ticker.trim().toUpperCase()
  const fund = SEC_INTERNATIONAL_ETFS.find(
    (candidate) => candidate.ticker === normalizedTicker
  )

  if (!fund) {
    throw new Error(`Unsupported SEC international ETF ticker: ${ticker}`)
  }

  return { ...fund }
}

export function isSecInternationalEtfTicker(
  value: string
): value is SecInternationalEtfTicker {
  return SEC_INTERNATIONAL_ETFS.some((fund) => fund.ticker === value)
}
