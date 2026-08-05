import type {
  AllocationTarget,
  AllocationTargetScope,
  Asset,
  AssetCategory,
  AssetMarket,
  AssetPrice,
  AssetPriceSource,
  AssetSegment,
  AssetStatus,
  CurrencyCode,
  FiiAssetType,
  Purchase,
  PurchaseStatus,
} from '../../domain/models'
import {
  isValidBasisPoints,
  isValidMoneyInMinorUnits,
} from '../../domain/models'
import type { Tables } from '../../lib/database.types'

type AssetRow = Tables<'assets'>
type PurchaseRow = Tables<'purchases'>
type MarketAssetPriceRow = Tables<'market_asset_prices'>
type AllocationTargetRow = Tables<'allocation_targets'>

const ASSET_CATEGORIES: readonly AssetCategory[] = [
  'brazilian-stock',
  'real-estate-fund',
  'international-etf',
  'fixed-income',
  'cash',
]
const ASSET_MARKETS: readonly AssetMarket[] = ['BR', 'US', 'INTERNAL']
const ASSET_STATUSES: readonly AssetStatus[] = ['active', 'inactive']
const CURRENCIES: readonly CurrencyCode[] = ['BRL', 'USD']
const PURCHASE_STATUSES: readonly PurchaseStatus[] = [
  'planned',
  'confirmed',
  'cancelled',
]
const ASSET_PRICE_SOURCES: readonly AssetPriceSource[] = [
  'manual',
  'market-provider',
]
const ALLOCATION_TARGET_SCOPES: readonly AllocationTargetScope[] = [
  'category',
  'asset',
]

function readAllowedValue<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): T {
  if (!allowedValues.includes(value as T)) {
    throw new Error(`Unsupported ${fieldName}: ${value}`)
  }

  return value as T
}

function readMoneyInMinorUnits(value: number, fieldName: string): number {
  if (!isValidMoneyInMinorUnits(value)) {
    throw new Error(`Invalid ${fieldName}: ${value}`)
  }

  return value
}

const FII_ASSET_TYPES: readonly FiiAssetType[] = ['tijolo', 'papel', 'fof']
const ASSET_SEGMENTS: readonly AssetSegment[] = [
  'shopping',
  'lajes-corporativas',
  'logistica',
  'renda-urbana',
  'hibrido',
  'banco',
  'seguradora',
  'regulado',
  'holding',
  'industrial',
  'indice-amplo-us',
  'reit-us',
  'mercados-desenvolvidos-ex-us',
]

export function mapAssetRow(row: AssetRow): Asset {
  return {
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    category: readAllowedValue(
      row.category,
      ASSET_CATEGORIES,
      'asset category'
    ),
    market: readAllowedValue(row.market, ASSET_MARKETS, 'asset market'),
    status: readAllowedValue(row.status, ASSET_STATUSES, 'asset status'),
    assetType: row.asset_type
      ? readAllowedValue(row.asset_type, FII_ASSET_TYPES, 'asset type')
      : null,
    assetSegment: row.asset_segment
      ? readAllowedValue(row.asset_segment, ASSET_SEGMENTS, 'asset segment')
      : null,
  }
}

export function mapPurchaseRow(row: PurchaseRow): Purchase {
  const currency = readAllowedValue(row.currency, CURRENCIES, 'currency')

  return {
    id: row.id,
    assetId: row.asset_id,
    quantity: row.quantity,
    unitPrice: {
      amountInMinorUnits: readMoneyInMinorUnits(
        row.unit_price_minor,
        'unit price'
      ),
      currency,
    },
    totalAmount: {
      amountInMinorUnits: readMoneyInMinorUnits(
        row.total_amount_minor,
        'total amount'
      ),
      currency,
    },
    tradeDate: row.purchased_at,
    status: readAllowedValue(row.status, PURCHASE_STATUSES, 'purchase status'),
    ...(row.notes === null ? {} : { notes: row.notes }),
  }
}

export function mapMarketAssetPriceRow(
  row: MarketAssetPriceRow,
  assetIdByTicker: ReadonlyMap<string, string>
): AssetPrice | null {
  const assetId = assetIdByTicker.get(row.ticker)

  if (!assetId) {
    return null
  }

  return {
    id: String(row.id),
    assetId,
    price: {
      amountInMinorUnits: readMoneyInMinorUnits(row.price_minor, 'asset price'),
      currency: readAllowedValue(row.currency, CURRENCIES, 'currency'),
    },
    pricedAt: row.priced_at,
    source: readAllowedValue(
      row.source,
      ASSET_PRICE_SOURCES,
      'asset price source'
    ),
  }
}

export function mapAllocationTargetRow(
  row: AllocationTargetRow
): AllocationTarget {
  const scope = readAllowedValue(
    row.target_type,
    ALLOCATION_TARGET_SCOPES,
    'allocation target scope'
  )
  const category = readAllowedValue(
    row.category,
    ASSET_CATEGORIES,
    'asset category'
  )

  if (!isValidBasisPoints(row.target_basis_points)) {
    throw new Error(
      `Invalid allocation target basis points: ${row.target_basis_points}`
    )
  }

  if (scope === 'category' && row.asset_id !== null) {
    throw new Error('Category allocation target cannot reference an asset')
  }

  if (scope === 'asset' && row.asset_id === null) {
    throw new Error('Asset allocation target must reference an asset')
  }

  const target: AllocationTarget = {
    id: row.id,
    scope,
    category,
    targetInBasisPoints: row.target_basis_points,
  }

  if (row.asset_id !== null) {
    target.assetId = row.asset_id
  }

  return target
}
