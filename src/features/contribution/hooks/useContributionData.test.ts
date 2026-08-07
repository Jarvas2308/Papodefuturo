import { describe, expect, it, vi } from 'vitest'
import type { AppRepositories } from '../../../data/repositories'
import type {
  Asset,
  AssetPrice,
  ContributionPlanItem,
  ExchangeRate,
  Purchase,
} from '../../../domain/models'
import { EXCHANGE_RATE_SCALE } from '../../../domain/models'
import {
  buildContributionPlanCreateInput,
  buildContributionPositions,
  buildContributionTargets,
  loadContributionAssetScoresBestEffort,
  loadRealContributionInputs,
  matchRegisteredPurchasesToPlanItems,
} from './useContributionData'
import {
  DEFAULT_ETF_SIGNAL_RULES,
  DEFAULT_FII_TIJOLO_SIGNAL_RULES,
  DEFAULT_STOCK_SIGNAL_RULES,
} from '../../../domain/fundamentals/score'
import type { SupabaseBrowserClient } from '../../../lib/supabaseClient'

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
      },
      allocationTargets: {
        list: vi.fn().mockResolvedValue([]),
        replaceAll: vi.fn(),
      },
      marketData: {
        refresh: vi.fn().mockRejectedValue(new Error('function unavailable')),
      },
      contributionPlans: {
        list: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        updateStatus: vi.fn(),
        linkItemPurchase: vi.fn(),
      },
      aiExplanation: { explain: vi.fn() },
      profile: { get: vi.fn(), update: vi.fn() },
      userPreferences: { get: vi.fn(), update: vi.fn() },
      signalRules: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
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

describe('buildContributionPlanCreateInput', () => {
  it('builds a presented plan from positive suggestions only', () => {
    const input = buildContributionPlanCreateInput(
      'user-1',
      100_000,
      [
        { assetId: asset.id, valorEmCentavos: 50_000 },
        { assetId: 'asset-zero', valorEmCentavos: 0 },
      ],
      [asset]
    )

    expect(input).toEqual({
      userId: 'user-1',
      inputAmountInMinorUnits: 100_000,
      currency: 'BRL',
      status: 'presented',
      items: [
        {
          assetId: asset.id,
          plannedAmountInMinorUnits: 50_000,
          currency: 'BRL',
        },
      ],
    })
  })

  it('keeps items in BRL for assets quoted in USD', () => {
    const internationalAsset: Asset = {
      id: 'asset-vnq',
      ticker: 'VNQ',
      name: 'Vanguard Real Estate ETF',
      category: 'international-etf',
      market: 'US',
      status: 'active',
    }

    const input = buildContributionPlanCreateInput(
      'user-1',
      500_000,
      [{ assetId: internationalAsset.id, valorEmCentavos: 152_970 }],
      [internationalAsset]
    )

    // O motor já converteu o preço do ativo para BRL, então 152970 são
    // R$ 1.529,70. Rotular como USD leria o mesmo número como US$ 1.529,70.
    expect(input?.currency).toBe('BRL')
    expect(input?.items).toEqual([
      {
        assetId: internationalAsset.id,
        plannedAmountInMinorUnits: 152_970,
        currency: 'BRL',
      },
    ])
  })

  it('returns null when there is nothing to present', () => {
    const input = buildContributionPlanCreateInput(
      'user-1',
      100_000,
      [{ assetId: asset.id, valorEmCentavos: 0 }],
      [asset]
    )

    expect(input).toBeNull()
  })

  it('rejects a suggestion for an asset outside the loaded portfolio', () => {
    expect(() =>
      buildContributionPlanCreateInput(
        'user-1',
        100_000,
        [{ assetId: 'asset-unknown', valorEmCentavos: 10_000 }],
        [asset]
      )
    ).toThrow('A sugestão informada precisa pertencer à sua carteira.')
  })
})

describe('matchRegisteredPurchasesToPlanItems', () => {
  const planItems: ContributionPlanItem[] = [
    {
      id: 'item-1',
      assetId: asset.id,
      plannedAmount: { amountInMinorUnits: 50_000, currency: 'BRL' },
    },
  ]

  it('links a registered purchase to the plan item for the same asset', () => {
    const purchase: Purchase = {
      id: 'purchase-1',
      assetId: asset.id,
      quantity: 1,
      unitPrice: { amountInMinorUnits: 50_000, currency: 'BRL' },
      totalAmount: { amountInMinorUnits: 50_000, currency: 'BRL' },
      tradeDate: '2026-07-29',
      status: 'confirmed',
    }

    expect(matchRegisteredPurchasesToPlanItems(planItems, [purchase])).toEqual([
      { itemId: 'item-1', purchase },
    ])
  })

  it('ignores a registered purchase for an asset with no matching plan item', () => {
    const purchase: Purchase = {
      id: 'purchase-2',
      assetId: 'asset-outside-plan',
      quantity: 1,
      unitPrice: { amountInMinorUnits: 1_000, currency: 'BRL' },
      totalAmount: { amountInMinorUnits: 1_000, currency: 'BRL' },
      tradeDate: '2026-07-29',
      status: 'confirmed',
    }

    expect(matchRegisteredPurchasesToPlanItems(planItems, [purchase])).toEqual(
      []
    )
  })
})

