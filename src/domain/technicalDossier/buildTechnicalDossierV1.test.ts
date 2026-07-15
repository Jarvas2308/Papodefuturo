import { describe, expect, it } from 'vitest'
import {
  EXCHANGE_RATE_SCALE,
  type Asset,
  type AssetPrice,
  type ExchangeRate,
} from '../models'
import type { PortfolioSnapshot } from '../portfolioSnapshot'
import type { StrategyCategory } from '../../features/strategy/types'
import type {
  ContributionAssetTarget,
  TargetAllocationContributionResult,
} from '../../features/contribution/types'
import { MAX_PLAN_ASSETS } from '../../features/contribution/strategies/targetAllocationStrategy'
import { buildTechnicalDossierV1 } from './buildTechnicalDossierV1'
import type { BuildTechnicalDossierV1Input } from './types'

const bbas3: Asset = {
  id: 'asset-bbas3',
  ticker: 'BBAS3',
  name: 'Banco do Brasil',
  category: 'brazilian-stock',
  market: 'BR',
  status: 'active',
}

const voo: Asset = {
  id: 'asset-voo',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'international-etf',
  market: 'US',
  status: 'active',
}

const knri11: Asset = {
  id: 'asset-knri11',
  ticker: 'KNRI11',
  name: 'Kinea Renda Imobiliária',
  category: 'real-estate-fund',
  market: 'BR',
  status: 'active',
}

const inactiveAsset: Asset = {
  id: 'asset-inactive',
  ticker: 'INACTIVE',
  name: 'Ativo inativo',
  category: 'brazilian-stock',
  market: 'BR',
  status: 'inactive',
}

const cashAsset: Asset = {
  id: 'asset-cash',
  ticker: 'CASH',
  name: 'Caixa',
  category: 'cash',
  market: 'INTERNAL',
  status: 'active',
}

const usdRate: ExchangeRate = {
  id: 'rate-latest',
  baseCurrency: 'USD',
  quoteCurrency: 'BRL',
  rateScaled: 5_500_000,
  rateScale: EXCHANGE_RATE_SCALE,
  pricedAt: '2026-07-14T11:00:00.000Z',
  source: 'market-provider',
}

function createPortfolioSnapshot(): PortfolioSnapshot {
  return {
    positions: [
      {
        asset: voo,
        currency: 'USD',
        quantity: 2,
        investedMinorNative: 80_000,
        averagePriceMinorNative: 40_000,
        currentPriceMinorNative: 42_000,
        currentMinorNative: 84_000,
        resultMinorNative: 4_000,
        resultPercentage: 5,
        investedMinorInBrl: 440_000,
        currentMinorInBrl: 462_000,
        resultMinorInBrl: 22_000,
        hasCurrentPrice: true,
      },
      {
        asset: bbas3,
        currency: 'BRL',
        quantity: 10,
        investedMinorNative: 250_000,
        averagePriceMinorNative: 25_000,
        currentPriceMinorNative: 27_000,
        currentMinorNative: 270_000,
        resultMinorNative: 20_000,
        resultPercentage: 8,
        investedMinorInBrl: 250_000,
        currentMinorInBrl: 270_000,
        resultMinorInBrl: 20_000,
        hasCurrentPrice: true,
      },
    ],
    categories: [],
    totalInvestedMinorInBrl: 690_000,
    totalCurrentMinorInBrl: 732_000,
    totalResultMinorInBrl: 42_000,
    totalResultPercentage: 6.086956521739131,
    hasUsdPosition: true,
    latestUsdBrlRate: usdRate,
  }
}

function createStrategy(): StrategyCategory[] {
  return [
    {
      id: 'international',
      name: 'Internacional',
      targetInBasisPoints: 4_000,
      assets: [
        {
          assetId: voo.id,
          ticker: voo.ticker,
          assetName: voo.name,
          targetWithinCategoryInBasisPoints: 10_000,
        },
      ],
    },
    {
      id: 'brazilian-stocks',
      name: 'Ações brasileiras',
      targetInBasisPoints: 6_000,
      assets: [
        {
          assetId: bbas3.id,
          ticker: bbas3.ticker,
          assetName: bbas3.name,
          targetWithinCategoryInBasisPoints: 10_000,
        },
      ],
    },
  ]
}

