import { describe, expect, it } from 'vitest'
import { selectFiscalYearEndCloseV1 } from './selectFiscalYearEndCloseV1'

describe('selectFiscalYearEndCloseV1', () => {
  it('picks the exact fiscal year end date when it is a trading day', () => {
    const series = [
      {
        ticker: 'BBAS3',
        tradingDate: '2025-12-29',
        closePriceInMinorUnits: 2_100,
      },
      {
        ticker: 'BBAS3',
        tradingDate: '2025-12-31',
        closePriceInMinorUnits: 2_200,
      },
    ]

    const result = selectFiscalYearEndCloseV1({
      series,
      fiscalYearEndDate: '2025-12-31',
    })

    expect(result?.tradingDate).toBe('2025-12-31')
    expect(result?.closePriceInMinorUnits).toBe(2_200)
  })

  it('falls back to the last trading day before a non-trading fiscal year end (DEC-096: BBAS3 2025-12-30)', () => {
    const series = [
      {
        ticker: 'BBAS3',
        tradingDate: '2025-12-29',
        closePriceInMinorUnits: 2_100,
      },
      {
        ticker: 'BBAS3',
        tradingDate: '2025-12-30',
        closePriceInMinorUnits: 2_192,
      },
    ]

    const result = selectFiscalYearEndCloseV1({
      series,
      fiscalYearEndDate: '2025-12-31',
    })

    expect(result?.tradingDate).toBe('2025-12-30')
    expect(result?.closePriceInMinorUnits).toBe(2_192)
  })

  it('never selects a trading day after the fiscal year end', () => {
    const series = [
      {
        ticker: 'BBAS3',
        tradingDate: '2025-12-30',
        closePriceInMinorUnits: 2_192,
      },
      {
        ticker: 'BBAS3',
        tradingDate: '2026-01-02',
        closePriceInMinorUnits: 2_500,
      },
    ]

    const result = selectFiscalYearEndCloseV1({
      series,
      fiscalYearEndDate: '2025-12-31',
    })

    expect(result?.tradingDate).toBe('2025-12-30')
  })

  it('never selects a trading day from a different calendar year', () => {
    const series = [
      {
        ticker: 'BBAS3',
        tradingDate: '2024-12-30',
        closePriceInMinorUnits: 1_800,
      },
    ]

    const result = selectFiscalYearEndCloseV1({
      series,
      fiscalYearEndDate: '2025-12-31',
    })

    expect(result).toBeNull()
  })

  it('returns null for an empty series', () => {
    const result = selectFiscalYearEndCloseV1({
      series: [],
      fiscalYearEndDate: '2025-12-31',
    })

    expect(result).toBeNull()
  })
})
