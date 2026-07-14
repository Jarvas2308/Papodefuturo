import { describe, expect, it } from 'vitest'
import {
  EXCHANGE_RATE_SCALE,
  type Asset,
  type ExchangeRate,
  type Purchase,
} from '../../domain/models'
import { buildRealStrategyPositions } from './realStrategy'

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

describe('buildRealStrategyPositions', () => {
  it('does not use cancelled purchases as current strategy positions', () => {
    const result = buildRealStrategyPositions(
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

    expect(result.needsExchangeRate).toBe(false)
    expect(result.positions).toEqual([
      {
        assetId: asset.id,
        category: 'brazilian-stocks',
        currentValueInCents: 2_000,
        unitPriceInCents: null,
      },
    ])
  })

  it('uses the shared latest-rate selection independently of list order', () => {
    const usdAsset: Asset = {
      id: 'asset-voo',
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      category: 'international-etf',
      market: 'US',
      status: 'active',
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
    const olderRate: ExchangeRate = {
      id: 'older-rate',
      baseCurrency: 'USD',
      quoteCurrency: 'BRL',
      rateScaled: 4_000_000,
      rateScale: EXCHANGE_RATE_SCALE,
      pricedAt: '2026-07-12T12:00:00.000Z',
      source: 'manual',
    }
    const latestRate: ExchangeRate = {
      ...olderRate,
      id: 'latest-rate',
      rateScaled: 5_000_000,
      pricedAt: '2026-07-14T12:00:00.000Z',
    }

    const result = buildRealStrategyPositions(
      [usdAsset],
      [usdPurchase],
      [],
      [latestRate, olderRate]
    )

    expect(result.latestUsdBrlRate).toBe(latestRate)
    expect(result.positions).toEqual([
      {
        assetId: usdAsset.id,
        category: 'international',
        currentValueInCents: 10_000,
        unitPriceInCents: null,
      },
    ])
  })
})
