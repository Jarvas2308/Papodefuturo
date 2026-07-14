import { describe, expect, it, vi } from 'vitest'
import {
  buildClosedAssetInsertRows,
  CLOSED_ASSET_UNIVERSE,
  getMissingClosedAssetDefinitions,
  normalizeAssetTicker,
} from './assetUniverse'
import { SERVER_CLOSED_ASSET_UNIVERSE } from '../../supabase/functions/_shared/closedAssetUniverse'

describe('closed asset universe', () => {
  it('keeps a unique closed universe with twelve assets', () => {
    const normalizedTickers = CLOSED_ASSET_UNIVERSE.map((asset) =>
      normalizeAssetTicker(asset.ticker)
    )

    expect(CLOSED_ASSET_UNIVERSE).toHaveLength(12)
    expect(new Set(normalizedTickers).size).toBe(normalizedTickers.length)
  })

  it('uses the official WEGE3 ticker for WEG', () => {
    const tickers = CLOSED_ASSET_UNIVERSE.map(({ ticker }) => ticker)

    expect(tickers).toContain('WEGE3')
    expect(tickers).not.toContain('WEG3')
  })

  it('keeps the server catalog synchronized with the web catalog', () => {
    const webCatalog = CLOSED_ASSET_UNIVERSE.map(
      ({ ticker, market, currency }) => ({ ticker, market, currency })
    )

    expect(SERVER_CLOSED_ASSET_UNIVERSE).toHaveLength(12)
    expect(SERVER_CLOSED_ASSET_UNIVERSE).toEqual(webCatalog)
  })

  it('keeps server and web tickers synchronized', () => {
    expect(SERVER_CLOSED_ASSET_UNIVERSE.map(({ ticker }) => ticker)).toEqual(
      CLOSED_ASSET_UNIVERSE.map(({ ticker }) => ticker)
    )
  })

  it('keeps server and web markets synchronized', () => {
    expect(SERVER_CLOSED_ASSET_UNIVERSE.map(({ market }) => market)).toEqual(
      CLOSED_ASSET_UNIVERSE.map(({ market }) => market)
    )
  })

  it('keeps server and web currencies synchronized', () => {
    expect(
      SERVER_CLOSED_ASSET_UNIVERSE.map(({ currency }) => currency)
    ).toEqual(CLOSED_ASSET_UNIVERSE.map(({ currency }) => currency))
  })

  it('keeps Edge Function production modules independent from src', () => {
    const edgeModules = import.meta.glob(
      '../../supabase/functions/{_shared,refresh-market-data}/**/*.ts',
      { eager: true, import: 'default', query: '?raw' }
    ) as Record<string, string>

    for (const [filePath, content] of Object.entries(edgeModules)) {
      if (filePath.endsWith('.test.ts')) {
        continue
      }

      expect(content).not.toMatch(/(?:from|import\()\s*['"][^'"]*src\//)
    }
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
