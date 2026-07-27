import {
  assertOfficialAssetEventV1,
  type OfficialAssetEventV1,
} from '../../../../domain/context/official-events'
import {
  assertOfficialAssetEventStorageRecordV1,
  fromOfficialAssetEventStorageRecordV1,
  type OfficialAssetEventStorageRecordV1,
} from '../storage'
import {
  buildOfficialAssetEventReadQueryHashV1,
  decodeOfficialAssetEventReadCursorV1,
  encodeOfficialAssetEventReadCursorV1,
} from './cursor'
import {
  compareOfficialAssetEventReadSortKeysV1,
  compareOfficialAssetEventsForReadV1,
  getOfficialAssetEventReadSortKeyV1,
} from './ordering'
import {
  buildOfficialAssetEventReadPageV1,
  cloneOfficialAssetEventForReadV1,
  matchesOfficialAssetEventReadQueryV1,
} from './shared'
import type { OfficialAssetEventReadRepositoryV1 } from './types'
import {
  assertOfficialAssetEventIdV1,
  validateOfficialAssetEventReadQueryV1,
} from './validation'

type InMemoryOfficialAssetEventReadRepositoryInputV1 =
  | { events: readonly OfficialAssetEventV1[]; records?: never }
  | { records: readonly OfficialAssetEventStorageRecordV1[]; events?: never }

function readInitialEvents(
  input: InMemoryOfficialAssetEventReadRepositoryInputV1
): OfficialAssetEventV1[] {
  const values = input.events ?? input.records
  const rawEventIds = new Set<string>()
  const rawDeduplicationKeys = new Set<string>()
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index)) {
      throw new Error(
        'Official asset event read repository input must be dense'
      )
    }
    const value = values[index]
    if (typeof value.eventId === 'string') {
      if (rawEventIds.has(value.eventId)) {
        throw new Error('Duplicate eventId in read repository input')
      }
      rawEventIds.add(value.eventId)
    }
    if (typeof value.deduplicationKey === 'string') {
      if (rawDeduplicationKeys.has(value.deduplicationKey)) {
        throw new Error('Conflicting deduplicationKey in read repository input')
      }
      rawDeduplicationKeys.add(value.deduplicationKey)
    }
  }
  if (input.events !== undefined) {
    return input.events.map((event) => {
      assertOfficialAssetEventV1(event)
      return cloneOfficialAssetEventForReadV1(event)
    })
  }
  return input.records.map((record) => {
    assertOfficialAssetEventStorageRecordV1(record)
    return fromOfficialAssetEventStorageRecordV1(record)
  })
}

export function createInMemoryOfficialAssetEventReadRepositoryV1(
  input: InMemoryOfficialAssetEventReadRepositoryInputV1
): OfficialAssetEventReadRepositoryV1 {
  const events = readInitialEvents(input)
  const byEventId = new Map(events.map((event) => [event.eventId, event]))

  return {
    async getByEventId(eventId) {
      assertOfficialAssetEventIdV1(eventId)
      const event = byEventId.get(eventId)
      return event === undefined
        ? null
        : cloneOfficialAssetEventForReadV1(event)
    },
    async listPage(inputQuery) {
      const query = validateOfficialAssetEventReadQueryV1(inputQuery)
      const queryHash = buildOfficialAssetEventReadQueryHashV1(query)
      const cursor =
        query.cursor === null
          ? null
          : decodeOfficialAssetEventReadCursorV1({
              cursor: query.cursor,
              expectedQueryHash: queryHash,
            })
      const ordered = events
        .filter((event) => matchesOfficialAssetEventReadQueryV1(event, query))
        .filter(
          (event) =>
            cursor === null ||
            compareOfficialAssetEventReadSortKeysV1(
              getOfficialAssetEventReadSortKeyV1(event),
              cursor
            ) > 0
        )
        .sort(compareOfficialAssetEventsForReadV1)
      const hasMore = ordered.length > query.limit
      const items = ordered.slice(0, query.limit)
      const last = items.at(-1)
      const nextCursor =
        hasMore && last !== undefined
          ? encodeOfficialAssetEventReadCursorV1({
              queryHash,
              sortKey: getOfficialAssetEventReadSortKeyV1(last),
            })
          : null
      return buildOfficialAssetEventReadPageV1({
        items,
        limit: query.limit,
        hasMore,
        nextCursor,
      })
    },
  }
}
