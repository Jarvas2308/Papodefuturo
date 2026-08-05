import { describe, expect, it } from 'vitest'
import type { FundamentalDerivedFactsAsset } from '../derived/types'
import type { FundamentalFactsAsset } from '../types'
import { buildFiiTijoloScoreV1 } from './buildFiiTijoloScoreV1'
import { DEFAULT_FII_TIJOLO_SIGNAL_RULES } from './defaultFiiSignalRules'

function monthlyDerivedSnapshot(
  referenceDate: string,
  navPerShareScaledAmount: number | null
): FundamentalDerivedFactsAsset['snapshots'][number] {
  return {
    assetId: 'asset-knri11',
    kind: 'real-estate-fund',
    referenceDate,
    period: 'monthly',
    source: 'cvm-fii-inf-mensal',
    sourceDocumentId: `cvm-fii-knri11-${referenceDate}`,
    metrics: {
      netAssetValuePerIssuedShare:
        navPerShareScaledAmount === null
          ? {
              status: 'unavailable',
              formulaId: 'fii-net-asset-value-per-issued-share.v1',
              inputs: { netAssetValue: null, issuedShares: null },
              reason: 'missing-input',
            }
          : {
              status: 'available',
              formulaId: 'fii-net-asset-value-per-issued-share.v1',
              inputs: { netAssetValue: null, issuedShares: null },
              value: {
                scaledAmountInMinorUnitsPerUnit: navPerShareScaledAmount,
                scale: 1_000_000,
                currency: 'BRL',
                rounding: 'half-away-from-zero',
              },
            },
    },
  }
}

function buildDerivedAsset(
  snapshots: FundamentalDerivedFactsAsset['snapshots']
): FundamentalDerivedFactsAsset {
  return {
    assetId: 'asset-knri11',
    ticker: 'KNRI11',
    name: 'Kinea Renda Imobiliária',
    category: 'real-estate-fund',
    snapshots,
  }
}

function trimestralSnapshot(
  referenceDate: string,
  facts: {
    vacancyInBasisPoints?: number | null
    tenantConcentrationInBasisPoints?: number | null
    waleMonthsScaledBy100?: number | null
  } = {}
): FundamentalFactsAsset['snapshots'][number] {
  return {
    assetId: 'asset-knri11',
    kind: 'real-estate-fund',
    referenceDate,
    period: 'quarterly',
    source: 'cvm-fii-inf-trimestral',
    sourceDocumentId: `cvm-fii-knri11-${referenceDate}`,
    facts: {
      netAssetValue: null,
      issuedShares: null,
      shareholderCount: null,
      vacancyInBasisPoints: facts.vacancyInBasisPoints ?? null,
      tenantConcentrationInBasisPoints:
        facts.tenantConcentrationInBasisPoints ?? null,
      waleMonthsScaledBy100: facts.waleMonthsScaledBy100 ?? null,
    },
  }
}

function buildAsset(
  snapshots: FundamentalFactsAsset['snapshots']
): FundamentalFactsAsset {
  return {
    assetId: 'asset-knri11',
    ticker: 'KNRI11',
    name: 'Kinea Renda Imobiliária',
    category: 'real-estate-fund',
    snapshots,
  }
}

