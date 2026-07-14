import { describe, expect, it } from 'vitest'
import { getClosedAssetCurrency } from '../data/assetUniverse'
import {
  EXCHANGE_RATE_SCALE,
  type AllocationTarget,
  type Asset,
  type AssetPrice,
  type ExchangeRate,
  type Purchase,
} from './models'
import { buildPortfolioSnapshot } from './portfolioSnapshot'

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

const brlPurchase: Purchase = {
  id: 'purchase-brl',
  assetId: bbas3.id,
  quantity: 2,
  unitPrice: { amountInMinorUnits: 1_000, currency: 'BRL' },
  totalAmount: { amountInMinorUnits: 2_000, currency: 'BRL' },
  tradeDate: '2026-07-01',
  status: 'confirmed',
}

const usdPurchase: Purchase = {
  id: 'purchase-usd',
  assetId: voo.id,
  quantity: 2,
  unitPrice: { amountInMinorUnits: 1_000, currency: 'USD' },
  totalAmount: { amountInMinorUnits: 2_000, currency: 'USD' },
  tradeDate: '2026-07-02',
  status: 'confirmed',
}

const prices: AssetPrice[] = [
  {
    id: 'price-brl',
    assetId: bbas3.id,
    price: { amountInMinorUnits: 1_500, currency: 'BRL' },
    pricedAt: '2026-07-10T00:00:00.000Z',
    source: 'manual',
  },
  {
    id: 'price-usd',
    assetId: voo.id,
    price: { amountInMinorUnits: 1_500, currency: 'USD' },
    pricedAt: '2026-07-10T00:00:00.000Z',
    source: 'manual',
  },
]

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

const rate: ExchangeRate = {
  id: 'rate',
  baseCurrency: 'USD',
  quoteCurrency: 'BRL',
  rateScaled: 5_000_000,
  rateScale: EXCHANGE_RATE_SCALE,
  pricedAt: '2026-07-10T00:00:00.000Z',
  source: 'manual',
}

function build(
  purchases: Purchase[],
  selectedPrices: AssetPrice[] = prices,
  rates: ExchangeRate[] = [rate]
) {
  return buildPortfolioSnapshot({
    assets: [bbas3, voo],
    purchases,
    prices: selectedPrices,
    targets,
    rates,
    resolveAssetCurrency: getClosedAssetCurrency,
  })
}

describe('buildPortfolioSnapshot', () => {
  it('calculates BRL-only positions and totals from confirmed facts', () => {
    const result = build([brlPurchase], [prices[0]], [])

    expect(result.needsExchangeRate).toBe(false)
    expect(result.snapshot).toEqual(
      expect.objectContaining({
        totalInvestedMinorInBrl: 2_000,
        totalCurrentMinorInBrl: 3_000,
        totalResultMinorInBrl: 1_000,
        totalResultPercentage: 50,
      })
    )
    expect(result.snapshot?.positions[0]).toEqual(
      expect.objectContaining({
        investedMinorNative: 2_000,
        currentMinorNative: 3_000,
        investedMinorInBrl: 2_000,
        currentMinorInBrl: 3_000,
        hasCurrentPrice: true,
      })
    )
  })

  it('normalizes USD-only values to BRL while preserving native values', () => {
    const result = build([usdPurchase], [prices[1]])
    const position = result.snapshot?.positions[0]

    expect(position).toEqual(
      expect.objectContaining({
        currency: 'USD',
        investedMinorNative: 2_000,
        currentMinorNative: 3_000,
        investedMinorInBrl: 10_000,
        currentMinorInBrl: 15_000,
      })
    )
    expect(result.snapshot?.totalCurrentMinorInBrl).toBe(15_000)
  })

  it('normalizes mixed currencies before total and category participation', () => {
    const result = build([brlPurchase, usdPurchase])
    const brazilian = result.snapshot?.categories.find(
      (item) => item.category === 'brazilian-stock'
    )
    const international = result.snapshot?.categories.find(
      (item) => item.category === 'international-etf'
    )

    expect(result.snapshot?.totalCurrentMinorInBrl).toBe(18_000)
    expect(brazilian?.currentPercentage).toBeCloseTo(16.6667)
    expect(international?.currentPercentage).toBeCloseTo(83.3333)
    expect(international?.targetInBasisPoints).toBe(8_000)
    expect(international?.differencePercentage).toBeCloseTo(3.3333)
  })

  it('signals the missing rate only for a confirmed USD position', () => {
    expect(build([usdPurchase], [prices[1]], [])).toEqual({
      snapshot: null,
      needsExchangeRate: true,
      latestUsdBrlRate: null,
    })

    const cancelled = build(
      [{ ...usdPurchase, status: 'cancelled' }],
      [prices[1]],
      []
    )

    expect(cancelled.needsExchangeRate).toBe(false)
    expect(cancelled.snapshot?.positions).toHaveLength(0)
  })

  it('ignores planned and cancelled purchases when forming positions', () => {
    const result = build([
      brlPurchase,
      { ...brlPurchase, id: 'cancelled', status: 'cancelled', quantity: 10 },
      { ...brlPurchase, id: 'planned', status: 'planned', quantity: 20 },
    ])

    expect(result.snapshot?.positions).toHaveLength(1)
    expect(result.snapshot?.positions[0].quantity).toBe(2)
  })

  it('uses average price as fallback and exposes price coverage honestly', () => {
    const result = build([brlPurchase], [], [])

    expect(result.snapshot?.positions[0]).toEqual(
      expect.objectContaining({
        currentPriceMinorNative: 1_000,
        currentMinorNative: 2_000,
        hasCurrentPrice: false,
      })
    )
  })

  it('selects the latest valid exchange rate independently of input order', () => {
    const newest = {
      ...rate,
      id: 'newest',
      rateScaled: 6_000_000,
      pricedAt: '2026-07-11T00:00:00.000Z',
    }
    const result = build([usdPurchase], [prices[1]], [newest, rate])

    expect(result.latestUsdBrlRate).toBe(newest)
    expect(result.snapshot?.totalCurrentMinorInBrl).toBe(18_000)
  })
})
