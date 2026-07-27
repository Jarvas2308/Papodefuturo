import type {
  OfficialAssetEventV1,
  OfficialEventAssetTickerV1,
  OfficialEventSourceV1,
  OfficialEventStatusV1,
  OfficialEventTypeV1,
} from '../../../../domain/context/official-events'

export const OFFICIAL_ASSET_EVENT_READ_REPOSITORY_V1_VERSION =
  'official-asset-event-read-repository.v1' as const

export const OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION =
  'official-asset-event-read-cursor.v1' as const

export const OFFICIAL_ASSET_EVENT_GET_RPC_V1 =
  'get_official_asset_event_by_id_v1' as const

export const OFFICIAL_ASSET_EVENT_LIST_RPC_V1 =
  'list_official_asset_events_v1' as const

export type OfficialAssetEventReadQueryV1 = {
  assetRegulatoryIdentityKeys?: string[]
  tickers?: OfficialEventAssetTickerV1[]
  sources?: OfficialEventSourceV1[]
  eventTypes?: OfficialEventTypeV1[]
  statuses?: OfficialEventStatusV1[]
  publishedFrom?: string
  publishedTo?: string
  limit: number
  cursor?: string | null
}

export type OfficialAssetEventReadPageV1 = {
  repositoryVersion: typeof OFFICIAL_ASSET_EVENT_READ_REPOSITORY_V1_VERSION
  items: OfficialAssetEventV1[]
  returned: number
  limit: number
  hasMore: boolean
  nextCursor: string | null
}

export type OfficialAssetEventReadRepositoryV1 = {
  getByEventId(eventId: string): Promise<OfficialAssetEventV1 | null>
  listPage(
    query: OfficialAssetEventReadQueryV1
  ): Promise<OfficialAssetEventReadPageV1>
}

export type OfficialAssetEventReadSortKeyV1 = {
  publishedCalendarDate: string
  publishedPrecisionRank: 0 | 1 | 2
  publishedInstantSortKey: string
  eventId: string
}

export type OfficialAssetEventReadCursorV1 = OfficialAssetEventReadSortKeyV1 & {
  cursorVersion: typeof OFFICIAL_ASSET_EVENT_READ_CURSOR_V1_VERSION
  queryHash: string
}

export type OfficialAssetEventReadRepositoryErrorKindV1 =
  | 'invalid-query'
  | 'invalid-cursor'
  | 'cursor-query-mismatch'
  | 'transport'
  | 'malformed-response'
  | 'contract-violation'

export type OfficialAssetEventReadRepositoryOperationV1 =
  'get-by-event-id' | 'list-page'

export class OfficialAssetEventReadRepositoryErrorV1 extends Error {
  readonly kind: OfficialAssetEventReadRepositoryErrorKindV1
  readonly code: string
  readonly operation: OfficialAssetEventReadRepositoryOperationV1
  readonly limit: number | null
  readonly itemCount: number | null
  readonly upstreamCode: string | null
  readonly upstreamStatus: number | null

  constructor(input: {
    kind: OfficialAssetEventReadRepositoryErrorKindV1
    message: string
    operation: OfficialAssetEventReadRepositoryOperationV1
    limit?: number | null
    itemCount?: number | null
    upstreamCode?: string | null
    upstreamStatus?: number | null
  }) {
    super(input.message)
    this.name = 'OfficialAssetEventReadRepositoryErrorV1'
    this.kind = input.kind
    this.code = `official-asset-events.${input.kind}`
    this.operation = input.operation
    this.limit = input.limit ?? null
    this.itemCount = input.itemCount ?? null
    this.upstreamCode = input.upstreamCode ?? null
    this.upstreamStatus = input.upstreamStatus ?? null
  }
}

export type OfficialAssetEventReadRpcQueryV1 = {
  asset_regulatory_identity_keys: string[] | null
  tickers: OfficialEventAssetTickerV1[] | null
  sources: OfficialEventSourceV1[] | null
  event_types: OfficialEventTypeV1[] | null
  statuses: OfficialEventStatusV1[] | null
  published_from: string | null
  published_to: string | null
  limit: number
  cursor: {
    published_calendar_date: string
    published_precision_rank: 0 | 1 | 2
    published_instant_sort_key: string
    event_id: string
  } | null
}

export type OfficialAssetEventsReadRpcClientV1 = {
  rpc(
    functionName:
      | typeof OFFICIAL_ASSET_EVENT_GET_RPC_V1
      | typeof OFFICIAL_ASSET_EVENT_LIST_RPC_V1,
    args:
      | { input_event_id: string }
      | { input_query: OfficialAssetEventReadRpcQueryV1 }
  ): PromiseLike<{ data: unknown; error: unknown }>
}
