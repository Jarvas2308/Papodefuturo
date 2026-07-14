import { describe, expect, it, vi } from 'vitest'
import type { AppRepositories } from '../../../data/repositories'
import type { Asset, Purchase } from '../../../domain/models'
import {
  buildContributionPositions,
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
