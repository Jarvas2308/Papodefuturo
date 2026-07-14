import { describe, expect, it } from 'vitest'
import type { AssetPrice } from './models'
import { getLatestAssetPricesByAsset } from './latestAssetPrices'

function price(
  id: string,
  assetId: string,
  pricedAt: string,
  amountInMinorUnits = 1_000
): AssetPrice {
  return {
    id,
    assetId,
    pricedAt,
    price: { amountInMinorUnits, currency: 'BRL' },
    source: 'manual',
  }
}

describe('getLatestAssetPricesByAsset', () => {
  it('selects the latest price independently of repository order', () => {
    const latest = price('latest', 'asset-a', '2026-07-14T12:00:00.000Z')
    const older = price('older', 'asset-a', '2026-07-13T12:00:00.000Z')

    expect(getLatestAssetPricesByAsset([latest, older]).get('asset-a')).toBe(
      latest
    )
    expect(getLatestAssetPricesByAsset([older, latest]).get('asset-a')).toBe(
      latest
    )
  })

  it('uses the id as a deterministic tie breaker', () => {
    const first = price('a', 'asset-a', '2026-07-14T12:00:00.000Z')
    const second = price('b', 'asset-a', '2026-07-14T12:00:00.000Z')

    expect(getLatestAssetPricesByAsset([second, first]).get('asset-a')).toBe(
      second
    )
  })

  it('keeps independent latest prices for each asset', () => {
    const result = getLatestAssetPricesByAsset([
      price('a', 'asset-a', '2026-07-14T12:00:00.000Z'),
      price('b', 'asset-b', '2026-07-13T12:00:00.000Z'),
    ])

    expect([...result.keys()]).toEqual(['asset-a', 'asset-b'])
  })

  it('ignores prices with invalid timestamps', () => {
    expect(
      getLatestAssetPricesByAsset([price('invalid', 'asset-a', 'invalid')]).size
    ).toBe(0)
  })
})