describe('loadContributionAssetScoresBestEffort', () => {
  function fakeQueryClient(rows: unknown[] = []) {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.in.mockReturnValue(query)
    query.order.mockImplementation(() =>
      Object.assign(Promise.resolve({ data: rows, error: null }), query)
    )
    query.limit.mockReturnValue(query)
    return { from: vi.fn(() => query) } as unknown as SupabaseBrowserClient
  }

  function fakeRepositories(
    overrides: Partial<AppRepositories> = {}
  ): AppRepositories {
    return {
      assets: { list: vi.fn(), ensureClosedUniverse: vi.fn() },
      purchases: {
        list: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        cancel: vi.fn(),
      },
      assetPrices: { list: vi.fn() },
      exchangeRates: { list: vi.fn() },
      allocationTargets: { list: vi.fn(), replaceAll: vi.fn() },
      marketData: { refresh: vi.fn() },
      contributionPlans: {
        list: vi.fn(),
        create: vi.fn(),
        updateStatus: vi.fn(),
        linkItemPurchase: vi.fn(),
      },
      aiExplanation: { explain: vi.fn() },
      profile: { get: vi.fn(), update: vi.fn() },
      userPreferences: {
        get: vi.fn().mockResolvedValue({
          currency: 'BRL',
          percentageDecimals: 2,
          compactView: false,
          defaultContributionStrategy: 'target-allocation',
          contributionReminderEnabled: false,
          contributionReminderDay: 1,
          scoreWeightInBasisPoints: 75,
        }),
        update: vi.fn(),
      },
      signalRules: {
        list: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        remove: vi.fn(),
      },
      ...overrides,
    }
  }

  it('returns empty scores and zero weight when anything fails (best effort)', async () => {
    const throwingClient = {
      from: () => {
        throw new Error('network unavailable')
      },
    } as unknown as SupabaseBrowserClient
    const repositories = fakeRepositories()
    const fiiAsset: Asset = {
      id: 'asset-knri11',
      ticker: 'KNRI11',
      name: 'Kinea Renda Imobiliária',
      category: 'real-estate-fund',
      market: 'BR',
      status: 'active',
      assetType: 'tijolo',
    }

    const result = await loadContributionAssetScoresBestEffort(
      throwingClient,
      repositories,
      [fiiAsset],
      [],
      'user-1'
    )

    expect(result).toEqual({
      assetFundamentalScores: [],
      scoreWeightInBasisPoints: 0,
    })
  })

  it('seeds every missing default FII signal rule on first use', async () => {
    const client = fakeQueryClient([])
    const repositories = fakeRepositories()

    await loadContributionAssetScoresBestEffort(
      client,
      repositories,
      [],
      [],
      'user-1'
    )

    expect(repositories.signalRules.create).toHaveBeenCalledTimes(
      DEFAULT_FII_TIJOLO_SIGNAL_RULES.length +
        DEFAULT_STOCK_SIGNAL_RULES.length +
        DEFAULT_ETF_SIGNAL_RULES.length
    )
  })

  it('does not reseed a signal key the user already has a rule for', async () => {
    const client = fakeQueryClient([])
    const repositories = fakeRepositories({
      signalRules: {
        list: vi.fn().mockResolvedValue([
          {
            id: 'rule-1',
            signalKey: 'fii_pvp',
            minValue: null,
            maxValue: null,
            points: 0,
            enabled: true,
          },
        ]),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn(),
        remove: vi.fn(),
      },
    })

    await loadContributionAssetScoresBestEffort(
      client,
      repositories,
      [],
      [],
      'user-1'
    )

    const createdKeys = (
      repositories.signalRules.create as ReturnType<typeof vi.fn>
    ).mock.calls.map(
      (call: unknown[]) => (call[0] as { signalKey: string }).signalKey
    )
    expect(createdKeys).not.toContain('fii_pvp')
  })

  it('returns the user preferences score weight on success', async () => {
    const client = fakeQueryClient([])
    const repositories = fakeRepositories()

    const result = await loadContributionAssetScoresBestEffort(
      client,
      repositories,
      [],
      [],
      'user-1'
    )

    expect(result.scoreWeightInBasisPoints).toBe(75)
    expect(result.assetFundamentalScores).toEqual([])
  })
})
