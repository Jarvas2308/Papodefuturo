import type { OfficialAssetEventV1 } from '../../../../domain/context/official-events'
import {
  fromOfficialAssetEventStorageRecordV1,
  toOfficialAssetEventStorageRecordV1,
} from '../storage'
import {
  OFFICIAL_ASSET_EVENT_READ_REPOSITORY_V1_VERSION,
  type OfficialAssetEventReadPageV1,
  type OfficialAssetEventReadSortKeyV1,
} from './types'
import type { CanonicalOfficialAssetEventReadQueryV1 } from './validation'
import { getOfficialAssetEventReadSortKeyV1 } from './ordering'

export function cloneOfficialAssetEventForReadV1(
  event: OfficialAssetEventV1
): OfficialAssetEventV1 {
  return fromOfficialAssetEventStorageRecordV1(
    toOfficialAssetEventStorageRecordV1(event)
  )
}

export function matchesOfficialAssetEventReadQueryV1(
  event: OfficialAssetEventV1,
  query: CanonicalOfficialAssetEventReadQueryV1
): boolean {
  const key = getOfficialAssetEventReadSortKeyV1(event)
  return (
    (query.assetRegulatoryIdentityKeys === null ||
      query.assetRegulatoryIdentityKeys.includes(
        event.assetIdentity.regulatoryIdentityKey
      )) &&
    (query.tickers === null ||
      query.tickers.includes(event.assetIdentity.ticker)) &&
    (query.sources === null || query.sources.includes(event.source)) &&
    (query.eventTypes === null || query.eventTypes.includes(event.eventType)) &&
    (query.statuses === null || query.statuses.includes(event.status)) &&
    (query.publishedFrom === null ||
      key.publishedCalendarDate >= query.publishedFrom) &&
    (query.publishedTo === null ||
      key.publishedCalendarDate <= query.publishedTo)
  )
}

export function buildOfficialAssetEventReadPageV1(input: {
  items: readonly OfficialAssetEventV1[]
  limit: number
  hasMore: boolean
  nextCursor: string | null
}): OfficialAssetEventReadPageV1 {
  const items = input.items.map(cloneOfficialAssetEventForReadV1)
  return {
    repositoryVersion: OFFICIAL_ASSET_EVENT_READ_REPOSITORY_V1_VERSION,
    items,
    returned: items.length,
    limit: input.limit,
    hasMore: input.hasMore,
    nextCursor: input.nextCursor,
  }
}

export function haveSameOfficialAssetEventReadSortKeyV1(
  left: OfficialAssetEventReadSortKeyV1,
  right: OfficialAssetEventReadSortKeyV1
): boolean {
  return (
    left.publishedCalendarDate === right.publishedCalendarDate &&
    left.publishedPrecisionRank === right.publishedPrecisionRank &&
    left.publishedInstantSortKey === right.publishedInstantSortKey &&
    left.eventId === right.eventId
  )
}
