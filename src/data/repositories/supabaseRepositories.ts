import {
  buildClosedAssetInsertRows,
  type AssetIdFactory,
} from '../assetUniverse'
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
import type { ExchangeRateSupabaseClient } from './exchangeRateSchema'
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
  return {
    async list() {
      const { data, error } = await client
        .from('purchases')
        .select('*')
        .order('purchased_at', { ascending: false })

      if (error) {
        throw createRepositoryQueryError('purchases', error)
      }

      return (data ?? []).map(mapPurchaseRow)
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
  }
}

export function createSupabaseAllocationTargetRepository(
  client: SupabaseBrowserClient
): AllocationTargetRepository {
  return {
    async list() {
      const { data, error } = await client
        .from('allocation_targets')
        .select('*')
        .order('target_type', { ascending: true })
        .order('category', { ascending: true })

      if (error) {
        throw createRepositoryQueryError('allocation targets', error)
      }

      return (data ?? []).map(mapAllocationTargetRow)
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
