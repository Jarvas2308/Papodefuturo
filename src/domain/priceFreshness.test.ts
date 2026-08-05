import { describe, expect, it } from 'vitest'
import type { Asset, AssetPrice } from './models'
import {
  getStaleAssetPrices,
  UI_STALE_PRICE_THRESHOLD_MS,
} from './priceFreshness'

const NOW = new Date('2026-07-31T12:00:00.000Z')

function asset(id: string, ticker: string): Asset {
  return {
    id,
    ticker,
    name: ticker,
    category: 'brazilian-stock',
    market: 'BR',
    status: 'active',
  }
}

function price(
  id: string,
  assetId: string,
  pricedAt: string,
  source: AssetPrice['source'] = 'market-provider'
): AssetPrice {
  return {
    id,
    assetId,
    pricedAt,
    price: { amountInMinorUnits: 1_000, currency: 'BRL' },
    source,
  }
}

describe('getStaleAssetPrices', () => {
  it('flags an automatic price older than the threshold', () => {
    const staleAsset = asset('asset-a', 'AAAA3')
    const stalePrice = price('p1', 'asset-a', '2026-07-20T12:00:00.000Z')

    const result = getStaleAssetPrices([staleAsset], [stalePrice], NOW)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      assetId: 'asset-a',
      ticker: 'AAAA3',
      daysStale: 11,
    })
  })

  it('does not flag a price within the threshold', () => {
    const freshAsset = asset('asset-a', 'AAAA3')
    const freshPrice = price('p1', 'asset-a', '2026-07-30T12:00:00.000Z')

    expect(getStaleAssetPrices([freshAsset], [freshPrice], NOW)).toEqual([])
  })

  it('ignores manual prices — staleness only applies to automatic quotes', () => {
    const manualAsset = asset('asset-a', 'AAAA3')
    const manualPrice = price(
      'p1',
      'asset-a',
      '2026-01-01T12:00:00.000Z',
      'manual'
    )

    expect(getStaleAssetPrices([manualAsset], [manualPrice], NOW)).toEqual([])
  })

  it('uses only the latest price per asset', () => {
    const assetA = asset('asset-a', 'AAAA3')
    const older = price('p1', 'asset-a', '2026-07-01T12:00:00.000Z')
    const latest = price('p2', 'asset-a', '2026-07-30T12:00:00.000Z')

    expect(getStaleAssetPrices([assetA], [older, latest], NOW)).toEqual([])
  })

  it('sorts by staleness, most stale first', () => {
    const assetA = asset('asset-a', 'AAAA3')
    const assetB = asset('asset-b', 'BBBB3')
    const priceA = price('p1', 'asset-a', '2026-07-20T12:00:00.000Z')
    const priceB = price('p2', 'asset-b', '2026-07-10T12:00:00.000Z')

    const result = getStaleAssetPrices([assetA, assetB], [priceA, priceB], NOW)

    expect(result.map((item) => item.ticker)).toEqual(['BBBB3', 'AAAA3'])
  })

  it('accepts a custom threshold', () => {
    const assetA = asset('asset-a', 'AAAA3')
    const recentPrice = price('p1', 'asset-a', '2026-07-30T12:00:00.000Z')

    expect(
      getStaleAssetPrices([assetA], [recentPrice], NOW, 12 * 60 * 60 * 1000)
    ).toHaveLength(1)
  })

  it('exports a 4-day default threshold', () => {
    expect(UI_STALE_PRICE_THRESHOLD_MS).toBe(4 * 24 * 60 * 60 * 1000)
  })
})
