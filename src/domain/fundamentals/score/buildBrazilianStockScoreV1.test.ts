import { describe, expect, it } from 'vitest'
import type { FundamentalFactsAsset } from '../types'
import { buildBrazilianStockScoreV1 } from './buildBrazilianStockScoreV1'
import { DEFAULT_STOCK_SIGNAL_RULES } from './defaultStockSignalRules'

const NOW = '2026-08-05T00:00:00.000Z'

function stockSnapshot(
  referenceDate: string,
  facts: {
    netIncome?: { amountInMinorUnits: number; currency: 'BRL' } | null
    totalEquity?: { amountInMinorUnits: number; currency: 'BRL' } | null
  } = {}
): FundamentalFactsAsset['snapshots'][number] {
  return {
    assetId: 'asset-bbas3',
    kind: 'brazilian-stock',
    referenceDate,
    period: 'annual',
    source: 'cvm-dfp',
    sourceDocumentId: `cvm-dfp-bbas3-${referenceDate}`,
    facts: {
      totalRevenue: null,
      netIncome: facts.netIncome ?? null,
      totalAssets: null,
      totalEquity: facts.totalEquity ?? null,
      operatingCashFlow: null,
      issuedShares: null,
    },
  }
}

function buildAsset(
  snapshots: FundamentalFactsAsset['snapshots']
): FundamentalFactsAsset {
  return {
    assetId: 'asset-bbas3',
    ticker: 'BBAS3',
    name: 'Banco do Brasil',
    category: 'brazilian-stock',
    snapshots,
  }
}

describe('buildBrazilianStockScoreV1', () => {
  it('scores ROE as applied and +2 for a high-return bank', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: { amountInMinorUnits: 2_000_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 10_000_000, currency: 'BRL' }, // 20% -> +2
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.totalPoints).toBe(2)
    expect(score.signals).toEqual([
      {
        signalKey: 'stock_roe',
        status: 'applied',
        observedValue: 200_000,
        points: 2,
      },
    ])
  })

  it('scores ROE as 0 within the neutral band', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: { amountInMinorUnits: 1_000_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 10_000_000, currency: 'BRL' }, // 10% -> 0
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'industrial',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ points: 0 })
  })

  it('scores ROE as -1 below the lower band', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: { amountInMinorUnits: 500_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 10_000_000, currency: 'BRL' }, // 5% -> -1
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'seguradora',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ points: -1 })
  })

  it('marks ROE unavailable for a pure holding regime', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: { amountInMinorUnits: 2_000_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 10_000_000, currency: 'BRL' },
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'holding',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.totalPoints).toBe(0)
    expect(score.signals).toEqual([
      { signalKey: 'stock_roe', status: 'unavailable', reason: 'wrong-regime' },
    ])
  })

  it('marks ROE unavailable when no stock snapshot exists yet', () => {
    const asset = buildAsset([])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals).toEqual([
      {
        signalKey: 'stock_roe',
        status: 'unavailable',
        reason: 'missing-input',
      },
    ])
  })

  it('marks ROE unavailable when total equity is missing', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: { amountInMinorUnits: 2_000_000, currency: 'BRL' },
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ status: 'unavailable' })
  })

  it('marks ROE unavailable when total equity is non-positive', () => {
    const asset = buildAsset([
      stockSnapshot('2026-06-30', {
        netIncome: { amountInMinorUnits: 2_000_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 0, currency: 'BRL' },
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ status: 'unavailable' })
  })

  it('marks ROE stale when the reference date is past the threshold', () => {
    const asset = buildAsset([
      stockSnapshot('2025-01-01', {
        netIncome: { amountInMinorUnits: 2_000_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 10_000_000, currency: 'BRL' },
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'stock_roe',
      status: 'stale',
      observedValue: 200_000,
      referenceDate: '2025-01-01',
      staleAfterDays: 180,
    })
    expect(score.totalPoints).toBe(0)
  })

  it('uses the most recent stock snapshot when several exist', () => {
    const asset = buildAsset([
      stockSnapshot('2026-03-31', {
        netIncome: { amountInMinorUnits: 500_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 10_000_000, currency: 'BRL' },
      }),
      stockSnapshot('2026-06-30', {
        netIncome: { amountInMinorUnits: 2_000_000, currency: 'BRL' },
        totalEquity: { amountInMinorUnits: 10_000_000, currency: 'BRL' },
      }),
    ])

    const score = buildBrazilianStockScoreV1({
      asset,
      assetSegment: 'banco',
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({
      observedValue: 200_000,
      points: 2,
    })
  })
})
