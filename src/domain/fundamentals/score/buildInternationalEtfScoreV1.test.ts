import { describe, expect, it } from 'vitest'
import { buildInternationalEtfScoreV1 } from './buildInternationalEtfScoreV1'
import { DEFAULT_ETF_SIGNAL_RULES } from './defaultEtfSignalRules'

const NOW = '2026-08-05T00:00:00.000Z'

describe('buildInternationalEtfScoreV1 - CAPE signal', () => {
  it('scores +2 when the current CAPE is below its 10-year average', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [
        { referenceDate: '2026-06-01', valueScaled: 20_000_000 },
        { referenceDate: '2026-07-01', valueScaled: 30_000_000 },
        { referenceDate: '2026-08-01', valueScaled: 10_000_000 },
      ],
      etfValuations: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.totalPoints).toBe(2)
    expect(score.signals[0]).toEqual({
      signalKey: 'etf_cape_vs_10y_avg',
      status: 'applied',
      observedValue: -10_000_000,
      points: 2,
    })
  })

  it('scores -1 when the current CAPE is at or above its 10-year average', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [
        { referenceDate: '2026-07-01', valueScaled: 10_000_000 },
        { referenceDate: '2026-08-01', valueScaled: 30_000_000 },
      ],
      etfValuations: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ points: -1 })
  })

  it('marks the CAPE signal unavailable for VNQ (wrong regime)', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [{ referenceDate: '2026-08-01', valueScaled: 30_000_000 }],
      etfValuations: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'etf_cape_vs_10y_avg',
      status: 'unavailable',
      reason: 'wrong-regime',
    })
  })

  it('marks the CAPE signal unavailable for VEA (wrong regime)', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vea',
      ticker: 'VEA',
      assetSegment: 'mercados-desenvolvidos-ex-us',
      capeHistory: [{ referenceDate: '2026-08-01', valueScaled: 30_000_000 }],
      etfValuations: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ status: 'unavailable' })
  })

  it('marks the CAPE signal unavailable when no CAPE history is loaded yet', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      etfValuations: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'etf_cape_vs_10y_avg',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('marks the CAPE signal stale when the latest point is past the threshold', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [{ referenceDate: '2026-01-01', valueScaled: 30_000_000 }],
      etfValuations: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'etf_cape_vs_10y_avg',
      status: 'stale',
      observedValue: 0,
      referenceDate: '2026-01-01',
      staleAfterDays: 60,
    })
  })
})

