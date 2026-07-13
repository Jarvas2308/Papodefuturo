import { describe, expect, it, vi } from 'vitest'
import {
  buildClosedAssetInsertRows,
  CLOSED_ASSET_UNIVERSE,
  getMissingClosedAssetDefinitions,
  normalizeAssetTicker,
} from './assetUniverse'

describe('closed asset universe', () => {
  it('keeps a unique closed universe with twelve assets', () => {
    const normalizedTickers = CLOSED_ASSET_UNIVERSE.map((asset) =>
      normalizeAssetTicker(asset.ticker)
    )

    expect(CLOSED_ASSET_UNIVERSE).toHaveLength(12)
    expect(new Set(normalizedTickers).size).toBe(normalizedTickers.length)
  })

  it('detects missing assets without treating ticker casing as different', () => {
    const missingAssets = getMissingClosedAssetDefinitions([
      { ticker: 'bbas3' },
      { ticker: ' ITSA4 ' },
    ])

    expect(missingAssets.map((asset) => asset.ticker)).not.toContain('BBAS3')
    expect(missingAssets.map((asset) => asset.ticker)).not.toContain('ITSA4')
    expect(missingAssets).toHaveLength(10)
  })

  it('builds insert rows scoped to the authenticated user', () => {
    const existingAssets = CLOSED_ASSET_UNIVERSE.slice(1).map((asset) => ({
      ticker: asset.ticker,
    }))
    const createId = vi.fn(() => 'asset-id')

    const rows = buildClosedAssetInsertRows('user-id', existingAssets, createId)

    expect(rows).toEqual([
      {
        id: 'asset-id',
        user_id: 'user-id',
        ticker: 'BBAS3',
        name: 'Banco do Brasil',
        category: 'brazilian-stock',
        market: 'BR',
        currency: 'BRL',
        status: 'active',
      },
    ])
    expect(createId).toHaveBeenCalledTimes(1)
  })

  it('is idempotent when every closed-universe ticker already exists', () => {
    const existingAssets = CLOSED_ASSET_UNIVERSE.map((asset) => ({
      ticker: asset.ticker,
    }))

    expect(
      buildClosedAssetInsertRows('user-id', existingAssets, () => 'unused-id')
    ).toEqual([])
  })
})
