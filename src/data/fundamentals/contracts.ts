import type { Asset } from '../../domain/models'
import type {
  BrazilianStockFundamentalSnapshotInput,
  InternationalEtfFundamentalSnapshotInput,
  RealEstateFundFundamentalSnapshotInput,
} from '../../domain/fundamentals'
import type { CvmBrazilianStockFundamentalRecord } from './cvm/types'
import type { CvmRealEstateFundFundamentalRecord } from './cvm/fii/types'
import type { SecInternationalEtfFundamentalRecord } from './sec/nport/types'

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

export type InternationalEtfFundamentalSnapshotStorage = {
  upsertMany(
    records: readonly SecInternationalEtfFundamentalRecord[]
  ): Promise<void>
}

export type FundamentalSnapshotRepository = {
  listBrazilianStockSnapshots(
    assets: readonly Asset[]
  ): Promise<BrazilianStockFundamentalSnapshotInput[]>
}

export type RealEstateFundFundamentalSnapshotRepository = {
  listRealEstateFundSnapshots(
    assets: readonly Asset[]
  ): Promise<RealEstateFundFundamentalSnapshotInput[]>
}

export type InternationalEtfFundamentalSnapshotRepository = {
  listInternationalEtfSnapshots(
    assets: readonly Asset[]
  ): Promise<InternationalEtfFundamentalSnapshotInput[]>
}
