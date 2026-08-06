import { describe, expect, it } from 'vitest'
import { buildInternationalEtfScoreV1 } from './buildInternationalEtfScoreV1'
import { DEFAULT_ETF_SIGNAL_RULES } from './defaultEtfSignalRules'

const NOW = '2026-08-05T00:00:00.000Z'

describe('buildInternationalEtfScoreV1', () => {
  it('scores +2 when the current CAPE is below its 10-year average', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      assetSegment: 'indice-amplo-us',
      capeHistory: [
        { referenceDate: '2026-06-01', valueScaled: 20_000_000 },
        { referenceDate: '2026-07-01', valueScaled: 30_000_000 },
        { referenceDate: '2026-08-01', valueScaled: 10_000_000 },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.totalPoints).toBe(2)
    expect(score.signals).toEqual([
      {
        signalKey: 'etf_cape_vs_10y_avg',
        status: 'applied',
        observedValue: -10_000_000,
        points: 2,
      },
    ])
  })

  it('scores -1 when the current CAPE is at or above its 10-year average', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      assetSegment: 'indice-amplo-us',
      capeHistory: [
        { referenceDate: '2026-07-01', valueScaled: 10_000_000 },
        { referenceDate: '2026-08-01', valueScaled: 30_000_000 },
      ],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ points: -1 })
  })

  it('marks the signal unavailable for VNQ (wrong regime)', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vnq',
      assetSegment: 'reit-us',
      capeHistory: [{ referenceDate: '2026-08-01', valueScaled: 30_000_000 }],
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
    ])
  })

  it('marks the signal unavailable for VEA (wrong regime)', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-vea',
      assetSegment: 'mercados-desenvolvidos-ex-us',
      capeHistory: [{ referenceDate: '2026-08-01', valueScaled: 30_000_000 }],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals[0]).toMatchObject({ status: 'unavailable' })
  })

  it('marks the signal unavailable when no CAPE history is loaded yet', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      assetSegment: 'indice-amplo-us',
      capeHistory: [],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals).toEqual([
      {
        signalKey: 'etf_cape_vs_10y_avg',
        status: 'unavailable',
        reason: 'missing-input',
      },
    ])
  })

  it('marks the signal stale when the latest CAPE point is past the threshold', () => {
    const score = buildInternationalEtfScoreV1({
      assetId: 'asset-voo',
      assetSegment: 'indice-amplo-us',
      capeHistory: [{ referenceDate: '2026-01-01', valueScaled: 30_000_000 }],
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
    })

    expect(score.signals).toEqual([
      {
        signalKey: 'etf_cape_vs_10y_avg',
        status: 'stale',
        observedValue: 0,
        referenceDate: '2026-01-01',
        staleAfterDays: 60,
      },
    ])
    expect(score.totalPoints).toBe(0)
  })
})
