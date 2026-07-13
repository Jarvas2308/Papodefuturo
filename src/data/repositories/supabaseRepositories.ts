import {
  buildClosedAssetInsertRows,
  type AssetIdFactory,
} from '../assetUniverse'
import type { AllocationTarget } from '../../domain/models'
import { EXCHANGE_RATE_SCALE } from '../../domain/models'
import type { SupabaseBrowserClient } from '../../lib/supabaseClient'
import type {
  AllocationTargetRepository,
  AppRepositories,
  AssetPriceRepository,
  AssetRepository,
  ExchangeRateRepository,
  PurchaseRepository,
} from './contracts'
import { mapExchangeRateRow } from './exchangeRateMapper'
import type {
  ExchangeRateJson,
  ExchangeRateSupabaseClient,
} from './exchangeRateSchema'
import {
  mapAllocationTargetRow,
  mapAssetPriceRow,
  mapAssetRow,
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

function createBrowserAssetId(): string {
  return crypto.randomUUID()
}

export function createSupabaseAssetRepository(
  client: SupabaseBrowserClient,
  createId: AssetIdFactory = createBrowserAssetId
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
  client: SupabaseBrowserClient
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

  return {
    list: listPurchases,
    async create(input) {
      if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
        throw new RangeError('Purchase quantity must be positive')
      }

      if (
        !Number.isSafeInteger(input.unitPriceInMinorUnits) ||
        input.unitPriceInMinorUnits < 0
      ) {
        throw new RangeError('Purchase unit price must be a non-negative integer')
      }

      const totalAmountInMinorUnits = Math.round(
        input.quantity * input.unitPriceInMinorUnits
      )

      if (!Number.isSafeInteger(totalAmountInMinorUnits)) {
        throw new RangeError('Purchase total is outside the supported range')
      }

      const notes = input.notes?.trim()
      const { data, error } = await client
        .from('purchases')
        .insert({
          id: crypto.randomUUID(),
          user_id: input.userId,
          asset_id: input.assetId,
          quantity: input.quantity,
          unit_price_minor: input.unitPriceInMinorUnits,
          total_amount_minor: totalAmountInMinorUnits,
          currency: input.currency,
          purchased_at: input.purchasedAt,
          status: 'confirmed',
          notes: notes ? notes : null,
        })
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
    async list() {
      const { data, error } = await client
        .from('asset_prices')
        .select('*')
        .order('priced_at', { ascending: false })

      if (error) {
        throw createRepositoryQueryError('asset prices', error)
      }

      return (data ?? []).map(mapAssetPriceRow)
    },
  }
}

export function createSupabaseExchangeRateRepository(
  client: SupabaseBrowserClient
): ExchangeRateRepository {
  const exchangeRateClient =
    client as unknown as ExchangeRateSupabaseClient

  return {
    async list() {
      const { data, error } = await exchangeRateClient
        .from('exchange_rates')
        .select('*')
        .order('priced_at', { ascending: false })

      if (error) {
        throw createRepositoryQueryError('exchange rates', error)
      }

      return (data ?? []).map(mapExchangeRateRow)
    },
    async saveManualUsdBrl(userId, rateScaled) {
      const { data, error } = await exchangeRateClient
        .from('exchange_rates')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          base_currency: 'USD',
          quote_currency: 'BRL',
          rate_scaled: rateScaled,
          rate_scale: EXCHANGE_RATE_SCALE,
          priced_at: new Date().toISOString(),
          source: 'manual',
        })
        .select('*')
        .single()

      if (error) {
        throw createRepositoryQueryError('exchange rate', error)
      }

      return mapExchangeRateRow(data)
    },
  }
}

function allocationTargetsToJson(
  targets: readonly AllocationTarget[]
): ExchangeRateJson {
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
  const rpcClient = client as unknown as ExchangeRateSupabaseClient

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

export function createSupabaseRepositories(
  client: SupabaseBrowserClient
): AppRepositories {
  return {
    assets: createSupabaseAssetRepository(client),
    purchases: createSupabasePurchaseRepository(client),
    assetPrices: createSupabaseAssetPriceRepository(client),
    exchangeRates: createSupabaseExchangeRateRepository(client),
    allocationTargets: createSupabaseAllocationTargetRepository(client),
  }
}
