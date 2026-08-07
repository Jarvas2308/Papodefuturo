import { describe, expect, it } from 'vitest'
import type {
  FundamentalDerivedFactsV1,
  FundamentalFactsV1,
} from '../../../domain/fundamentals'
import type { SignalRule } from '../../../data/repositories/contracts'
import type { Asset, AssetPrice } from '../../../domain/models'
import {
  buildContributionAssetScoresV1,
  getMissingDefaultFiiSignalRules,
  toContributionAssetScores,
} from './buildContributionAssetScores'
import {
  DEFAULT_ETF_SIGNAL_RULES,
  DEFAULT_FII_TIJOLO_SIGNAL_RULES,
  DEFAULT_STOCK_SIGNAL_RULES,
} from '../../../domain/fundamentals/score'

const NOW = '2026-08-05T00:00:00.000Z'

function fiiTijoloAsset(id: string): Asset {
  return {
    id,
    ticker: 'KNRI11',
    name: 'Kinea Renda Imobiliária',
    category: 'real-estate-fund',
    market: 'BR',
    status: 'active',
    assetType: 'tijolo',
    assetSegment: 'hibrido',
  }
}

function emptyFacts(): FundamentalFactsV1 {
  return {
    schemaVersion: 'fundamental-facts.v1',
    generatedAt: '2026-08-05T00:00:00.000Z',
    assets: [],
    dataCoverage: {
      eligibleAssetCount: 0,
      assetWithFactsCount: 0,
      missingFundamentalAssetIds: [],
      totalSnapshotCount: 0,
      brazilianStockSnapshotCount: 0,
      realEstateFundSnapshotCount: 0,
      internationalEtfSnapshotCount: 0,
    },
    limitations: [],
  }
}

function emptyDerived(): FundamentalDerivedFactsV1 {
  return {
    schemaVersion: 'fundamental-derived-facts.v1',
    generatedAt: '2026-08-05T00:00:00.000Z',
    assets: [],
    dataCoverage: {
      eligibleAssetCount: 0,
      assetWithDerivedSnapshotsCount: 0,
      totalDerivedSnapshotCount: 0,
      availableMetricCount: 0,
      unavailableMetricCount: 0,
      availableStockMetricCount: 0,
      availableRealEstateFundMetricCount: 0,
      availableInternationalEtfMetricCount: 0,
    },
    limitations: [],
  }
}

describe('getMissingDefaultFiiSignalRules', () => {
  it('returns every default rule (FII, stock and ETF) when the user has none', () => {
    const missing = getMissingDefaultFiiSignalRules([])
    expect(missing).toEqual([
      ...DEFAULT_FII_TIJOLO_SIGNAL_RULES,
      ...DEFAULT_STOCK_SIGNAL_RULES,
      ...DEFAULT_ETF_SIGNAL_RULES,
    ])
  })

  it('skips signal keys the user already has a rule for', () => {
    const existing: SignalRule[] = [
      {
        id: 'rule-1',
        signalKey: 'fii_vacancy',
        minValue: null,
        maxValue: 999,
        points: 5,
        enabled: true,
      },
    ]

    const missing = getMissingDefaultFiiSignalRules(existing)

    expect(missing.every((rule) => rule.signalKey !== 'fii_vacancy')).toBe(true)
    expect(missing.some((rule) => rule.signalKey === 'fii_pvp')).toBe(true)
    expect(missing.some((rule) => rule.signalKey === 'stock_roe')).toBe(true)
  })

  it('returns nothing once every default signal key is covered', () => {
    const allDefaultKeys = [
      ...DEFAULT_FII_TIJOLO_SIGNAL_RULES,
      ...DEFAULT_STOCK_SIGNAL_RULES,
      ...DEFAULT_ETF_SIGNAL_RULES,
    ].map((rule) => rule.signalKey)
    const existing: SignalRule[] = [...new Set(allDefaultKeys)].map(
      (signalKey, index) => ({
        id: `rule-${index}`,
        signalKey,
        minValue: null,
        maxValue: null,
        points: 0,
        enabled: true,
      })
    )

    expect(getMissingDefaultFiiSignalRules(existing)).toEqual([])
  })
})

