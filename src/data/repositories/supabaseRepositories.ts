import {
  buildClosedAssetInsertRows,
  type AssetIdFactory,
} from '../assetUniverse'
import type { AllocationTarget } from '../../domain/models'
import type { SupabaseBrowserClient } from '../../lib/supabaseClient'
import type {
  AllocationTargetRepository,
  AppRepositories,
  AssetPriceRepository,
  AssetRepository,
  CreatePurchaseBatchInput,
  CreatePurchaseInput,
  ExchangeRateRepository,
  MarketDataRefreshResult,
  MarketDataRepository,
  PurchaseRepository,
} from './contracts'
import { mapExchangeRateRow } from './exchangeRateMapper'
import type { RpcJson, RpcSupabaseClient } from './rpcSchema'
import {
  mapAllocationTargetRow,
  mapAssetRow,
  mapMarketAssetPriceRow,
  mapPurchaseRow,
} from './supabaseMappers'

type QueryError = {
  message: string
  code?: string
}

function createRepositoryQueryError(
  resourceName: string,
  error: QueryError
): Error {
  return new Error(`Failed to load ${resourceName}: ${error.message}`)
}

function createBrowserEntityId(): string {
  return crypto.randomUUID()
}

function parseMarketDataRefreshResult(value: unknown): MarketDataRefreshResult {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid market data refresh response')
  }

  const result = value as Partial<MarketDataRefreshResult>
  const counts = [
    result.updatedPrices,
    result.skippedFreshPrices,
    result.updatedExchangeRates,
    result.skippedFreshExchangeRates,
  ]

  if (
    typeof result.refreshedAt !== 'string' ||
    Number.isNaN(Date.parse(result.refreshedAt)) ||
    !counts.every((count) => Number.isSafeInteger(count) && count! >= 0) ||
    !Array.isArray(result.warnings) ||
    !result.warnings.every(
      (warning) =>
        warning &&
        ['b3-cotahist', 'twelve-data', 'configuration'].includes(
          warning.provider
        ) &&
        typeof warning.message === 'string' &&
        (warning.ticker === undefined || typeof warning.ticker === 'string')
    )
  ) {
    throw new Error('Invalid market data refresh response')
  }

  return result as MarketDataRefreshResult
}

type PurchaseIdFactory = () => string

type PurchaseFactsInput = Omit<CreatePurchaseInput, 'userId'>

export function calculatePurchaseTotalInMinorUnits(
  quantity: number,
  unitPriceInMinorUnits: number
): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new RangeError('Purchase quantity must be positive')
  }

  if (
    !Number.isSafeInteger(unitPriceInMinorUnits) ||
    unitPriceInMinorUnits < 0
  ) {
    throw new RangeError('Purchase unit price must be a non-negative integer')
  }

  const totalAmountInMinorUnits = Math.round(quantity * unitPriceInMinorUnits)

  if (!Number.isSafeInteger(totalAmountInMinorUnits)) {
    throw new RangeError('Purchase total is outside the supported range')
  }

  return totalAmountInMinorUnits
}

function toPurchaseFacts(input: PurchaseFactsInput) {
  const notes = input.notes?.trim()

  return {
    asset_id: input.assetId,
    quantity: input.quantity,
    unit_price_minor: input.unitPriceInMinorUnits,
    total_amount_minor: calculatePurchaseTotalInMinorUnits(
      input.quantity,
      input.unitPriceInMinorUnits
    ),
    currency: input.currency,
    purchased_at: input.purchasedAt,
    notes: notes ? notes : null,
  }
}

export function createSupabaseAssetRepository(
  client: SupabaseBrowserClient,
  createId: AssetIdFactory = createBrowserEntityId
): AssetRepository {
  async function listAssets() {
    const { data, error } = await client
      .from('assets')
      .select('*')
      .order('ticker', { ascending: true })

    if (error) {
      throw createRepositoryQueryError('assets', error)
    }

    return (data ?? []).map(mapAssetRow)
  }

  return {
    list: listAssets,
    async ensureClosedUniverse(userId) {
      const existingAssets = await listAssets()
      const insertRows = buildClosedAssetInsertRows(
        userId,
        existingAssets,
        createId
      )

      if (insertRows.length === 0) {
        return existingAssets
      }

      const { error } = await client.from('assets').insert(insertRows)

      if (error && error.code !== '23505') {
        throw createRepositoryQueryError('closed asset universe', error)
      }

      return listAssets()
    },
  }
}

