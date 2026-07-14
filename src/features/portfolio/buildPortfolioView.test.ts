import { describe, expect, it } from 'vitest'
import {
  EXCHANGE_RATE_SCALE,
  type AllocationTarget,
  type Asset,
  type AssetPrice,
  type ExchangeRate,
  type Purchase,
} from '../../domain/models'
import {
  buildPortfolioView,
  type PortfolioViewResult,
} from './buildPortfolioView'

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

const brlPurchase: Purchase = {
  id: 'purchase-brl',
  assetId: brlAsset.id,
  quantity: 2,
  unitPrice: { amountInMinorUnits: 1_000, currency: 'BRL' },
  totalAmount: { amountInMinorUnits: 2_000, currency: 'BRL' },
  tradeDate: '2026-07-13',
  status: 'confirmed',
}

const usdPurchase: Purchase = {
  id: 'purchase-usd',
  assetId: usdAsset.id,
  quantity: 2,
  unitPrice: { amountInMinorUnits: 1_000, currency: 'USD' },
  totalAmount: { amountInMinorUnits: 2_000, currency: 'USD' },
  tradeDate: '2026-07-13',
  status: 'confirmed',
}

const brlPrice: AssetPrice = {
  id: 'price-brl',
  assetId: brlAsset.id,
  price: { amountInMinorUnits: 1_500, currency: 'BRL' },
  pricedAt: '2026-07-13T12:00:00.000Z',
  source: 'manual',
}

const usdPrice: AssetPrice = {
  id: 'price-usd',
  assetId: usdAsset.id,
  price: { amountInMinorUnits: 1_500, currency: 'USD' },
  pricedAt: '2026-07-13T12:00:00.000Z',
  source: 'manual',
}

const targets: AllocationTarget[] = [
  {
    id: 'target-brl',
    scope: 'category',
    category: 'brazilian-stock',
    targetInBasisPoints: 2_000,
  },
  {
    id: 'target-usd',
    scope: 'category',
    category: 'international-etf',
    targetInBasisPoints: 8_000,
  },
]

const directRate: ExchangeRate = {
  id: 'rate-direct',
  baseCurrency: 'USD',
  quoteCurrency: 'BRL',
  rateScaled: 5_000_000,
  rateScale: EXCHANGE_RATE_SCALE,
  pricedAt: '2026-07-13T12:00:00.000Z',
  source: 'manual',
}

const inverseRate: ExchangeRate = {
  id: 'rate-inverse',
  baseCurrency: 'BRL',
  quoteCurrency: 'USD',
  rateScaled: 200_000,
  rateScale: EXCHANGE_RATE_SCALE,
  pricedAt: '2026-07-13T12:00:00.000Z',
  source: 'manual',
}

function requireReadyPortfolio(result: PortfolioViewResult) {
  expect(result.needsExchangeRate).toBe(false)
  expect(result.data).not.toBeNull()

  return result.data!
}

function getSummaryItem(result: PortfolioViewResult, id: string) {
  const item = requireReadyPortfolio(result).summary.find(
    (candidate) => candidate.id === id
  )

  expect(item).toBeDefined()
  return item!
}

