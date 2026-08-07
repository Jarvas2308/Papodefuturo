import { describe, expect, it } from 'vitest'
import { extractEtfFinancialHighlightsV1 } from './extractEtfFinancialHighlightsV1'
import { findEtfNcsrFundIdentityV1 } from './etfNcsrFundIdentityV1'
import {
  VEA_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1,
  VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1,
  VOO_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1,
} from './testFixtures'

function extractForTicker(ticker: string, documentText: string) {
  const identity = findEtfNcsrFundIdentityV1(ticker)!
  return extractEtfFinancialHighlightsV1({
    documentText,
    fundName: identity.fundName,
    shareClassLabel: identity.shareClassLabel,
  })
}

describe('extractEtfFinancialHighlightsV1 - real N-CSR fixtures', () => {
  it('reads VNQ (Real Estate Index Fund, ETF Shares, fiscal year ending January 31)', () => {
    expect(
      extractForTicker('VNQ', VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1)
    ).toEqual({
      fiscalYearEndDate: '2026-01-31',
      totalDistributionsPerShare: { unscaledValue: 3472, scale: 3 },
      netAssetValueEndOfPeriod: { unscaledValue: 9081, scale: 2 },
    })
  })

  it('reads VOO (500 Index Fund, ETF Shares, fiscal year ending December 31)', () => {
    expect(
      extractForTicker('VOO', VOO_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1)
    ).toMatchObject({
      fiscalYearEndDate: '2025-12-31',
      totalDistributionsPerShare: { unscaledValue: 7068, scale: 3 },
      netAssetValueEndOfPeriod: { unscaledValue: 62_702, scale: 2 },
    })
  })

  it('reads VEA, whose ETF class label is not simply "ETF Shares"', () => {
    const identity = findEtfNcsrFundIdentityV1('VEA')!
    expect(identity.shareClassLabel).toBe('FTSE Developed Markets ETF Shares')

    expect(
      extractForTicker('VEA', VEA_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1)
    ).toMatchObject({
      fiscalYearEndDate: '2025-12-31',
      totalDistributionsPerShare: { unscaledValue: 2009, scale: 3 },
      netAssetValueEndOfPeriod: { unscaledValue: 6242, scale: 2 },
    })
  })

  it('returns the distribution as a positive magnitude, not the parenthesised outflow', () => {
    const highlights = extractForTicker(
      'VNQ',
      VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1
    )!
    expect(highlights.totalDistributionsPerShare.unscaledValue).toBeGreaterThan(
      0
    )
  })
})

describe('extractEtfFinancialHighlightsV1 - fails closed', () => {
  it('returns null when the fund is not in the document', () => {
    expect(
      extractEtfFinancialHighlightsV1({
        documentText: VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1,
        fundName: '500 Index Fund',
        shareClassLabel: 'ETF Shares',
      })
    ).toBeNull()
  })

  it('returns null when the share class label does not match exactly', () => {
    expect(
      extractEtfFinancialHighlightsV1({
        documentText: VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1,
        fundName: 'Real Estate Index Fund',
        shareClassLabel: 'Admiral Shares',
      })
    ).toBeNull()
  })

  it('returns null when the same fund/class block appears more than once', () => {
    const duplicated = `${VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1} ${VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1}`
    expect(extractForTicker('VNQ', duplicated)).toBeNull()
  })

  it('does not match a fund name that is only a suffix of a longer fund name', () => {
    expect(
      extractEtfFinancialHighlightsV1({
        documentText: VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1,
        fundName: 'Estate Index Fund',
        shareClassLabel: 'ETF Shares',
      })
    ).toBeNull()
  })

  it('returns null when the printed page number before the heading is gone', () => {
    const withoutPageNumber =
      VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1.replace(/^8 /, '')
    expect(extractForTicker('VNQ', withoutPageNumber)).toBeNull()
  })

  it('returns null for a partial period header instead of guessing a fiscal year', () => {
    const partialPeriod = VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1.replace(
      'Year Ended January 31,',
      'Period Ended January 31,'
    )
    expect(extractForTicker('VNQ', partialPeriod)).toBeNull()
  })

  it('returns null when a value cell is not a plain number', () => {
    const corrupted = VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1.replace(
      'Total Distributions (3.472)',
      'Total Distributions n/a'
    )
    expect(extractForTicker('VNQ', corrupted)).toBeNull()
  })

  it('returns null when the net asset value row is missing', () => {
    const corrupted = VNQ_ETF_SHARES_FINANCIAL_HIGHLIGHTS_TEXT_V1.replace(
      'Net Asset Value, End of Period',
      'Net Asset Value, Close of Period'
    )
    expect(extractForTicker('VNQ', corrupted)).toBeNull()
  })
})
