import {
  cloneStorageRecord,
  buildWriteResult,
  getUtcTimestampOrder,
  haveSameData,
} from './internal'
import { assertOfficialAssetEventStorageRecordV1 } from './record'
import {
  OFFICIAL_ASSET_EVENT_STORAGE_V1_IMMUTABLE_FIELDS,
  type OfficialAssetEventStorageItemResultV1,
  type OfficialAssetEventStorageRecordV1,
  type OfficialAssetEventStorageV1,
} from './types'

export type InMemoryOfficialAssetEventStorageV1 =
  OfficialAssetEventStorageV1 & {
    getSnapshot(): OfficialAssetEventStorageRecordV1[]
  }

function immutableIdentityMatches(
  left: OfficialAssetEventStorageRecordV1,
  right: OfficialAssetEventStorageRecordV1
): boolean {
  return OFFICIAL_ASSET_EVENT_STORAGE_V1_IMMUTABLE_FIELDS.every((field) =>
    haveSameData(left[field], right[field])
  )
}

function payloadMatchesIgnoringInternalTimes(
  left: OfficialAssetEventStorageRecordV1,
  right: OfficialAssetEventStorageRecordV1
): boolean {
  return haveSameData(
    { ...left, ingestedAt: null, updatedAt: null },
    { ...right, ingestedAt: null, updatedAt: null }
  )
}

function item(
  inputIndex: number,
  incoming: OfficialAssetEventStorageRecordV1,
  disposition: OfficialAssetEventStorageItemResultV1['disposition'],
  previousUpdatedAt: string | null,
  storedUpdatedAt: string | null,
  conflictReason: OfficialAssetEventStorageItemResultV1['conflictReason'] = null
): OfficialAssetEventStorageItemResultV1 {
  return {
    inputIndex,
    eventId: incoming.eventId,
    deduplicationKey: incoming.deduplicationKey,
    disposition,
    previousUpdatedAt,
    storedUpdatedAt,
    conflictReason,
    duplicateOfInputIndex: null,
  }
}

export function createInMemoryOfficialAssetEventStorageV1(
  initialRecords: readonly OfficialAssetEventStorageRecordV1[] = []
): InMemoryOfficialAssetEventStorageV1 {
  let recordsByEventId = new Map<string, OfficialAssetEventStorageRecordV1>()
  let eventIdByDeduplicationKey = new Map<string, string>()

  initialRecords.forEach((record) => {
    assertOfficialAssetEventStorageRecordV1(record)
    if (
      recordsByEventId.has(record.eventId) ||
      eventIdByDeduplicationKey.has(record.deduplicationKey)
    ) {
      throw new Error(
        'Initial in-memory storage records must have unique identities'
      )
    }
    recordsByEventId.set(record.eventId, cloneStorageRecord(record))
    eventIdByDeduplicationKey.set(record.deduplicationKey, record.eventId)
  })

  return {
    async upsertMany(incomingRecords) {
      incomingRecords.forEach(assertOfficialAssetEventStorageRecordV1)
      const workingRecords = new Map(
        [...recordsByEventId].map(([key, value]) => [
          key,
          cloneStorageRecord(value),
        ])
      )
      const workingDeduplication = new Map(eventIdByDeduplicationKey)
      const results: OfficialAssetEventStorageItemResultV1[] = []

      incomingRecords.forEach((incoming, inputIndex) => {
        const byEventId = workingRecords.get(incoming.eventId)
        const eventIdForDeduplication = workingDeduplication.get(
          incoming.deduplicationKey
        )
        if (
          byEventId &&
          byEventId.deduplicationKey !== incoming.deduplicationKey
        ) {
          results.push(
            item(
              inputIndex,
              incoming,
              'conflict',
              byEventId.updatedAt,
              byEventId.updatedAt,
              'event-id-collision'
            )
          )
          return
        }
        if (
          eventIdForDeduplication &&
          eventIdForDeduplication !== incoming.eventId
        ) {
          const previous = workingRecords.get(eventIdForDeduplication)
          results.push(
            item(
              inputIndex,
              incoming,
              'conflict',
              previous?.updatedAt ?? null,
              previous?.updatedAt ?? null,
              'deduplication-key-collision'
            )
          )
          return
        }
        if (!byEventId) {
          workingRecords.set(incoming.eventId, cloneStorageRecord(incoming))
          workingDeduplication.set(incoming.deduplicationKey, incoming.eventId)
          results.push(
            item(inputIndex, incoming, 'inserted', null, incoming.updatedAt)
          )
          return
        }
        if (!immutableIdentityMatches(byEventId, incoming)) {
          results.push(
            item(
              inputIndex,
              incoming,
              'conflict',
              byEventId.updatedAt,
              byEventId.updatedAt,
              'immutable-identity-change'
            )
          )
          return
        }

        const incomingOrder = getUtcTimestampOrder(incoming.updatedAt)
        const storedOrder = getUtcTimestampOrder(byEventId.updatedAt)
        if (incomingOrder < storedOrder) {
          results.push(
            item(
              inputIndex,
              incoming,
              'stale-ignored',
              byEventId.updatedAt,
              byEventId.updatedAt
            )
          )
          return
        }
        if (incomingOrder === storedOrder) {
          if (haveSameData(byEventId, incoming)) {
            results.push(
              item(
                inputIndex,
                incoming,
                'unchanged',
                byEventId.updatedAt,
                byEventId.updatedAt
              )
            )
          } else {
            results.push(
              item(
                inputIndex,
                incoming,
                'conflict',
                byEventId.updatedAt,
                byEventId.updatedAt,
                'same-version-payload-divergence'
              )
            )
          }
          return
        }
        if (payloadMatchesIgnoringInternalTimes(byEventId, incoming)) {
          results.push(
            item(
              inputIndex,
              incoming,
              'unchanged',
              byEventId.updatedAt,
              byEventId.updatedAt
            )
          )
          return
        }

        const stored = cloneStorageRecord(incoming)
        if (
          getUtcTimestampOrder(byEventId.ingestedAt) <
          getUtcTimestampOrder(incoming.ingestedAt)
        ) {
          stored.ingestedAt = byEventId.ingestedAt
        }
        workingRecords.set(stored.eventId, stored)
        results.push(
          item(
            inputIndex,
            incoming,
            'updated',
            byEventId.updatedAt,
            stored.updatedAt
          )
        )
      })

      if (!results.some((result) => result.disposition === 'conflict')) {
        recordsByEventId = workingRecords
        eventIdByDeduplicationKey = workingDeduplication
      }
      return buildWriteResult(results)
    },
    getSnapshot() {
      return [...recordsByEventId.values()].map(cloneStorageRecord)
    },
  }
}
