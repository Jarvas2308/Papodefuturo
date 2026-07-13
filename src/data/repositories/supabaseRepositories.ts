import type { SupabaseBrowserClient } from '../../lib/supabaseClient'
import type {
  AllocationTargetRepository,
  AppRepositories,
  AssetPriceRepository,
  AssetRepository,
  PurchaseRepository,
} from './contracts'
import {
  mapAllocationTargetRow,
  mapAssetPriceRow,
  mapAssetRow,
  mapPurchaseRow,
} from './supabaseMappers'

type QueryError = {
  message: string
}

function createRepositoryQueryError(
  resourceName: string,
  error: QueryError
): Error {
  return new Error(`Failed to load ${resourceName}: ${error.message}`)
}

export function createSupabaseAssetRepository(
  client: SupabaseBrowserClient
): AssetRepository {
  return {
    async list() {
      const { data, error } = await client
        .from('assets')
        .select('*')
        .order('ticker', { ascending: true })

      if (error) {
        throw createRepositoryQueryError('assets', error)
      }

      return (data ?? []).map(mapAssetRow)
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
    allocationTargets: createSupabaseAllocationTargetRepository(client),
  }
}
