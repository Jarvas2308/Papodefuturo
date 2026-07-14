import { describe, expect, it, vi } from 'vitest'
import type { AppRepositories } from '../../../data/repositories'
import type {
  Asset,
  AssetPrice,
  ExchangeRate,
  Purchase,
} from '../../../domain/models'
import { EXCHANGE_RATE_SCALE } from '../../../domain/models'
import {
  buildContributionPositions,
  buildContributionTargets,
  loadRealContributionInputs,
} from './useContributionData'

const asset: Asset = {
  id: 'asset-bbas3',
  ticker: 'BBAS3',
  name: 'Banco do Brasil',
  category: 'brazilian-stock',
  market: 'BR',
  status: 'active',
}

const confirmedPurchase: Purchase = {
  id: 'purchase-confirmed',
  assetId: asset.id,
  quantity: 2,
  unitPrice: { amountInMinorUnits: 1_000, currency: 'BRL' },
  totalAmount: { amountInMinorUnits: 2_000, currency: 'BRL' },
  tradeDate: '2026-07-13',
  status: 'confirmed',
}

function assetPrice(
  id: string,
  assetId: string,
  amountInMinorUnits: number,
  pricedAt: string,
  currency: 'BRL' | 'USD' = 'BRL'
): AssetPrice {
  return {
    id,
    assetId,
    price: { amountInMinorUnits, currency },
    pricedAt,
    source: id.includes('provider') ? 'market-provider' : 'manual',
  }
}

const usdBrlRate: ExchangeRate = {
  id: 'usd-brl',
  baseCurrency: 'USD',
  quoteCurrency: 'BRL',
  rateScaled: 5_000_000,
  rateScale: EXCHANGE_RATE_SCALE,
  pricedAt: '2026-07-14T12:00:00.000Z',
  source: 'manual',
}

