import type { Asset } from '../../domain/models'
import type { BrazilianStockFundamentalSnapshotInput } from '../../domain/fundamentals'
import type { CvmBrazilianStockFundamentalRecord } from './cvm/types'
import type { CvmRealEstateFundFundamentalRecord } from './cvm/fii/types'

export type FundamentalSnapshotStorage = {
  upsertMany(
    records: readonly CvmBrazilianStockFundamentalRecord[]
  ): Promise<void>
}

export type RealEstateFundFundamentalSnapshotStorage = {
  upsertMany(
    records: readonly CvmRealEstateFundFundamentalRecord[]
  ): Promise<void>
}

export type FundamentalSnapshotRepository = {
  listBrazilianStockSnapshots(
    assets: readonly Asset[]
  ): Promise<BrazilianStockFundamentalSnapshotInput[]>
}