describe('buildContributionAssetScoresV1', () => {
  it('skips assets that are not FII tijolo', () => {
    const stockAsset: Asset = {
      id: 'asset-bbas3',
      ticker: 'BBAS3',
      name: 'Banco do Brasil',
      category: 'brazilian-stock',
      market: 'BR',
      status: 'active',
      assetType: null,
      assetSegment: 'banco',
    }

    const scores = buildContributionAssetScoresV1({
      assets: [stockAsset],
      facts: emptyFacts(),
      derived: emptyDerived(),
      latestPricesByAsset: new Map(),
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
      now: NOW,
      capeHistory: [],
      etfValuations: [],
      proventoDeclarationsByTicker: new Map(),
    })

    expect(scores).toEqual([])
  })

  it('skips a FII tijolo asset with no fundamentals facts loaded yet', () => {
    const asset = fiiTijoloAsset('asset-knri11')

    const scores = buildContributionAssetScoresV1({
      assets: [asset],
      facts: emptyFacts(),
      derived: emptyDerived(),
      latestPricesByAsset: new Map(),
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
      now: NOW,
      capeHistory: [],
      etfValuations: [],
      proventoDeclarationsByTicker: new Map(),
    })

    expect(scores).toEqual([])
  })

  it('computes a score for a FII tijolo asset with trimestral facts', () => {
    const asset = fiiTijoloAsset('asset-knri11')
    const facts: FundamentalFactsV1 = {
      ...emptyFacts(),
      assets: [
        {
          assetId: asset.id,
          ticker: 'KNRI11',
          name: asset.name,
          category: 'real-estate-fund',
          snapshots: [
            {
              assetId: asset.id,
              kind: 'real-estate-fund',
              referenceDate: '2026-06-30',
              period: 'quarterly',
              source: 'cvm-fii-inf-trimestral',
              sourceDocumentId: 'doc-1',
              facts: {
                netAssetValue: null,
                issuedShares: null,
                shareholderCount: null,
                vacancyInBasisPoints: 300,
                tenantConcentrationInBasisPoints: 2_000,
                waleMonthsScaledBy100: 6_000,
              },
            },
          ],
        },
      ],
    }

    const scores = buildContributionAssetScoresV1({
      assets: [asset],
      facts,
      derived: emptyDerived(),
      latestPricesByAsset: new Map(),
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
      now: NOW,
      capeHistory: [],
      etfValuations: [],
      proventoDeclarationsByTicker: new Map(),
    })

    expect(scores).toHaveLength(1)
    expect(scores[0]).toMatchObject({ assetId: asset.id, totalPoints: 2 })
  })

  it('ignores a matching price quoted in a currency other than BRL', () => {
    const asset = fiiTijoloAsset('asset-knri11')
    const facts: FundamentalFactsV1 = {
      ...emptyFacts(),
      assets: [
        {
          assetId: asset.id,
          ticker: 'KNRI11',
          name: asset.name,
          category: 'real-estate-fund',
          snapshots: [],
        },
      ],
    }
    const derived: FundamentalDerivedFactsV1 = {
      ...emptyDerived(),
      assets: [
        {
          assetId: asset.id,
          ticker: 'KNRI11',
          name: asset.name,
          category: 'real-estate-fund',
          snapshots: [
            {
              assetId: asset.id,
              kind: 'real-estate-fund',
              referenceDate: '2026-06-30',
              period: 'monthly',
              source: 'cvm-fii-inf-mensal',
              sourceDocumentId: 'doc-1',
              metrics: {
                netAssetValuePerIssuedShare: {
                  status: 'available',
                  formulaId: 'fii-net-asset-value-per-issued-share.v1',
                  inputs: { netAssetValue: null, issuedShares: null },
                  value: {
                    scaledAmountInMinorUnitsPerUnit: 1_000_000_000,
                    scale: 1_000_000,
                    currency: 'BRL',
                    rounding: 'half-away-from-zero',
                  },
                },
              },
            },
          ],
        },
      ],
    }
    const wrongCurrencyPrice: AssetPrice = {
      id: 'price-1',
      assetId: asset.id,
      price: { amountInMinorUnits: 900, currency: 'USD' },
      pricedAt: '2026-08-05T00:00:00.000Z',
      source: 'market-provider',
    }

    const scores = buildContributionAssetScoresV1({
      assets: [asset],
      facts,
      derived,
      latestPricesByAsset: new Map([[asset.id, wrongCurrencyPrice]]),
      rules: DEFAULT_FII_TIJOLO_SIGNAL_RULES,
      now: NOW,
      capeHistory: [],
      etfValuations: [],
      proventoDeclarationsByTicker: new Map(),
    })

    expect(scores).toHaveLength(1)
    expect(scores[0]).toMatchObject({ assetId: asset.id, totalPoints: 0 })
  })

  it('computes ROE for a brazilian-stock asset', () => {
    const asset: Asset = {
      id: 'asset-bbas3',
      ticker: 'BBAS3',
      name: 'Banco do Brasil',
      category: 'brazilian-stock',
      market: 'BR',
      status: 'active',
      assetType: null,
      assetSegment: 'banco',
    }
    const facts: FundamentalFactsV1 = {
      ...emptyFacts(),
      assets: [
        {
          assetId: asset.id,
          ticker: 'BBAS3',
          name: asset.name,
          category: 'brazilian-stock',
          snapshots: [
            {
              assetId: asset.id,
              kind: 'brazilian-stock',
              referenceDate: '2026-06-30',
              period: 'annual',
              source: 'cvm-dfp',
              sourceDocumentId: 'doc-1',
              facts: {
                totalRevenue: null,
                netIncome: { amountInMinorUnits: 2_000_000, currency: 'BRL' },
                totalAssets: null,
                totalEquity: {
                  amountInMinorUnits: 10_000_000,
                  currency: 'BRL',
                },
                operatingCashFlow: null,
                issuedShares: null,
                financialDebtCurrent: null,
                financialDebtNonCurrent: null,
                cashAndEquivalents: null,
                ebit: null,
                depreciationAndAmortization: null,
              },
            },
          ],
        },
      ],
    }

    const scores = buildContributionAssetScoresV1({
      assets: [asset],
      facts,
      derived: emptyDerived(),
      latestPricesByAsset: new Map(),
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
      capeHistory: [],
      etfValuations: [],
      proventoDeclarationsByTicker: new Map(),
    })

    expect(scores).toHaveLength(1)
    expect(scores[0]).toMatchObject({ assetId: asset.id, totalPoints: 2 })
  })

  it('skips a brazilian-stock asset with no fundamentals facts loaded yet', () => {
    const asset: Asset = {
      id: 'asset-bbas3',
      ticker: 'BBAS3',
      name: 'Banco do Brasil',
      category: 'brazilian-stock',
      market: 'BR',
      status: 'active',
      assetType: null,
      assetSegment: 'banco',
    }

    const scores = buildContributionAssetScoresV1({
      assets: [asset],
      facts: emptyFacts(),
      derived: emptyDerived(),
      latestPricesByAsset: new Map(),
      rules: DEFAULT_STOCK_SIGNAL_RULES,
      now: NOW,
      capeHistory: [],
      etfValuations: [],
      proventoDeclarationsByTicker: new Map(),
    })

    expect(scores).toEqual([])
  })

  it('scores CAPE deviation for VOO using the CAPE history, independent of fundamental_snapshots', () => {
    const asset: Asset = {
      id: 'asset-voo',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'international-etf',
      market: 'US',
      status: 'active',
      assetType: null,
      assetSegment: 'indice-amplo-us',
    }

    const scores = buildContributionAssetScoresV1({
      assets: [asset],
      facts: emptyFacts(),
      derived: emptyDerived(),
      latestPricesByAsset: new Map(),
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
      capeHistory: [
        { referenceDate: '2026-06-01', valueScaled: 20_000_000 },
        { referenceDate: '2026-07-01', valueScaled: 30_000_000 },
        { referenceDate: '2026-08-01', valueScaled: 10_000_000 },
      ],
      etfValuations: [],
      proventoDeclarationsByTicker: new Map(),
    })

    expect(scores).toHaveLength(1)
    expect(scores[0]).toMatchObject({ assetId: asset.id, totalPoints: 2 })
  })

  it('marks VNQ (reit-us) as wrong-regime for the CAPE signal', () => {
    const asset: Asset = {
      id: 'asset-vnq',
      ticker: 'VNQ',
      name: 'Vanguard Real Estate ETF',
      category: 'international-etf',
      market: 'US',
      status: 'active',
      assetType: null,
      assetSegment: 'reit-us',
    }

    const scores = buildContributionAssetScoresV1({
      assets: [asset],
      facts: emptyFacts(),
      derived: emptyDerived(),
      latestPricesByAsset: new Map(),
      rules: DEFAULT_ETF_SIGNAL_RULES,
      now: NOW,
      capeHistory: [{ referenceDate: '2026-08-01', valueScaled: 30_000_000 }],
      etfValuations: [],
      proventoDeclarationsByTicker: new Map(),
    })

    expect(scores).toHaveLength(1)
    expect(scores[0]).toMatchObject({
      assetId: asset.id,
      totalPoints: 0,
      signals: [
        {
          signalKey: 'etf_cape_vs_10y_avg',
          status: 'unavailable',
          reason: 'wrong-regime',
        },
        {
          signalKey: 'etf_premium_discount_vs_nav',
          status: 'unavailable',
          reason: 'missing-input',
        },
      ],
    })
  })
})

describe('toContributionAssetScores', () => {
  it('reduces full scores to the assetId/points shape the greedy loop consumes', () => {
    const reduced = toContributionAssetScores([
      {
        schemaVersion: 'asset-score.v1',
        assetId: 'asset-knri11',
        totalPoints: 2,
        signals: [],
      },
    ])

    expect(reduced).toEqual([{ assetId: 'asset-knri11', points: 2 }])
  })
})
