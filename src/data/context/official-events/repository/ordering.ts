import type { OfficialAssetEventV1 } from '../../../../domain/context/official-events'
import type { OfficialAssetEventReadSortKeyV1 } from './types'

export function getOfficialAssetEventReadSortKeyV1(
  event: OfficialAssetEventV1
): OfficialAssetEventReadSortKeyV1 {
  const published = event.publishedAt
  if (published.precision === 'date') {
    return {
      publishedCalendarDate: published.date,
      publishedPrecisionRank: 0,
      publishedInstantSortKey: '',
      eventId: event.eventId,
    }
  }
  return {
    publishedCalendarDate: published.instantUtc.slice(0, 10),
    publishedPrecisionRank: published.precision === 'second' ? 2 : 1,
    publishedInstantSortKey: published.instantUtc,
    eventId: event.eventId,
  }
}

function compareDescending(
  left: string | number,
  right: string | number
): number {
  if (left === right) return 0
  return left > right ? -1 : 1
}

export function compareOfficialAssetEventReadSortKeysV1(
  left: OfficialAssetEventReadSortKeyV1,
  right: OfficialAssetEventReadSortKeyV1
): number {
  return (
    compareDescending(
      left.publishedCalendarDate,
      right.publishedCalendarDate
    ) ||
    compareDescending(
      left.publishedPrecisionRank,
      right.publishedPrecisionRank
    ) ||
    compareDescending(
      left.publishedInstantSortKey,
      right.publishedInstantSortKey
    ) ||
    compareDescending(left.eventId, right.eventId)
  )
}

export function compareOfficialAssetEventsForReadV1(
  left: OfficialAssetEventV1,
  right: OfficialAssetEventV1
): number {
  return compareOfficialAssetEventReadSortKeysV1(
    getOfficialAssetEventReadSortKeyV1(left),
    getOfficialAssetEventReadSortKeyV1(right)
  )
}