describe('buildContributionPositions', () => {
  it('does not treat cancelled purchases as existing contribution assets', () => {
    const result = buildContributionPositions(
      [asset],
      [
        confirmedPurchase,
        {
          ...confirmedPurchase,
          id: 'purchase-cancelled',
          quantity: 10,
          totalAmount: { amountInMinorUnits: 10_000, currency: 'BRL' },
          status: 'cancelled',
        },
      ],
      [],
      []
    )

    expect(result.positions).toEqual([
      {
        assetId: asset.id,
        category: 'brazilian-stocks',
        currentValueInCents: 2_000,
        unitPriceInCents: null,
      },
    ])
  })

  it('uses the latest BRL unit price independently of repository order', () => {
    const latest = assetPrice(
      'provider-latest',
      asset.id,
      1_500,
      '2026-07-14T12:00:00.000Z'
    )
    const older = assetPrice(
      'manual-older',
      asset.id,
      1_200,
      '2026-07-13T12:00:00.000Z'
    )

    expect(
      buildContributionPositions(
        [asset],
        [confirmedPurchase],
        [latest, older],
        []
      ).positions[0]?.unitPriceInCents
    ).toBe(1_500)
  })

  it('allows a newer manual price to beat an older market-provider price', () => {
    const result = buildContributionPositions(
      [asset],
      [],
      [
        assetPrice(
          'provider-older',
          asset.id,
          1_200,
          '2026-07-13T12:00:00.000Z'
        ),
        assetPrice(
          'manual-latest',
          asset.id,
          1_600,
          '2026-07-14T12:00:00.000Z'
        ),
      ],
      []
    )

    expect(result.positions[0]?.unitPriceInCents).toBe(1_600)
  })

  it('converts the latest USD unit price to BRL with the shared rate', () => {
    const usdAsset: Asset = {
      id: 'asset-voo',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'international-etf',
      market: 'US',
      status: 'active',
    }
    const result = buildContributionPositions(
      [usdAsset],
      [],
      [
        assetPrice(
          'provider-voo',
          usdAsset.id,
          10_000,
          '2026-07-14T12:00:00.000Z',
          'USD'
        ),
      ],
      [usdBrlRate]
    )

    expect(result.positions).toEqual([
      {
        assetId: usdAsset.id,
        category: 'international',
        currentValueInCents: 0,
        unitPriceInCents: 50_000,
      },
    ])
  })

  it('keeps a USD unit price unavailable when the exchange rate is absent', () => {
    const usdAsset: Asset = {
      id: 'asset-voo',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'international-etf',
      market: 'US',
      status: 'active',
    }
    const result = buildContributionPositions(
      [usdAsset],
      [],
      [
        assetPrice(
          'provider-voo',
          usdAsset.id,
          10_000,
          '2026-07-14T12:00:00.000Z',
          'USD'
        ),
      ],
      []
    )

    expect(result.positions[0]?.unitPriceInCents).toBeNull()
  })

  it('uses the same USD/BRL rate for VOO, VNQ and VEA', () => {
    const usdAssets: Asset[] = ['VOO', 'VNQ', 'VEA'].map((ticker) => ({
      id: `asset-${ticker.toLowerCase()}`,
      ticker,
      name: ticker,
      category: 'international-etf',
      market: 'US',
      status: 'active',
    }))
    const prices = usdAssets.map((usdAsset, index) =>
      assetPrice(
        `provider-${usdAsset.ticker}`,
        usdAsset.id,
        10_000 + index * 1_000,
        '2026-07-14T12:00:00.000Z',
        'USD'
      )
    )
    const result = buildContributionPositions(usdAssets, [], prices, [
      usdBrlRate,
    ])

    expect(result.positions.map((item) => item.unitPriceInCents)).toEqual([
      50_000, 55_000, 60_000,
    ])
  })

  it('does not use average purchase cost as a missing unit price fallback', () => {
    const result = buildContributionPositions(
      [asset],
      [confirmedPurchase],
      [],
      []
    )

    expect(result.positions[0]).toMatchObject({
      currentValueInCents: 2_000,
      unitPriceInCents: null,
    })
  })

  it('includes every active eligible asset even without a current position', () => {
    const secondAsset: Asset = {
      ...asset,
      id: 'asset-itsa4',
      ticker: 'ITSA4',
    }
    const inactiveAsset: Asset = {
      ...asset,
      id: 'asset-inactive',
      ticker: 'PSSA3',
      status: 'inactive',
    }
    const result = buildContributionPositions(
      [asset, secondAsset, inactiveAsset],
      [],
      [],
      []
    )

    expect(result.positions.map((position) => position.assetId)).toEqual([
      asset.id,
      secondAsset.id,
    ])
    expect(
      result.positions.every((position) => position.currentValueInCents === 0)
    ).toBe(true)
  })

  it('transforms persisted individual targets into exact global engine targets', () => {
    const assets: Asset[] = [
      asset,
      {
        ...asset,
        id: 'asset-knri11',
        ticker: 'KNRI11',
        category: 'real-estate-fund',
      },
      {
        ...asset,
        id: 'asset-voo',
        ticker: 'VOO',
        category: 'international-etf',
        market: 'US',
      },
    ]
    const persistedTargets = [
      {
        id: 'category-stocks',
        scope: 'category' as const,
        category: 'brazilian-stock' as const,
        targetInBasisPoints: 3_529,
      },
      {
        id: 'category-fiis',
        scope: 'category' as const,
        category: 'real-estate-fund' as const,
        targetInBasisPoints: 3_529,
      },
      {
        id: 'category-international',
        scope: 'category' as const,
        category: 'international-etf' as const,
        targetInBasisPoints: 2_942,
      },
      ...assets.map((targetAsset) => ({
        id: `target-${targetAsset.id}`,
        scope: 'asset' as const,
        category: targetAsset.category,
        assetId: targetAsset.id,
        targetInBasisPoints: 10_000,
      })),
    ]
    const result = buildContributionTargets(assets, persistedTargets)

    expect(result.assetTargets).toEqual([
      { assetId: asset.id, targetInBasisPoints: 3_529 },
      { assetId: 'asset-knri11', targetInBasisPoints: 3_529 },
      { assetId: 'asset-voo', targetInBasisPoints: 2_942 },
    ])
    expect(
      result.assetTargets.reduce(
        (sum, target) => sum + target.targetInBasisPoints,
        0
      )
    ).toBe(10_000)
  })

  it('loads persisted data when automatic refresh is unavailable', async () => {
    const repositories: AppRepositories = {
      assets: {
        list: vi.fn().mockResolvedValue([asset]),
        ensureClosedUniverse: vi.fn().mockResolvedValue([asset]),
      },
      purchases: {
        list: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        cancel: vi.fn(),
      },
      assetPrices: { list: vi.fn().mockResolvedValue([]) },
      exchangeRates: {
        list: vi.fn().mockResolvedValue([]),
        saveManualUsdBrl: vi.fn(),
      },
      allocationTargets: {
        list: vi.fn().mockResolvedValue([]),
        replaceAll: vi.fn(),
      },
      marketData: {
        refresh: vi.fn().mockRejectedValue(new Error('function unavailable')),
      },
    }

    await expect(
      loadRealContributionInputs(repositories, 'authenticated-user')
    ).resolves.toEqual({
      assets: [asset],
      purchases: [],
      prices: [],
      allocationTargets: [],
      rates: [],
    })
  })
})
