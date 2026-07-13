import { describe, expect, it } from 'vitest'
import type { Asset, Purchase } from '../../domain/models'
import { buildPortfolioView } from './buildPortfolioView'

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

const cancelledPurchase: Purchase = {
  ...confirmedPurchase,
  id: 'purchase-cancelled',
  quantity: 10,
  totalAmount: { amountInMinorUnits: 10_000, currency: 'BRL' },
  status: 'cancelled',
}

describe('buildPortfolioView', () => {
  it('forms positions only from confirmed purchases', () => {
    const portfolio = buildPortfolioView(
      [asset],
      [confirmedPurchase, cancelledPurchase],
      [],
      []
    )

    expect(portfolio.positions.items).toHaveLength(1)
    expect(portfolio.positions.items[0]).toEqual(
      expect.objectContaining({
        ticker: 'BBAS3',
        quantity: '2',
        investedValue: 'R$ 20,00',
      })
    )
    expect(
      portfolio.summary.find((item) => item.id === 'positions-count')
    ).toEqual(expect.objectContaining({ value: '1' }))
  })
})