describe('buildPortfolioView', () => {
  it('keeps a BRL-only portfolio correct with BRL aggregate values', () => {
    const result = buildPortfolioView(
      [brlAsset],
      [brlPurchase],
      [brlPrice],
      targets,
      []
    )
    const portfolio = requireReadyPortfolio(result)

    expect(getSummaryItem(result, 'monitored-equity').value).toBe(
      'R$\u00a030,00'
    )
    expect(getSummaryItem(result, 'total-invested').value).toBe('R$\u00a020,00')
    expect(getSummaryItem(result, 'accumulated-return')).toEqual(
      expect.objectContaining({ value: 'R$\u00a010,00', badge: '+50,00%' })
    )
    expect(portfolio.positions.items[0]).toEqual(
      expect.objectContaining({
        currentValue: 'R$\u00a030,00',
        participation: '100,00%',
      })
    )
    expect(result.latestUsdBrlRate).toBeNull()
  })

  it('normalizes USD-only totals to BRL while preserving native position values', () => {
    const result = buildPortfolioView(
      [usdAsset],
      [usdPurchase],
      [usdPrice],
      targets,
      [directRate]
    )
    const portfolio = requireReadyPortfolio(result)
    const position = portfolio.positions.items[0]
    const international = portfolio.allocation.items.find(
      (item) => item.id === 'international'
    )

    expect(getSummaryItem(result, 'monitored-equity').value).toBe(
      'R$\u00a0150,00'
    )
    expect(getSummaryItem(result, 'total-invested').value).toBe(
      'R$\u00a0100,00'
    )
    expect(getSummaryItem(result, 'accumulated-return')).toEqual(
      expect.objectContaining({ value: 'R$\u00a050,00', badge: '+50,00%' })
    )
    expect(position).toEqual(
      expect.objectContaining({
        averagePrice: 'US$\u00a010,00',
        currentQuote: 'US$\u00a015,00',
        investedValue: 'US$\u00a020,00',
        currentValue: 'US$\u00a030,00',
        resultValue: 'US$\u00a010,00',
        participation: '100,00%',
      })
    )
    expect(international).toEqual(
      expect.objectContaining({
        currentValue: 'R$\u00a0150,00',
        currentLabel: '100,00%',
        differenceLabel: '+20,0 p.p. acima da meta',
      })
    )
    expect(result.latestUsdBrlRate).toBe(directRate)
  })

  it('normalizes a mixed BRL and USD portfolio before totals and participation', () => {
    const result = buildPortfolioView(
      [brlAsset, usdAsset],
      [brlPurchase, usdPurchase],
      [brlPrice, usdPrice],
      targets,
      [directRate]
    )
    const portfolio = requireReadyPortfolio(result)
    const brlPosition = portfolio.positions.items.find(
      (item) => item.id === brlAsset.id
    )
    const usdPosition = portfolio.positions.items.find(
      (item) => item.id === usdAsset.id
    )
    const brazilian = portfolio.allocation.items.find(
      (item) => item.id === 'brazilian-stocks'
    )
    const international = portfolio.allocation.items.find(
      (item) => item.id === 'international'
    )

    expect(getSummaryItem(result, 'monitored-equity').value).toBe(
      'R$\u00a0180,00'
    )
    expect(getSummaryItem(result, 'total-invested').value).toBe(
      'R$\u00a0120,00'
    )
    expect(getSummaryItem(result, 'accumulated-return')).toEqual(
      expect.objectContaining({ value: 'R$\u00a060,00', badge: '+50,00%' })
    )
    expect(brlPosition?.participation).toBe('16,67%')
    expect(usdPosition?.participation).toBe('83,33%')
    expect(brazilian).toEqual(
      expect.objectContaining({
        currentValue: 'R$\u00a030,00',
        currentLabel: '16,67%',
        differenceLabel: '-3,3 p.p. abaixo da meta',
      })
    )
    expect(international).toEqual(
      expect.objectContaining({
        currentValue: 'R$\u00a0150,00',
        currentLabel: '83,33%',
        differenceLabel: '+3,3 p.p. acima da meta',
      })
    )
  })

  it('signals a required exchange rate for a confirmed USD position', () => {
    const result = buildPortfolioView(
      [usdAsset],
      [usdPurchase],
      [usdPrice],
      targets,
      []
    )

    expect(result).toEqual({
      data: null,
      needsExchangeRate: true,
      latestUsdBrlRate: null,
    })
  })

  it('does not require an exchange rate for a cancelled USD purchase', () => {
    const result = buildPortfolioView(
      [usdAsset],
      [{ ...usdPurchase, status: 'cancelled' }],
      [usdPrice],
      targets,
      []
    )
    const portfolio = requireReadyPortfolio(result)

    expect(portfolio.positions.items).toHaveLength(0)
    expect(getSummaryItem(result, 'monitored-equity').value).toBe(
      'R$\u00a00,00'
    )
  })

  it('does not require an exchange rate for a USD asset without purchases', () => {
    const result = buildPortfolioView([usdAsset], [], [usdPrice], targets, [])

    expect(requireReadyPortfolio(result).positions.items).toHaveLength(0)
  })

  it('uses the average native price as fallback when a quote is unavailable', () => {
    const result = buildPortfolioView([usdAsset], [usdPurchase], [], targets, [
      directRate,
    ])
    const portfolio = requireReadyPortfolio(result)

    expect(portfolio.positions.items[0]).toEqual(
      expect.objectContaining({
        averagePrice: 'US$\u00a010,00',
        currentQuote: 'US$\u00a010,00',
        currentValue: 'US$\u00a020,00',
      })
    )
    expect(getSummaryItem(result, 'monitored-equity').value).toBe(
      'R$\u00a0100,00'
    )
    expect(portfolio.allocation.note).toContain('preço médio')
    expect(portfolio.allocation.note).toContain('convertidas para BRL')
  })

  it('uses the latest native asset quote independently of repository order', () => {
    const result = buildPortfolioView(
      [brlAsset],
      [brlPurchase],
      [
        brlPrice,
        {
          ...brlPrice,
          id: 'price-newest',
          price: { amountInMinorUnits: 2_000, currency: 'BRL' },
          pricedAt: '2026-07-14T12:00:00.000Z',
        },
        {
          ...brlPrice,
          id: 'price-oldest',
          price: { amountInMinorUnits: 500, currency: 'BRL' },
          pricedAt: '2026-07-12T12:00:00.000Z',
        },
      ],
      targets,
      []
    )

    expect(requireReadyPortfolio(result).positions.items[0].currentQuote).toBe(
      'R$\u00a020,00'
    )
  })

  it('supports an inverse BRL/USD rate through the shared converter', () => {
    const result = buildPortfolioView(
      [usdAsset],
      [usdPurchase],
      [usdPrice],
      targets,
      [inverseRate]
    )

    expect(getSummaryItem(result, 'monitored-equity').value).toBe(
      'R$\u00a0150,00'
    )
    expect(getSummaryItem(result, 'total-invested').value).toBe(
      'R$\u00a0100,00'
    )
    expect(result.latestUsdBrlRate).toBe(inverseRate)
  })

  it('continues forming positions only from confirmed purchases', () => {
    const result = buildPortfolioView(
      [brlAsset],
      [
        brlPurchase,
        {
          ...brlPurchase,
          id: 'purchase-cancelled',
          quantity: 10,
          totalAmount: { amountInMinorUnits: 10_000, currency: 'BRL' },
          status: 'cancelled',
        },
      ],
      [],
      targets,
      []
    )
    const portfolio = requireReadyPortfolio(result)

    expect(portfolio.positions.items).toHaveLength(1)
    expect(portfolio.positions.items[0]).toEqual(
      expect.objectContaining({ quantity: '2', investedValue: 'R$\u00a020,00' })
    )
  })
})