function createGlobalTargets(): ContributionAssetTarget[] {
  return [
    { assetId: voo.id, targetInBasisPoints: 4_000 },
    { assetId: bbas3.id, targetInBasisPoints: 6_000 },
  ]
}

function createPrices(): AssetPrice[] {
  return [
    {
      id: 'price-bbas-new',
      assetId: bbas3.id,
      price: { amountInMinorUnits: 27_000, currency: 'BRL' },
      pricedAt: '2026-07-14T10:00:00.000Z',
      source: 'manual',
    },
    {
      id: 'price-voo-new',
      assetId: voo.id,
      price: { amountInMinorUnits: 42_000, currency: 'USD' },
      pricedAt: '2026-07-14T10:30:00.000Z',
      source: 'market-provider',
    },
    {
      id: 'price-bbas-old',
      assetId: bbas3.id,
      price: { amountInMinorUnits: 25_000, currency: 'BRL' },
      pricedAt: '2026-07-13T10:00:00.000Z',
      source: 'market-provider',
    },
    {
      id: 'price-inactive',
      assetId: inactiveAsset.id,
      price: { amountInMinorUnits: 1_000, currency: 'BRL' },
      pricedAt: '2026-07-14T10:00:00.000Z',
      source: 'manual',
    },
  ]
}

function createRates(): ExchangeRate[] {
  return [
    usdRate,
    {
      ...usdRate,
      id: 'rate-old',
      rateScaled: 5_000_000,
      pricedAt: '2026-07-13T11:00:00.000Z',
      source: 'manual',
    },
  ]
}

function createTechnicalPlan(): TargetAllocationContributionResult {
  return {
    strategy: 'target-allocation',
    distribuicao: [
      { assetId: voo.id, valorEmCentavos: 12_000 },
      { assetId: bbas3.id, valorEmCentavos: 2_000 },
    ],
    totalDistribuidoEmCentavos: 14_000,
    saldoNaoAlocadoEmCentavos: 1_000,
    technicalImpact: {
      totalDeviationBeforeInBasisPoints: 2_345,
      totalDeviationAfterInBasisPoints: 1_111,
      totalDeviationReductionInBasisPoints: 1_234,
      stopReason: 'no-affordable-unit',
      items: [
        {
          assetId: voo.id,
          suggestedQuantity: 3,
          unitPriceInCents: 4_000,
          allocatedInCents: 12_000,
          differenceBeforeInBasisPoints: -321,
          differenceAfterInBasisPoints: -123,
        },
        {
          assetId: bbas3.id,
          suggestedQuantity: 2,
          unitPriceInCents: 1_000,
          allocatedInCents: 2_000,
          differenceBeforeInBasisPoints: 321,
          differenceAfterInBasisPoints: 123,
        },
      ],
    },
  }
}

function createInput(): BuildTechnicalDossierV1Input {
  return {
    generatedAt: '2026-07-14T12:00:00.000Z',
    contributionAmountInCents: 15_000,
    assets: [voo, bbas3, knri11, inactiveAsset, cashAsset],
    portfolioSnapshot: createPortfolioSnapshot(),
    strategy: createStrategy(),
    globalAssetTargets: createGlobalTargets(),
    assetPrices: createPrices(),
    exchangeRates: createRates(),
    technicalPlan: createTechnicalPlan(),
  }
}

