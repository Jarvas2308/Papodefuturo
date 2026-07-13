import { describe, expect, it } from 'vitest'
import type { Asset, Purchase } from '../../../domain/models'
import { buildContributionPositions } from './useContributionData'

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
      },
    ])
  })
})