describe('buildFiiTijoloScoreV1', () => {
  it('scores all 3 signals as applied for a well-behaved tijolo fund', () => {
    const asset = buildAsset([
      trimestralSnapshot('2026-06-30', {
        vacancyInBasisPoints: 300, // < 5% -> +1
        tenantConcentrationInBasisPoints: 2_000, // < 40% -> 0 (no matching rule)
        waleMonthsScaledBy100: 6_000, // 60 months -> +1
      }),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.totalPoints).toBe(2)
    expect(score.signals).toEqual([
      {
        signalKey: 'fii_vacancy',
        status: 'applied',
        observedValue: 300,
        points: 1,
      },
      {
        signalKey: 'fii_tenant_concentration',
        status: 'applied',
        observedValue: 2_000,
        points: 0,
      },
      {
        signalKey: 'fii_wale_months',
        status: 'applied',
        observedValue: 6_000,
        points: 1,
      },
      { signalKey: 'fii_pvp', status: 'unavailable', reason: 'missing-input' },
    ])
  })

  it('penalizes high vacancy, high concentration and short WALE', () => {
    const asset = buildAsset([
      trimestralSnapshot('2026-06-30', {
        vacancyInBasisPoints: 2_000, // > 15% -> -1
        tenantConcentrationInBasisPoints: 5_000, // > 40% -> -1
        waleMonthsScaledBy100: 1_200, // 12 months -> -1
      }),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.totalPoints).toBe(-3)
  })

  it('marks every signal unavailable for a non-tijolo asset type', () => {
    const asset = buildAsset([
      trimestralSnapshot('2026-06-30', { vacancyInBasisPoints: 300 }),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: 'papel',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.totalPoints).toBe(0)
    expect(score.signals).toEqual([
      {
        signalKey: 'fii_vacancy',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
      {
        signalKey: 'fii_tenant_concentration',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
      {
        signalKey: 'fii_wale_months',
        status: 'unavailable',
        reason: 'wrong-regime',
      },
      { signalKey: 'fii_pvp', status: 'unavailable', reason: 'wrong-regime' },
    ])
  })

  it('marks every signal unavailable when assetType is null', () => {
    const asset = buildAsset([])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: null,
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(
      score.signals.every((signal) => signal.status === 'unavailable')
    ).toBe(true)
  })

  it('marks a signal unavailable when no trimestral snapshot exists yet', () => {
    const asset = buildAsset([])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.signals).toEqual([
      {
        signalKey: 'fii_vacancy',
        status: 'unavailable',
        reason: 'missing-input',
      },
      {
        signalKey: 'fii_tenant_concentration',
        status: 'unavailable',
        reason: 'missing-input',
      },
      {
        signalKey: 'fii_wale_months',
        status: 'unavailable',
        reason: 'missing-input',
      },
      { signalKey: 'fii_pvp', status: 'unavailable', reason: 'missing-input' },
    ])
  })

  it('uses the most recent trimestral snapshot when several exist', () => {
    const asset = buildAsset([
      trimestralSnapshot('2026-03-31', { vacancyInBasisPoints: 2_000 }),
      trimestralSnapshot('2026-06-30', { vacancyInBasisPoints: 300 }),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.signals[0]).toMatchObject({ observedValue: 300, points: 1 })
  })

  it('ignores monthly snapshots when extracting trimestral facts', () => {
    const monthlySnapshot: FundamentalFactsAsset['snapshots'][number] = {
      assetId: 'asset-knri11',
      kind: 'real-estate-fund',
      referenceDate: '2026-07-31',
      period: 'monthly',
      source: 'cvm-fii-inf-mensal',
      sourceDocumentId: 'cvm-fii-knri11-2026-07',
      facts: {
        netAssetValue: null,
        issuedShares: null,
        shareholderCount: null,
        vacancyInBasisPoints: null,
        tenantConcentrationInBasisPoints: null,
        waleMonthsScaledBy100: null,
      },
    }
    const asset = buildAsset([
      trimestralSnapshot('2026-06-30', { vacancyInBasisPoints: 300 }),
      monthlySnapshot,
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.signals[0]).toMatchObject({ observedValue: 300 })
  })

  it('defaults to 0 points when a value has no matching enabled rule', () => {
    const asset = buildAsset([
      trimestralSnapshot('2026-06-30', { vacancyInBasisPoints: 800 }),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: 'tijolo',
      rules: [],
    })

    expect(score.signals[0]).toEqual({
      signalKey: 'fii_vacancy',
      status: 'applied',
      observedValue: 800,
      points: 0,
    })
  })

  it('ignores disabled rules', () => {
    const asset = buildAsset([
      trimestralSnapshot('2026-06-30', { vacancyInBasisPoints: 300 }),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      assetType: 'tijolo',
      rules: [
        {
          signalKey: 'fii_vacancy',
          minValue: null,
          maxValue: 500,
          points: 1,
          enabled: false,
        },
      ],
    })

    expect(score.signals[0]).toMatchObject({ points: 0 })
  })
})

describe('buildFiiTijoloScoreV1 - P/VP signal', () => {
  it('scores P/VP as applied when derivedAsset and market price are both present', () => {
    const asset = buildAsset([])
    const derivedAsset = buildDerivedAsset([
      monthlyDerivedSnapshot('2026-06-30', 1_000_000_000), // NAV/share = 1000 cents
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      derivedAsset,
      latestMarketPriceInMinorUnits: 850, // 850/1000 = 0.85 -> < 0.90 -> +2
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'fii_pvp',
      status: 'applied',
      observedValue: 850_000,
      points: 2,
    })
  })

  it('marks P/VP unavailable when derivedAsset is absent', () => {
    const asset = buildAsset([])

    const score = buildFiiTijoloScoreV1({
      asset,
      latestMarketPriceInMinorUnits: 850,
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'fii_pvp',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('marks P/VP unavailable when market price is absent', () => {
    const asset = buildAsset([])
    const derivedAsset = buildDerivedAsset([
      monthlyDerivedSnapshot('2026-06-30', 1_000_000_000),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      derivedAsset,
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'fii_pvp',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('marks P/VP unavailable when the derived metric itself is unavailable', () => {
    const asset = buildAsset([])
    const derivedAsset = buildDerivedAsset([
      monthlyDerivedSnapshot('2026-06-30', null),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      derivedAsset,
      latestMarketPriceInMinorUnits: 850,
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.signals[3]).toEqual({
      signalKey: 'fii_pvp',
      status: 'unavailable',
      reason: 'missing-input',
    })
  })

  it('uses the most recent monthly derived snapshot when several exist', () => {
    const asset = buildAsset([])
    const derivedAsset = buildDerivedAsset([
      monthlyDerivedSnapshot('2026-05-31', 2_000_000_000),
      monthlyDerivedSnapshot('2026-06-30', 1_000_000_000),
    ])

    const score = buildFiiTijoloScoreV1({
      asset,
      derivedAsset,
      latestMarketPriceInMinorUnits: 1_000, // 1000/1000 = 1.0 -> [1.00,1.10) -> 0
      assetType: 'tijolo',
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
    })

    expect(score.signals[3]).toMatchObject({
      observedValue: 1_000_000,
      points: 0,
    })
  })

  it.each([
    [1_099, 1_099_000, 0], // just under 1.10 -> still 0
    [1_100, 1_100_000, -2], // exactly 1.10 -> penalized (max exclusive on prior bucket)
  ])(
    'applies the P/VP boundary convention at market price %i',
    (marketPrice, expectedObserved, expectedPoints) => {
      const asset = buildAsset([])
      const derivedAsset = buildDerivedAsset([
        monthlyDerivedSnapshot('2026-06-30', 1_000_000_000),
      ])

      const score = buildFiiTijoloScoreV1({
        asset,
        derivedAsset,
        latestMarketPriceInMinorUnits: marketPrice,
        assetType: 'tijolo',
        rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
      })

      expect(score.signals[3]).toMatchObject({
        observedValue: expectedObserved,
        points: expectedPoints,
      })
    }
  )
})