export function createSupabasePurchaseRepository(
  client: SupabaseBrowserClient,
  createId: PurchaseIdFactory = createBrowserEntityId
): PurchaseRepository {
  async function listPurchases() {
    const { data, error } = await client
      .from('purchases')
      .select('*')
      .order('purchased_at', { ascending: false })

    if (error) {
      throw createRepositoryQueryError('purchases', error)
    }

    return (data ?? []).map(mapPurchaseRow)
  }

  async function createMany(input: CreatePurchaseBatchInput) {
    if (input.purchases.length === 0) {
      throw new RangeError('At least one purchase is required')
    }

    const insertRows = input.purchases.map((purchase) => ({
      id: createId(),
      user_id: input.userId,
      status: 'confirmed' as const,
      ...toPurchaseFacts(purchase),
    }))

    const { data, error } = await client
      .from('purchases')
      .insert(insertRows)
      .select('*')

    if (error) {
      throw createRepositoryQueryError('purchases', error)
    }

    return (data ?? []).map(mapPurchaseRow)
  }

  return {
    list: listPurchases,
    async create(input) {
      const [purchase] = await createMany({
        userId: input.userId,
        purchases: [
          {
            assetId: input.assetId,
            quantity: input.quantity,
            unitPriceInMinorUnits: input.unitPriceInMinorUnits,
            currency: input.currency,
            purchasedAt: input.purchasedAt,
            notes: input.notes,
          },
        ],
      })

      if (!purchase) {
        throw new Error('Failed to create purchase: no row returned')
      }

      return purchase
    },
    createMany,
    async update(input) {
      const { data, error } = await client
        .from('purchases')
        .update(toPurchaseFacts(input))
        .eq('id', input.purchaseId)
        .eq('status', 'confirmed')
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('purchase', error)
      }

      return mapPurchaseRow(data)
    },
    async cancel(purchaseId) {
      const { data, error } = await client
        .from('purchases')
        .update({ status: 'cancelled' })
        .eq('id', purchaseId)
        .eq('status', 'confirmed')
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('purchase', error)
      }

      return mapPurchaseRow(data)
    },
  }
}

export function createSupabaseAssetPriceRepository(
  client: SupabaseBrowserClient
): AssetPriceRepository {
  return {
    async list(assets) {
      const { data, error } = await client
        .from('market_asset_prices')
        .select('*')
        .order('priced_at', { ascending: false })

      if (error) {
        throw createRepositoryQueryError('asset prices', error)
      }

      const assetIdByTicker = new Map(
        assets.map((asset) => [asset.ticker, asset.id])
      )

      return (data ?? [])
        .map((row) => mapMarketAssetPriceRow(row, assetIdByTicker))
        .filter((price) => price !== null)
    },
  }
}

export function createSupabaseExchangeRateRepository(
  client: SupabaseBrowserClient
): ExchangeRateRepository {
  return {
    async list() {
      const { data, error } = await client
        .from('market_exchange_rates')
        .select('*')
        .order('priced_at', { ascending: false })

      if (error) {
        throw createRepositoryQueryError('exchange rates', error)
      }

      return (data ?? []).map(mapExchangeRateRow)
    },
  }
}

function allocationTargetsToJson(
  targets: readonly AllocationTarget[]
): RpcJson {
  return targets.map((target) => ({
    id: target.id,
    target_type: target.scope,
    asset_id: target.assetId ?? null,
    category: target.category,
    target_basis_points: target.targetInBasisPoints,
  }))
}

export function createSupabaseAllocationTargetRepository(
  client: SupabaseBrowserClient
): AllocationTargetRepository {
  const rpcClient = client as unknown as RpcSupabaseClient

  async function listTargets() {
    const { data, error } = await client
      .from('allocation_targets')
      .select('*')
      .order('target_type', { ascending: true })
      .order('category', { ascending: true })

    if (error) {
      throw createRepositoryQueryError('allocation targets', error)
    }

    return (data ?? []).map(mapAllocationTargetRow)
  }

  return {
    list: listTargets,
    async replaceAll(targets) {
      const { error } = await rpcClient.rpc('replace_allocation_targets', {
        targets: allocationTargetsToJson(targets),
      })

      if (error) {
        throw createRepositoryQueryError('allocation targets', error)
      }

      return listTargets()
    },
  }
}

export function createSupabaseMarketDataRepository(
  client: SupabaseBrowserClient
): MarketDataRepository {
  return {
    async refresh() {
      const { data, error } = await client.functions.invoke(
        'refresh-market-data'
      )

      if (error) {
        throw createRepositoryQueryError('market data refresh', error)
      }

      return parseMarketDataRefreshResult(data)
    },
  }
}

export function createSupabaseRepositories(
  client: SupabaseBrowserClient
): AppRepositories {
  return {
    assets: createSupabaseAssetRepository(client),
    purchases: createSupabasePurchaseRepository(client),
    assetPrices: createSupabaseAssetPriceRepository(client),
    exchangeRates: createSupabaseExchangeRateRepository(client),
    allocationTargets: createSupabaseAllocationTargetRepository(client),
    marketData: createSupabaseMarketDataRepository(client),
  }
}
