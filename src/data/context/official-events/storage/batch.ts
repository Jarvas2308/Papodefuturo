import {
  deduplicateOfficialAssetEventsV1,
  type OfficialAssetEventV1,
} from '../../../../domain/context/official-events'
import { haveSameData } from './internal'
import { toOfficialAssetEventStorageRecordV1 } from './record'
import type {
  OfficialAssetEventStorageBatchDuplicateV1,
  PreparedOfficialAssetEventStorageBatchV1,
} from './types'

export type OfficialAssetEventStorageBatchConflictV1 = {
  deduplicationKey: string
  inputIndexes: number[]
  sourcePayloadHashes: string[]
}

export class OfficialAssetEventStorageBatchConflictError extends Error {
  readonly conflicts: OfficialAssetEventStorageBatchConflictV1[]

  constructor(conflicts: readonly OfficialAssetEventStorageBatchConflictV1[]) {
    super('Official asset event storage batch contains conflicting payloads')
    this.name = 'OfficialAssetEventStorageBatchConflictError'
    this.conflicts = conflicts.map((conflict) => ({
      ...conflict,
      inputIndexes: [...conflict.inputIndexes],
      sourcePayloadHashes: [...conflict.sourcePayloadHashes],
    }))
  }
}

export function prepareOfficialAssetEventStorageBatchV1(
  events: readonly OfficialAssetEventV1[]
): PreparedOfficialAssetEventStorageBatchV1 {
  const canonicalDeduplication = deduplicateOfficialAssetEventsV1(events)
  const records = events.map(toOfficialAssetEventStorageRecordV1)
  const firstByKey = new Map<string, number>()
  const uniqueRecords: PreparedOfficialAssetEventStorageBatchV1['uniqueRecords'] =
    []
  const uniqueInputIndexes: number[] = []
  const duplicates: OfficialAssetEventStorageBatchDuplicateV1[] = []
  const conflicts = new Map<string, OfficialAssetEventStorageBatchConflictV1>()

  records.forEach((record, inputIndex) => {
    const firstIndex = firstByKey.get(record.deduplicationKey)
    if (firstIndex === undefined) {
      firstByKey.set(record.deduplicationKey, inputIndex)
      uniqueRecords.push(record)
      uniqueInputIndexes.push(inputIndex)
      return
    }
    const first = records[firstIndex]
    if (haveSameData(first, record)) {
      duplicates.push({
        inputIndex,
        duplicateOfInputIndex: firstIndex,
        eventId: record.eventId,
        deduplicationKey: record.deduplicationKey,
      })
      return
    }
    const conflict = conflicts.get(record.deduplicationKey) ?? {
      deduplicationKey: record.deduplicationKey,
      inputIndexes: [firstIndex],
      sourcePayloadHashes: [first.sourcePayloadHash],
    }
    conflict.inputIndexes.push(inputIndex)
    if (!conflict.sourcePayloadHashes.includes(record.sourcePayloadHash)) {
      conflict.sourcePayloadHashes.push(record.sourcePayloadHash)
    }
    conflicts.set(record.deduplicationKey, conflict)
  })

  for (const conflict of canonicalDeduplication.conflicts) {
    if (!conflicts.has(conflict.deduplicationKey)) {
      conflicts.set(conflict.deduplicationKey, {
        deduplicationKey: conflict.deduplicationKey,
        inputIndexes: [...conflict.inputIndexes],
        sourcePayloadHashes: [...conflict.sourcePayloadHashes],
      })
    }
  }
  if (conflicts.size > 0) {
    throw new OfficialAssetEventStorageBatchConflictError([
      ...conflicts.values(),
    ])
  }

  return {
    attempted: events.length,
    uniqueRecords,
    uniqueInputIndexes,
    duplicates,
  }
}