describe('buildInternationalEtfScoreV1 - premium/discount signal (DEC-092)', () => {
  it('applies to all 3 ETF segments, not just VOO', () => {
    for (const [ticker, assetSegment] of [
      ['VOO', 'indice-amplo-us'],
      ['VNQ', 'reit-us'],
      ['VEA', 'mercados-desenvolvidos-ex-us'],
    ] as const) {
      const score = buildInternationalEtfScoreV1({
        assetId: `asset-${ticker.toLowerCase()}`,
        ticker,
        assetSegment,
        capeHistory: [],
        etfValuations: [
          {
            ticker,
            referenceDate: '2026-08-05',
            premiumDiscountBasisPoints: 0,
          },
        ],
        rules: DEFAULT_ETF_SIGNAL_RULES,
        now: NOW,
      })

      expect(score.signals[1]).toMatchObject({
        signalKey: 'etf_premium_discount_vs_nav',
        status: 'applied',
      })
    }
  })

  it('scores 0 within the normal tracking range (|deviation| <= 50bp)', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      etfValuations: [
        {
          ticker: 'VOO',
          referenceDate: '2026-08-05',
          premiumDiscountBasisPoints: 30,
        },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'etf_premium_discount_vs_nav',
      status: 'applied',
      observedValue: 30,
      points: 0,
    })
  })

  it('scores -1 for a discount wider than 50bp', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      etfValuations: [
        {
          ticker: 'VOO',
          referenceDate: '2026-08-05',
          premiumDiscountBasisPoints: -80,
        },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toMatchObject({ status: 'applied', points: -1 })
    expect(score.totalPoints).toBe(-1)
  })

  it('scores -1 for a premium wider than 50bp', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      etfValuations: [
        {
          ticker: 'VOO',
          referenceDate: '2026-08-05',
          premiumDiscountBasisPoints: 80,
        },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toMatchObject({ status: 'applied', points: -1 })
  })

  it('only picks the row matching this ticker, not another ETF', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      etfValuations: [
        {
          ticker: 'VNQ',
          referenceDate: '2026-08-05',
          premiumDiscountBasisPoints: 80,
        },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'etf_premium_discount_vs_nav',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('is unavailable when no valuation is loaded yet', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      etfValuations: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'etf_premium_discount_vs_nav',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('is stale when the latest point is past the 5-day threshold', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      etfValuations: [
        {
          ticker: 'VOO',
          referenceDate: '2026-07-20',
          premiumDiscountBasisPoints: -2,
        },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toEqual({
      signalKey: 'etf_premium_discount_vs_nav',
      status: 'stale',
      observedValue: -2,
      referenceDate: '2026-07-20',
      staleAfterDays: 5,
    })
  })

  it('picks the most recent point when several are loaded', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      etfValuations: [
        {
          ticker: 'VOO',
          referenceDate: '2026-08-03',
          premiumDiscountBasisPoints: 80,
        },
        {
          ticker: 'VOO',
          referenceDate: '2026-08-05',
          premiumDiscountBasisPoints: -2,
        },
        {
          ticker: 'VOO',
          referenceDate: '2026-08-04',
          premiumDiscountBasisPoints: 80,
        },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[1]).toMatchObject({ observedValue: -2, points: 0 })
  })
})

// Valores reais do N-CSR de VNQ (accession 0001104659-26-036013,
// exercício encerrado em 31/01/2026) e da série `fred-dfii10` real em
// produção (05/08/2026, 2,41%).
const VNQ_DISTRIBUTION_POINT = {
  ticker: 'VNQ',
  fiscalYearEndDate: '2026-01-31',
  totalDistributionsPerShare: { unscaledValue: 3472, scale: 3 },
  netAssetValueEndOfPeriod: { unscaledValue: 9081, scale: 2 },
}
const TIPS_RATE = {
  rateScaled: 2_410_000,
  rateScale: 1_000_000,
  pricedAt: '2026-08-05',
}

