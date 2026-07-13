import type {
  Asset,
  AssetCategory,
  AssetMarket,
  AssetStatus,
  CurrencyCode,
  EntityId,
} from '../domain/models'
import type { TablesInsert } from '../lib/database.types'

export type ClosedAssetDefinition = {
  ticker: string
  name: string
  category: AssetCategory
  market: AssetMarket
  currency: CurrencyCode
  status: AssetStatus
}

export type AssetIdFactory = () => EntityId

type AssetSeedIdentity = Pick<Asset, 'ticker'>

export const CLOSED_ASSET_UNIVERSE = [
  {
    ticker: 'BBAS3',
    name: 'Banco do Brasil',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'ITSA4',
    name: 'Itaúsa',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'TAEE11',
    name: 'Taesa',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'WEG3',
    name: 'WEG',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'PSSA3',
    name: 'Porto',
    category: 'brazilian-stock',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'KNRI11',
    name: 'Kinea Renda Imobiliária',
    category: 'real-estate-fund',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'VISC11',
    name: 'Vinci Shopping Centers',
    category: 'real-estate-fund',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'XPLG11',
    name: 'XP Log',
    category: 'real-estate-fund',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'HGRU11',
    name: 'Pátria Renda Urbana',
    category: 'real-estate-fund',
    market: 'BR',
    currency: 'BRL',
    status: 'active',
  },
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
    status: 'active',
  },
  {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
    status: 'active',
  },
  {
    ticker: 'VEA',
    name: 'Vanguard FTSE Developed Markets ETF',
    category: 'international-etf',
    market: 'US',
    currency: 'USD',
    status: 'active',
  },
] as const satisfies readonly ClosedAssetDefinition[]

export function normalizeAssetTicker(ticker: string): string {
  return ticker.trim().toUpperCase()
}

export function getMissingClosedAssetDefinitions(
  existingAssets: readonly AssetSeedIdentity[]
): ClosedAssetDefinition[] {
  const existingTickers = new Set(
    existingAssets.map((asset) => normalizeAssetTicker(asset.ticker))
  )

  return CLOSED_ASSET_UNIVERSE.filter(
    (asset) => !existingTickers.has(normalizeAssetTicker(asset.ticker))
  )
}

export function buildClosedAssetInsertRows(
  userId: EntityId,
  existingAssets: readonly AssetSeedIdentity[],
  createId: AssetIdFactory
): TablesInsert<'assets'>[] {
  return getMissingClosedAssetDefinitions(existingAssets).map((asset) => ({
    id: createId(),
    user_id: userId,
    ticker: asset.ticker,
    name: asset.name,
    category: asset.category,
    market: asset.market,
    currency: asset.currency,
    status: asset.status,
  }))
}
