import type { OfficialEventsRuntimeV1 } from '../../application/context/official-events/runtime'
import type {
  OfficialAssetEventV1,
  OfficialEventAssetTickerV1,
  OfficialEventSourceV1,
  OfficialEventStatusV1,
  OfficialEventTypeV1,
} from '../../domain/context/official-events'

export type OfficialEventsUiDependenciesV1 = {
  runtime: OfficialEventsRuntimeV1
}

export type OfficialEventsFiltersV1 = {
  tickers: OfficialEventAssetTickerV1[]
  sources: OfficialEventSourceV1[]
  eventTypes: OfficialEventTypeV1[]
  statuses: OfficialEventStatusV1[]
  publishedFrom: string
  publishedTo: string
}

export type OfficialEventsTimelineStatusV1 =
  | 'idle'
  | 'loading'
  | 'disabled'
  | 'authentication-required'
  | 'not-ready'
  | 'unavailable'
  | 'failed'
  | 'succeeded'

export type OfficialEventsTimelineStateV1 = {
  status: OfficialEventsTimelineStatusV1
  items: OfficialAssetEventV1[]
  nextCursor: string | null
  isLoadingMore: boolean
  loadMoreFailure: 'unavailable' | 'failed' | null
}

export type OfficialEventDetailsStatusV1 =
  | 'closed'
  | 'loading'
  | 'disabled'
  | 'authentication-required'
  | 'not-ready'
  | 'unavailable'
  | 'failed'
  | 'not-found'
  | 'succeeded'

export type OfficialEventDetailsStateV1 = {
  status: OfficialEventDetailsStatusV1
  event: OfficialAssetEventV1 | null
  previousStatus: 'idle' | 'loading' | 'not-found' | 'failed' | 'succeeded'
  previousEvent: OfficialAssetEventV1 | null
}
