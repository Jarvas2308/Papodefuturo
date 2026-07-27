import type { OfficialEventsRuntimeV1 } from '../../application/context/official-events/runtime'
import type { OfficialEventsFiltersV1 } from './types'

export const OFFICIAL_EVENTS_PAGE_SIZE = 20

export type OfficialEventsTimelineQueryV1 = Parameters<
  OfficialEventsRuntimeV1['listTimeline']
>[0]

export function buildOfficialEventsTimelineQuery(
  filters: OfficialEventsFiltersV1,
  cursor: string | null
): OfficialEventsTimelineQueryV1 {
  return {
    ...(filters.tickers.length > 0 ? { tickers: [...filters.tickers] } : {}),
    ...(filters.sources.length > 0 ? { sources: [...filters.sources] } : {}),
    ...(filters.eventTypes.length > 0
      ? { eventTypes: [...filters.eventTypes] }
      : {}),
    ...(filters.statuses.length > 0 ? { statuses: [...filters.statuses] } : {}),
    ...(filters.publishedFrom === ''
      ? {}
      : { publishedFrom: filters.publishedFrom }),
    ...(filters.publishedTo === '' ? {} : { publishedTo: filters.publishedTo }),
    limit: OFFICIAL_EVENTS_PAGE_SIZE,
    cursor,
  }
}
