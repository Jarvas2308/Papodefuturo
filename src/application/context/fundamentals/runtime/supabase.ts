import type { SupabaseBrowserClient } from '../../../../lib/supabaseClient'
import { createSupabaseAssetRepository } from '../../../../data/repositories'
import {
  createSupabaseFundamentalSnapshotRepository,
  createSupabaseInternationalEtfSnapshotRepository,
  createSupabaseRealEstateFundSnapshotRepository,
} from '../../../../data/fundamentals'
import { createFundamentalsRuntimeV1 } from './runtime'
import type {
  FundamentalsRuntimeAccessStateProviderV1,
  FundamentalsRuntimeClockV1,
  FundamentalsRuntimeV1,
} from './types'

export type CreateSupabaseFundamentalsRuntimeV1Input =
  | {
      mode: 'disabled'
      now: FundamentalsRuntimeClockV1
      client?: never
      getAccessState?: never
    }
  | {
      mode: 'read-only'
      client: SupabaseBrowserClient
      getAccessState: FundamentalsRuntimeAccessStateProviderV1
      now: FundamentalsRuntimeClockV1
    }

export function createSupabaseFundamentalsRuntimeV1(
  input: CreateSupabaseFundamentalsRuntimeV1Input
): FundamentalsRuntimeV1 {
  if (input.mode === 'disabled') {
    return createFundamentalsRuntimeV1({ mode: 'disabled', now: input.now })
  }
  const assetRepository = createSupabaseAssetRepository(input.client)
  const stockRepository = createSupabaseFundamentalSnapshotRepository(
    input.client
  )
  const realEstateFundRepository =
    createSupabaseRealEstateFundSnapshotRepository(input.client)
  const internationalEtfRepository =
    createSupabaseInternationalEtfSnapshotRepository(input.client)

  return createFundamentalsRuntimeV1({
    mode: 'read-only',
    repository: {
      listAssets: () => assetRepository.list(),
      listBrazilianStockSnapshots: (assets) =>
        stockRepository.listBrazilianStockSnapshots(assets),
      listRealEstateFundSnapshots: (assets) =>
        realEstateFundRepository.listRealEstateFundSnapshots(assets),
      listInternationalEtfSnapshots: (assets) =>
        internationalEtfRepository.listInternationalEtfSnapshots(assets),
    },
    getAccessState: input.getAccessState,
    now: input.now,
  })
}