describe('buildInternationalEtfScoreV1 - DY vs TIPS spread signal', () => {
  it('scores +2 for VNQ when the spread is above 1 percentage point', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [VNQ_DISTRIBUTION_POINT],
      tipsRate: TIPS_RATE,
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toMatchObject({
      signalKey: 'etf_dy_tips_spread',
      status: 'applied',
      points: 2,
    })
    expect(score.totalPoints).toBe(2)
  })

  it('scores -2 when the spread is negative', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [VNQ_DISTRIBUTION_POINT],
      tipsRate: { ...TIPS_RATE, rateScaled: 5_000_000 },
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toMatchObject({ status: 'applied', points: -2 })
  })

  it('scores 0 inside the 0 to 1 percentage point band the rules leave neutral', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [VNQ_DISTRIBUTION_POINT],
      tipsRate: { ...TIPS_RATE, rateScaled: 3_500_000 },
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toMatchObject({ status: 'applied', points: 0 })
  })

  it('is wrong-regime for VOO and VEA (the rule applies only to the REIT ETF)', () => {
    for (const [ticker, assetSegment] of [
      ['VOO', 'indice-amplo-us'],
      ['VEA', 'mercados-desenvolvidos-ex-us'],
    ] as const) {
      const score = buildInternationalEtfScoreV1({
        assetId: `asset-${ticker.toLowerCase()}`,
        ticker,
        assetSegment,
        capeHistory: [],
        etfValuations: [],
        distributionValues: [{ ...VNQ_DISTRIBUTION_POINT, ticker }],
        tipsRate: TIPS_RATE,
        rules: DEFAULT_ETF_SIGNAL_RULES,
        now: NOW,
      })

      expect(score.signals[2]).toEqual({
        signalKey: 'etf_dy_tips_spread',
        status: 'unavailable',
        reason: 'wrong-regime',
      })
    }
  })

  it('is unavailable (never a silent zero) when no distribution value is loaded', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [],
      tipsRate: TIPS_RATE,
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toEqual({
      signalKey: 'etf_dy_tips_spread',
      status: 'unavailable',
      reason: 'missing-input',
    })
    expect(score.totalPoints).toBe(0)
  })

  it('is unavailable when the TIPS rate is missing', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [VNQ_DISTRIBUTION_POINT],
      tipsRate: null,
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toMatchObject({
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('only picks the row matching this ticker', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [{ ...VNQ_DISTRIBUTION_POINT, ticker: 'VOO' }],
      tipsRate: TIPS_RATE,
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toMatchObject({ reason: 'missing-input' })
  })

  it('picks the most recent fiscal year when several filings are loaded', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [
        {
          ...VNQ_DISTRIBUTION_POINT,
          fiscalYearEndDate: '2025-01-31',
          totalDistributionsPerShare: { unscaledValue: 3434, scale: 3 },
          netAssetValueEndOfPeriod: { unscaledValue: 9061, scale: 2 },
        },
        VNQ_DISTRIBUTION_POINT,
      ],
      tipsRate: TIPS_RATE,
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    const signal = score.signals[2]
    expect(signal.status).toBe('applied')
    expect(
      signal.status === 'applied' ? signal.observedValue : null
    ).toBeCloseTo(1.413367, 6)
  })

  it('is stale when the fiscal year end is past the N-CSR threshold', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [
        { ...VNQ_DISTRIBUTION_POINT, fiscalYearEndDate: '2024-01-31' },
      ],
      tipsRate: TIPS_RATE,
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toMatchObject({
      status: 'stale',
      referenceDate: '2024-01-31',
      staleAfterDays: 450,
    })
    expect(score.totalPoints).toBe(0)
  })

  it('is stale when the TIPS rate itself is past its own threshold', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      ticker: 'VNQ',
      assetSegment: 'reit-us',
      capeHistory: [],
      etfValuations: [],
      distributionValues: [VNQ_DISTRIBUTION_POINT],
      tipsRate: { ...TIPS_RATE, pricedAt: '2026-07-01' },
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[2]).toMatchObject({
      status: 'stale',
      referenceDate: '2026-07-01',
      staleAfterDays: 5,
    })
  })
})

describe('buildInternationalEtfScoreV1 - out of ETF regime entirely', () => {
  it('marks every signal unavailable for a non-ETF segment', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-stock',
      ticker: 'BBAS3',
      assetSegment: 'banco',
      capeHistory: [{ referenceDate: '2026-08-01', valueScaled: 30_000_000 }],
      etfValuations: [
        {
          ticker: 'BBAS3',
          referenceDate: '2026-08-05',
          premiumDiscountBasisPoints: 0,
        },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.totalPoints).toBe(0)
    expect(score.signals).toEqual([
      {
        signalKey: 'etf_cape_vs_10y_avg',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
      {
        signalKey: 'etf_premium_discount_vs_nav',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
      {
        signalKey: 'etf_dy_tips_spread',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
    ])
  })

  it('marks every signal unavailable for a null segment', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      ticker: 'VOO',
      assetSegment: null,
      capeHistory: [],
      etfValuations: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals).toEqual([
      {
        signalKey: 'etf_cape_vs_10y_avg',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
      {
        signalKey: 'etf_premium_discount_vs_nav',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
      {
        signalKey: 'etf_dy_tips_spread',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
    ])
  })
})
