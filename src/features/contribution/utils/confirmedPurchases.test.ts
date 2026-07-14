import { describe, expect, it } from 'vitest'
import type { Asset, ExchangeRate } from '../../../domain/models'
import {
  buildConfirmedPurchaseBatch,
  buildContributionConfirmationItems,
  calculateContributionPurchaseComparison,
  createContributionPurchaseDrafts,
  getContributionAssetCurrency,
  shouldOfferContributionPurchaseConfirmation,
} from './confirmedPurchases'

const brlAsset: Asset = {
  id: 'asset-bbas3',
  ticker: 'BBAS3',
  name: 'Banco do Brasil',
  category: 'brazilian-stock',
  market: 'BR',
  status: 'active',
}

const usdAsset: Asset = {
  id: 'asset-voo',
  ticker: 'VOO',
  name: 'Vanguard S&P 500 ETF',
  category: 'international-etf',
  market: 'US',
  status: 'active',
}

const usdBrlRate: ExchangeRate = {
  id: 'rate-usd-brl',
  baseCurrency: 'USD',
  quoteCurrency: 'BRL',
  rateScaled: 5_500_000,
  rateScale: 1_000_000,
  pricedAt: '2026-07-13T12:00:00.000Z',
  source: 'manual',
}

const positions = [
  {
    id: brlAsset.id,
    ticker: brlAsset.ticker,
    name: brlAsset.name,
    categoryLabel: 'Ações brasileiras',
  },
  {
    id: usdAsset.id,
    ticker: usdAsset.ticker,
    name: usdAsset.name,
    categoryLabel: 'Internacional',
  },
]

const distribution = [
  { assetId: brlAsset.id, valorEmCentavos: 10_000 },
  { assetId: usdAsset.id, valorEmCentavos: 11_000 },
  { assetId: 'ignored-asset', valorEmCentavos: 0 },
]

function createItems(rate: ExchangeRate | null = usdBrlRate) {
  return buildContributionConfirmationItems(
    distribution,
    positions,
    [brlAsset, usdAsset],
    rate
  )
}

describe('confirmed contribution purchases', () => {
  it('derives the asset currencies and excludes suggestions with zero value', () => {
    const items = createItems()

    expect(items).toHaveLength(2)
    expect(items.map((item) => item.currency)).toEqual(['BRL', 'USD'])
    expect(items[1]?.estimatedSuggestedAmountInUsdMinorUnits).toBe(2_000)
    expect(getContributionAssetCurrency(usdAsset)).toBe('USD')
  })

  it('creates drafts as not performed and keeps confirmation out of demo mode', () => {
    expect(
      createContributionPurchaseDrafts(createItems(), '2026-07-13')
    ).toEqual([
      {
        assetId: brlAsset.id,
        isPerformed: false,
        quantity: '',
        unitPrice: '',
        purchasedAt: '2026-07-13',
      },
      {
        assetId: usdAsset.id,
        isPerformed: false,
        quantity: '',
        unitPrice: '',
        purchasedAt: '2026-07-13',
      },
    ])
    expect(shouldOfferContributionPurchaseConfirmation(true)).toBe(false)
    expect(shouldOfferContributionPurchaseConfirmation(false)).toBe(true)
  })

  it('builds only performed purchases and recalculates the minor-unit total', () => {
    const items = createItems()
    const purchases = buildConfirmedPurchaseBatch(
      items,
      [
        {
          assetId: brlAsset.id,
          isPerformed: true,
          quantity: '2,5',
          unitPrice: '15,37',
          purchasedAt: '2026-07-13',
        },
        {
          assetId: usdAsset.id,
          isPerformed: false,
          quantity: '',
          unitPrice: '',
          purchasedAt: '2026-07-13',
        },
      ],
      usdBrlRate
    )

    expect(purchases).toEqual([
      {
        assetId: brlAsset.id,
        quantity: 2.5,
        unitPriceInMinorUnits: 1_537,
        currency: 'BRL',
        purchasedAt: '2026-07-13',
      },
    ])
  })

  it('rejects an empty batch and invalid facts', () => {
    const items = createItems()

    expect(() =>
      buildConfirmedPurchaseBatch(
        items,
        createContributionPurchaseDrafts(items, '2026-07-13'),
        usdBrlRate
      )
    ).toThrow('Selecione pelo menos uma compra realizada')

    expect(() =>
      buildConfirmedPurchaseBatch(
        items,
        [
          {
            assetId: brlAsset.id,
            isPerformed: true,
            quantity: '0',
            unitPrice: '10,00',
            purchasedAt: '2026-07-13',
          },
        ],
        usdBrlRate
      )
    ).toThrow('quantidade positiva')

    expect(() =>
      buildConfirmedPurchaseBatch(
        items,
        [
          {
            assetId: brlAsset.id,
            isPerformed: true,
            quantity: '1',
            unitPrice: '0',
            purchasedAt: '2026-07-13',
          },
        ],
        usdBrlRate
      )
    ).toThrow('preço unitário maior que zero')
  })

  it('compares a BRL purchase directly with its suggested BRL budget', () => {
    const [brlItem] = createItems()
    const comparison = calculateContributionPurchaseComparison(
      brlItem!,
      {
        assetId: brlAsset.id,
        isPerformed: true,
        quantity: '2',
        unitPrice: '60,00',
        purchasedAt: '2026-07-13',
      },
      usdBrlRate
    )

    expect(comparison.totalAmountInMinorUnits).toBe(12_000)
    expect(comparison.totalAmountInBrlMinorUnits).toBe(12_000)
    expect(comparison.differenceFromSuggestedInBrlMinorUnits).toBe(2_000)
  })

  it('converts USD totals to BRL before comparing with the suggestion', () => {
    const [, usdItem] = createItems()
    const comparison = calculateContributionPurchaseComparison(
      usdItem!,
      {
        assetId: usdAsset.id,
        isPerformed: true,
        quantity: '2',
        unitPrice: '10,00',
        purchasedAt: '2026-07-13',
      },
      usdBrlRate
    )

    expect(comparison.totalAmountInMinorUnits).toBe(2_000)
    expect(comparison.totalAmountInBrlMinorUnits).toBe(11_000)
    expect(comparison.differenceFromSuggestedInBrlMinorUnits).toBe(0)
  })

  it('blocks USD confirmation when the exchange rate is missing', () => {
    const [, usdItem] = createItems(null)

    expect(() =>
      calculateContributionPurchaseComparison(
        usdItem!,
        {
          assetId: usdAsset.id,
          isPerformed: true,
          quantity: '1',
          unitPrice: '10,00',
          purchasedAt: '2026-07-13',
        },
        null
      )
    ).toThrow('cotação USD/BRL')
  })

  it('allows positive and negative differences because purchases are facts', () => {
    const [brlItem] = createItems()
    const belowBudget = calculateContributionPurchaseComparison(
      brlItem!,
      {
        assetId: brlAsset.id,
        isPerformed: true,
        quantity: '1',
        unitPrice: '50,00',
        purchasedAt: '2026-07-13',
      },
      usdBrlRate
    )
    const aboveBudget = calculateContributionPurchaseComparison(
      brlItem!,
      {
        assetId: brlAsset.id,
        isPerformed: true,
        quantity: '1',
        unitPrice: '150,00',
        purchasedAt: '2026-07-13',
      },
      usdBrlRate
    )

    expect(belowBudget.differenceFromSuggestedInBrlMinorUnits).toBeLessThan(0)
    expect(aboveBudget.differenceFromSuggestedInBrlMinorUnits).toBeGreaterThan(
      0
    )
  })
})
