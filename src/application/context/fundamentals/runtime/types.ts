import type { Asset } from '../../../../domain/models'
import type {
  BrazilianStockFundamentalSnapshotInput,
  FundamentalDerivedFactsV1,
  FundamentalFactsV1,
  InternationalEtfFundamentalSnapshotInput,
  RealEstateFundFundamentalSnapshotInput,
} from '../../../../domain/fundamentals'

export const FUNDAMENTALS_RUNTIME_V1_VERSION =
  'fundamentals-runtime.v1' as const

export type FundamentalsRuntimeModeV1 = 'disabled' | 'read-only'

export type FundamentalsRuntimeAccessStateV1 =
  'authenticated' | 'unauthenticated' | 'unresolved'

export type FundamentalsRuntimeAccessStateProviderV1 = () =>
  FundamentalsRuntimeAccessStateV1 | Promise<FundamentalsRuntimeAccessStateV1>

export type FundamentalsRuntimeClockV1 = {
  now(): string
}

export type FundamentalsRuntimeErrorCodeV1 =
  | 'access-state-invalid'
  | 'access-state-unavailable'
  | 'contract-violation'
  | 'unexpected-failure'

export type FundamentalsRuntimeErrorV1 = {
  code: FundamentalsRuntimeErrorCodeV1
  message: string
}

type FundamentalsRuntimeOperationBaseV1 = {
  runtimeVersion: typeof FUNDAMENTALS_RUNTIME_V1_VERSION
  startedAt: string
  completedAt: string
}

export type FundamentalsRuntimeOperationResultV1<T> =
  | (FundamentalsRuntimeOperationBaseV1 & {
      status: 'succeeded'
      data: T
      error: null
    })
  | (FundamentalsRuntimeOperationBaseV1 & {
      status: 'disabled' | 'authentication-required'
      data: null
      error: null
    })
  | (FundamentalsRuntimeOperationBaseV1 & {
      status: 'not-ready' | 'failed'
      data: null
      error: FundamentalsRuntimeErrorV1
    })

export type FundamentalsRuntimeCapabilityReasonV1 =
  'available' | 'authentication-required' | 'disabled' | 'not-ready'

export type FundamentalsRuntimeCapabilityV1 = {
  runtimeVersion: typeof FUNDAMENTALS_RUNTIME_V1_VERSION
  mode: FundamentalsRuntimeModeV1
  accessState: FundamentalsRuntimeAccessStateV1 | null
  canRead: boolean
  reason: FundamentalsRuntimeCapabilityReasonV1
}

/**
 * fundamental_snapshots e' uma tabela global (sem user_id), mas as tres
 * repositories de leitura ainda exigem a lista de assets do usuario como
 * filtro de ticker/categoria/mercado (mesmo padrao ja usado pelas telas
 * autenticadas). listAssets() le o catalogo ja materializado por
 * ensureClosedUniverse noutro fluxo (Dashboard/Carteira); este runtime nunca
 * grava em assets.
 */
export type FundamentalsRuntimeRepositoryV1 = {
  listAssets(): Promise<readonly Asset[]>
  listBrazilianStockSnapshots(
    assets: readonly Asset[]
  ): Promise<readonly BrazilianStockFundamentalSnapshotInput[]>
  listRealEstateFundSnapshots(
    assets: readonly Asset[]
  ): Promise<readonly RealEstateFundFundamentalSnapshotInput[]>
  listInternationalEtfSnapshots(
    assets: readonly Asset[]
  ): Promise<readonly InternationalEtfFundamentalSnapshotInput[]>
}

export type FundamentalsDossierV1 = {
  facts: FundamentalFactsV1
  derived: FundamentalDerivedFactsV1
}

export type FundamentalsRuntimeV1 = {
  getCapability(): FundamentalsRuntimeCapabilityV1
  getDossier(): Promise<
    FundamentalsRuntimeOperationResultV1<FundamentalsDossierV1>
  >
}

export type CreateFundamentalsRuntimeV1Input =
  | {
      mode: 'disabled'
      now: FundamentalsRuntimeClockV1
      repository?: never
      getAccessState?: never
    }
  | {
      mode: 'read-only'
      repository: FundamentalsRuntimeRepositoryV1
      getAccessState: FundamentalsRuntimeAccessStateProviderV1
      now: FundamentalsRuntimeClockV1
    }

export class FundamentalsRuntimeClockErrorV1 extends Error {
  readonly code: 'clock-invalid' | 'clock-regressed' | 'clock-unavailable'

  constructor(code: FundamentalsRuntimeClockErrorV1['code'], message: string) {
    super(message)
    this.name = 'FundamentalsRuntimeClockErrorV1'
    this.code = code
  }
}
