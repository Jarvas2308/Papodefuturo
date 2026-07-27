import type { OfficialAssetEventV1 } from '../../../../domain/context/official-events'
import type {
  OfficialAssetEventReadPageV1,
  OfficialAssetEventReadQueryV1,
  OfficialAssetEventReadRepositoryV1,
  OfficialAssetEventsReadRpcClientV1,
} from '../../../../data/context/official-events/repository'

export const OFFICIAL_EVENTS_RUNTIME_V1_VERSION =
  'official-events-runtime.v1' as const

export type OfficialEventsRuntimeModeV1 = 'disabled' | 'read-only'

export type OfficialEventsRuntimeAccessStateV1 =
  'authenticated' | 'unauthenticated' | 'unresolved'

export type OfficialEventsRuntimeAccessStateProviderV1 = () =>
  | OfficialEventsRuntimeAccessStateV1
  | Promise<OfficialEventsRuntimeAccessStateV1>

export type OfficialEventsRuntimeClockV1 = {
  now(): string
}

export type OfficialEventsRuntimeErrorCodeV1 =
  | 'access-state-invalid'
  | 'access-state-unavailable'
  | 'contract-violation'
  | 'cursor-query-mismatch'
  | 'invalid-cursor'
  | 'invalid-input'
  | 'malformed-response'
  | 'repository-unavailable'
  | 'schema-unavailable'
  | 'unexpected-failure'

export type OfficialEventsRuntimeErrorV1 = {
  code: OfficialEventsRuntimeErrorCodeV1
  message: string
}

type OfficialEventsRuntimeOperationBaseV1 = {
  runtimeVersion: typeof OFFICIAL_EVENTS_RUNTIME_V1_VERSION
  startedAt: string
  completedAt: string
}

export type OfficialEventsRuntimeOperationResultV1<T> =
  | (OfficialEventsRuntimeOperationBaseV1 & {
      status: 'succeeded'
      data: T
      error: null
    })
  | (OfficialEventsRuntimeOperationBaseV1 & {
      status: 'disabled' | 'authentication-required'
      data: null
      error: null
    })
  | (OfficialEventsRuntimeOperationBaseV1 & {
      status: 'not-ready' | 'unavailable' | 'failed'
      data: null
      error: OfficialEventsRuntimeErrorV1
    })

export type OfficialEventsRuntimeCapabilityReasonV1 =
  'available' | 'authentication-required' | 'disabled' | 'not-ready'

export type OfficialEventsRuntimeCapabilityV1 = {
  runtimeVersion: typeof OFFICIAL_EVENTS_RUNTIME_V1_VERSION
  mode: OfficialEventsRuntimeModeV1
  accessState: OfficialEventsRuntimeAccessStateV1 | null
  canRead: boolean
  reason: OfficialEventsRuntimeCapabilityReasonV1
}

export type OfficialEventsRuntimeV1 = {
  getCapability(): OfficialEventsRuntimeCapabilityV1
  getEventById(input: {
    eventId: string
  }): Promise<
    OfficialEventsRuntimeOperationResultV1<OfficialAssetEventV1 | null>
  >
  listTimeline(
    input: OfficialAssetEventReadQueryV1
  ): Promise<
    OfficialEventsRuntimeOperationResultV1<OfficialAssetEventReadPageV1>
  >
}

export type CreateOfficialEventsRuntimeV1Input =
  | {
      mode: 'disabled'
      now: OfficialEventsRuntimeClockV1
      repository?: never
      getAccessState?: never
    }
  | {
      mode: 'read-only'
      repository: OfficialAssetEventReadRepositoryV1
      getAccessState: OfficialEventsRuntimeAccessStateProviderV1
      now: OfficialEventsRuntimeClockV1
    }

export type CreateSupabaseOfficialEventsRuntimeV1Input =
  | {
      mode: 'disabled'
      now: OfficialEventsRuntimeClockV1
      client?: never
      getAccessState?: never
    }
  | {
      mode: 'read-only'
      client: OfficialAssetEventsReadRpcClientV1
      getAccessState: OfficialEventsRuntimeAccessStateProviderV1
      now: OfficialEventsRuntimeClockV1
    }

export class OfficialEventsRuntimeClockErrorV1 extends Error {
  readonly code: 'clock-invalid' | 'clock-regressed' | 'clock-unavailable'

  constructor(
    code: 'clock-invalid' | 'clock-regressed' | 'clock-unavailable',
    message: string
  ) {
    super(message)
    this.name = 'OfficialEventsRuntimeClockErrorV1'
    this.code = code
  }
}