describe('buildTechnicalDossierV1', () => {
  it('creates a complete TechnicalDossierV1', () => {
    const dossier = buildTechnicalDossierV1(createInput())

    expect(dossier).toEqual(
      expect.objectContaining({
        generatedAt: '2026-07-14T12:00:00.000Z',
        portfolio: expect.any(Object),
        strategy: expect.any(Object),
        marketFacts: expect.any(Object),
        technicalPlan: expect.any(Object),
        deviations: expect.any(Object),
        dataCoverage: expect.any(Object),
        limitations: expect.any(Array),
      })
    )
  })

  it('uses the stable technical-dossier.v1 schema version', () => {
    expect(buildTechnicalDossierV1(createInput()).schemaVersion).toBe(
      'technical-dossier.v1'
    )
  })

  it('produces deeply equal outputs for the same input', () => {
    const input = createInput()
    expect(buildTechnicalDossierV1(input)).toEqual(
      buildTechnicalDossierV1(input)
    )
  })

  it('does not mutate any input', () => {
    const input = createInput()
    const before = structuredClone(input)

    buildTechnicalDossierV1(input)

    expect(input).toEqual(before)
  })

  it('rejects an invalid generatedAt', () => {
    const input = createInput()
    input.generatedAt = 'not-an-iso-date'

    expect(() => buildTechnicalDossierV1(input)).toThrow(RangeError)
  })

  it('rejects a negative contribution amount', () => {
    const input = createInput()
    input.contributionAmountInCents = -1

    expect(() => buildTechnicalDossierV1(input)).toThrow(RangeError)
  })

  it('rejects an unsafe contribution amount', () => {
    const input = createInput()
    input.contributionAmountInCents = Number.MAX_SAFE_INTEGER + 1

    expect(() => buildTechnicalDossierV1(input)).toThrow(RangeError)
  })

  it('copies portfolio snapshot values without recalculating them', () => {
    const input = createInput()
    input.portfolioSnapshot.totalResultPercentage = 123.456
    input.portfolioSnapshot.positions[0]!.averagePriceMinorNative = 987_654

    const dossier = buildTechnicalDossierV1(input)

    expect(dossier.portfolio.totalResultPercentage).toBe(123.456)
    expect(dossier.portfolio.positions[0]?.averagePriceMinorNative).toBe(
      987_654
    )
  })

  it('preserves portfolio snapshot position order', () => {
    expect(
      buildTechnicalDossierV1(createInput()).portfolio.positions.map(
        (position) => position.assetId
      )
    ).toEqual([voo.id, bbas3.id])
  })

  it('associates supplied global targets without rebuilding their formula', () => {
    const input = createInput()
    input.globalAssetTargets = [
      { assetId: voo.id, targetInBasisPoints: 4_001 },
      { assetId: bbas3.id, targetInBasisPoints: 5_999 },
    ]

    const dossier = buildTechnicalDossierV1(input)

    expect(
      dossier.strategy.categories.flatMap((category) =>
        category.assets.map((asset) => asset.globalTargetInBasisPoints)
      )
    ).toEqual([4_001, 5_999])
  })

  it('rejects a global target sum different from 10000', () => {
    const input = createInput()
    input.globalAssetTargets[0]!.targetInBasisPoints -= 1

    expect(() => buildTechnicalDossierV1(input)).toThrow(/total 10000/)
  })

  it('rejects duplicate global targets', () => {
    const input = createInput()
    input.globalAssetTargets[1]!.assetId = voo.id

    expect(() => buildTechnicalDossierV1(input)).toThrow(/duplicate global/)
  })

  it('rejects a missing global target', () => {
    const input = createInput()
    input.globalAssetTargets = input.globalAssetTargets.slice(0, 1)

    expect(() => buildTechnicalDossierV1(input)).toThrow(/Missing global/)
  })

  it('rejects a global target for an asset outside the strategy', () => {
    const input = createInput()
    input.globalAssetTargets[1]!.assetId = knri11.id

    expect(() => buildTechnicalDossierV1(input)).toThrow(/outside the strategy/)
  })

  it('selects the latest asset price independently of repository order', () => {
    const input = createInput()
    input.assetPrices = [...input.assetPrices].reverse()

    const price = buildTechnicalDossierV1(
      input
    ).marketFacts.latestAssetPrices.find((item) => item.assetId === bbas3.id)

    expect(price?.price.amountInMinorUnits).toBe(27_000)
  })

  it('preserves the shared asset-price tie breaker', () => {
    const input = createInput()
    input.assetPrices = [
      ...input.assetPrices,
      {
        id: 'price-bbas-z',
        assetId: bbas3.id,
        price: { amountInMinorUnits: 28_000, currency: 'BRL' },
        pricedAt: '2026-07-14T10:00:00.000Z',
        source: 'market-provider',
      },
    ]

    const price = buildTechnicalDossierV1(
      input
    ).marketFacts.latestAssetPrices.find((item) => item.assetId === bbas3.id)

    expect(price?.price.amountInMinorUnits).toBe(28_000)
  })

  it('selects latest USD/BRL independently of repository order', () => {
    const input = createInput()
    input.exchangeRates = [...input.exchangeRates].reverse()

    expect(
      buildTechnicalDossierV1(input).marketFacts.latestUsdBrlRate?.id
    ).toBe(usdRate.id)
  })

  it('counts manual latest prices', () => {
    expect(
      buildTechnicalDossierV1(createInput()).dataCoverage.manualLatestPriceCount
    ).toBe(1)
  })

  it('counts market-provider latest prices', () => {
    expect(
      buildTechnicalDossierV1(createInput()).dataCoverage
        .marketProviderLatestPriceCount
    ).toBe(1)
  })

  it('lists eligible assets without a latest price in asset order', () => {
    expect(
      buildTechnicalDossierV1(createInput()).dataCoverage
        .missingLatestPriceAssetIds
    ).toEqual([knri11.id])
  })

  it('preserves the native currency of an asset price', () => {
    const price = buildTechnicalDossierV1(
      createInput()
    ).marketFacts.latestAssetPrices.find((item) => item.assetId === voo.id)

    expect(price?.price).toEqual({
      amountInMinorUnits: 42_000,
      currency: 'USD',
    })
  })

  it('preserves the Motor V2 first-selection order', () => {
    expect(
      buildTechnicalDossierV1(createInput()).technicalPlan.items.map(
        (item) => item.assetId
      )
    ).toEqual([voo.id, bbas3.id])
  })

  it('copies suggested quantity without recalculating it', () => {
    const input = createInput()
    input.technicalPlan.technicalImpact.items[0]!.suggestedQuantity = 777

    expect(
      buildTechnicalDossierV1(input).technicalPlan.items[0]?.suggestedQuantity
    ).toBe(777)
  })

  it('copies the BRL reference unit price without recalculating it', () => {
    const input = createInput()
    input.technicalPlan.technicalImpact.items[0]!.unitPriceInCents = 4_321

    expect(
      buildTechnicalDossierV1(input).technicalPlan.items[0]?.unitPriceMinorInBrl
    ).toBe(4_321)
  })

  it('copies before and after differences without recalculating them', () => {
    const item = buildTechnicalDossierV1(createInput()).technicalPlan.items[0]

    expect(item).toEqual(
      expect.objectContaining({
        differenceBeforeInBasisPoints: -321,
        differenceAfterInBasisPoints: -123,
      })
    )
  })

  it('represents an empty normal plan with its stop reason', () => {
    const input = createInput()
    input.contributionAmountInCents = 1_000
    input.technicalPlan = {
      strategy: 'target-allocation',
      distribuicao: [],
      totalDistribuidoEmCentavos: 0,
      saldoNaoAlocadoEmCentavos: 1_000,
      technicalImpact: {
        totalDeviationBeforeInBasisPoints: 2_000,
        totalDeviationAfterInBasisPoints: 2_000,
        totalDeviationReductionInBasisPoints: 0,
        stopReason: 'no-affordable-unit',
        items: [],
      },
    }

    expect(buildTechnicalDossierV1(input).technicalPlan).toEqual(
      expect.objectContaining({
        items: [],
        stopReason: 'no-affordable-unit',
      })
    )
  })

  it('rejects a distribution for an unknown asset', () => {
    const input = createInput()
    input.technicalPlan.distribuicao[0]!.assetId = 'asset-unknown'
    input.technicalPlan.technicalImpact.items[0]!.assetId = 'asset-unknown'

    expect(() => buildTechnicalDossierV1(input)).toThrow(/unknown asset/)
  })

  it('rejects a duplicate distribution', () => {
    const input = createInput()
    input.technicalPlan.distribuicao[1]!.assetId = voo.id
    input.technicalPlan.technicalImpact.items[1]!.assetId = voo.id

    expect(() => buildTechnicalDossierV1(input)).toThrow(
      /duplicate technical plan distribution/
    )
  })

  it('rejects more than MAX_PLAN_ASSETS', () => {
    const input = createInput()
    input.technicalPlan.distribuicao = Array.from(
      { length: MAX_PLAN_ASSETS + 1 },
      (_, index) => ({ assetId: `asset-${index}`, valorEmCentavos: 0 })
    )
    input.technicalPlan.technicalImpact.items =
      input.technicalPlan.distribuicao.map((item) => ({
        assetId: item.assetId,
        suggestedQuantity: 0,
        unitPriceInCents: 0,
        allocatedInCents: 0,
        differenceBeforeInBasisPoints: 0,
        differenceAfterInBasisPoints: 0,
      }))

    expect(() => buildTechnicalDossierV1(input)).toThrow(
      `more than ${MAX_PLAN_ASSETS}`
    )
  })

  it('rejects divergence between distributions and technical impact items', () => {
    const input = createInput()
    input.technicalPlan.technicalImpact.items[0]!.assetId = bbas3.id

    expect(() => buildTechnicalDossierV1(input)).toThrow(/preserve.*order/)
  })

  it('rejects allocatedInCents divergent from valorEmCentavos', () => {
    const input = createInput()
    input.technicalPlan.technicalImpact.items[0]!.allocatedInCents += 1

    expect(() => buildTechnicalDossierV1(input)).toThrow(
      /technical allocation diverge/
    )
  })

  it('rejects allocated plus unallocated divergent from the contribution', () => {
    const input = createInput()
    input.technicalPlan.saldoNaoAlocadoEmCentavos += 1

    expect(() => buildTechnicalDossierV1(input)).toThrow(
      /match the contribution amount/
    )
  })

  it('rejects a distribution sum divergent from the allocated total', () => {
    const input = createInput()
    input.technicalPlan.totalDistribuidoEmCentavos += 1
    input.technicalPlan.saldoNaoAlocadoEmCentavos -= 1

    expect(() => buildTechnicalDossierV1(input)).toThrow(
      /Distribution sum must match/
    )
  })

  it('declares every required limitation code in stable order', () => {
    expect(
      buildTechnicalDossierV1(createInput()).limitations.map(
        (limitation) => limitation.code
      )
    ).toEqual([
      'simulation-only',
      'not-persisted',
      'greedy-whole-units-max-three',
      'technical-ranking-not-exposed-v1',
      'market-refresh-best-effort',
    ])
  })

  it('states that technical ranking is not exposed instead of inventing it', () => {
    const limitation = buildTechnicalDossierV1(createInput()).limitations.find(
      (item) => item.code === 'technical-ranking-not-exposed-v1'
    )

    expect(limitation?.description).toContain('não expõe o ranking completo')
    expect(limitation?.description).toContain('não inventa')
  })

  it('represents a zero portfolio without deriving positions', () => {
    const input = createInput()
    input.portfolioSnapshot = {
      positions: [],
      categories: [],
      totalInvestedMinorInBrl: 0,
      totalCurrentMinorInBrl: 0,
      totalResultMinorInBrl: 0,
      totalResultPercentage: 0,
      hasUsdPosition: false,
      latestUsdBrlRate: null,
    }

    expect(buildTechnicalDossierV1(input).portfolio).toEqual(
      expect.objectContaining({
        positions: [],
        totalCurrentMinorInBrl: 0,
      })
    )
  })

  it('preserves the selected USD/BRL fact with USD positions', () => {
    const dossier = buildTechnicalDossierV1(createInput())

    expect(dossier.portfolio.positions[0]?.currency).toBe('USD')
    expect(dossier.marketFacts.latestUsdBrlRate).toEqual(usdRate)
  })

  it('excludes inactive, fixed-income, and cash assets from market coverage', () => {
    const input = createInput()
    input.assets = [
      ...input.assets,
      {
        id: 'asset-fixed-income',
        ticker: 'FIXED',
        name: 'Renda fixa',
        category: 'fixed-income',
        market: 'INTERNAL',
        status: 'active',
      },
    ]

    const dossier = buildTechnicalDossierV1(input)

    expect(dossier.dataCoverage.eligibleAssetCount).toBe(3)
    expect(dossier.dataCoverage.missingLatestPriceAssetIds).toEqual([knri11.id])
  })

  it('preserves strategy category and asset order', () => {
    const dossier = buildTechnicalDossierV1(createInput())

    expect(dossier.strategy.categories.map((category) => category.id)).toEqual([
      'international',
      'brazilian-stocks',
    ])
    expect(
      dossier.strategy.categories.flatMap((category) =>
        category.assets.map((asset) => asset.assetId)
      )
    ).toEqual([voo.id, bbas3.id])
  })

  it('preserves eligible asset order in market facts', () => {
    expect(
      buildTechnicalDossierV1(createInput()).marketFacts.latestAssetPrices.map(
        (price) => price.assetId
      )
    ).toEqual([voo.id, bbas3.id])
  })

  it('copies total deviations directly from technicalImpact', () => {
    expect(buildTechnicalDossierV1(createInput()).deviations).toEqual({
      totalBeforeInBasisPoints: 2_345,
      totalAfterInBasisPoints: 1_111,
      totalReductionInBasisPoints: 1_234,
    })
  })
})
