import type { Asset } from '../../domain/models'
import type {
  BrazilianStockFundamentalSnapshotInput,
  InternationalEtfFundamentalSnapshotInput,
  RealEstateFundFundamentalSnapshotInput,
} from '../../domain/fundamentals'
import type { CvmBrazilianStockFundamentalRecord } from './cvm/types'
import type { CvmRealEstateFundFundamentalRecord } from './cvm/fii/types'
import type { CvmRealEstateFundVacancyRecord } from './cvm/fii-trimestral/types'
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

// Escrita paralela e separada de RealEstateFundFundamentalSnapshotStorage:
// o Informe Trimestral tem forma de provenance genuinamente diferente do
// Informe Mensal (agregacao por imovel, sem PL/cotas/cotistas), entao nao
// compartilha o record type mensal (ver DEC-076).
export type RealEstateFundVacancySnapshotStorage = {
  upsertMany(
    records: readonly CvmRealEstateFundVacancyRecord[]
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
