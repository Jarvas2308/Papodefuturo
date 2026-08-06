import { describe, expect, it } from 'vitest'
import { BRAZILIAN_STOCK_TICKER_ISIN_V1 } from './brazilianStockTickerIsinV1'

describe('BRAZILIAN_STOCK_TICKER_ISIN_V1', () => {
  it('maps all 5 tracked tickers to a 12-character ISIN', () => {
    const tickers = Object.keys(BRAZILIAN_STOCK_TICKER_ISIN_V1)
    expect(tickers.sort()).toEqual(
      ['BBAS3', 'ITSA4', 'PSSA3', 'TAEE11', 'WEGE3'].sort()
    )
    for (const isin of Object.values(BRAZILIAN_STOCK_TICKER_ISIN_V1)) {
      expect(isin).toMatch(/^BR[A-Z0-9]{10}$/)
    }
  })

  it('matches the exact ISIN values observed in the real 06/08/2026 backfill', () => {
    expect(BRAZILIAN_STOCK_TICKER_ISIN_V1).toEqual({
      BBAS3: 'BRBBASACNOR3',
      ITSA4: 'BRITSAACNPR7',
      TAEE11: 'BRTAEECDAM10',
      WEGE3: 'BRWEGEACNOR0',
      PSSA3: 'BRPSSAACNOR7',
    })
  })
})
