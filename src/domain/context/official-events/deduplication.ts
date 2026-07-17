import { assertOfficialAssetEventV1 } from './eventValidation'
import { cloneOfficialAssetEventV1 } from './internal'
import type {
  OfficialAssetEventV1,
  OfficialEventConflictV1,
  OfficialEventDeduplicationResultV1,
} from './types'

type SeenEvent = {
  inputIndex: number
  event: OfficialAssetEventV1
}

export function deduplicateOfficialAssetEventsV1(
  events: readonly OfficialAssetEventV1[]
): OfficialEventDeduplicationResultV1 {
  const seen = new Map<string, SeenEvent>()
  const conflictByKey = new Map<string, OfficialEventConflictV1>()
  const uniqueEvents: OfficialAssetEventV1[] = []
  const duplicates: OfficialEventDeduplicationResultV1['duplicates'] = []

  events.forEach((event, inputIndex) => {
    assertOfficialAssetEventV1(event)
    const kept = seen.get(event.deduplicationKey)
    if (!kept) {
      seen.set(event.deduplicationKey, { inputIndex, event })
      uniqueEvents.push(cloneOfficialAssetEventV1(event))
      return
    }

    if (
      kept.event.provenance.sourcePayloadHash ===
      event.provenance.sourcePayloadHash
    ) {
      duplicates.push({
        deduplicationKey: event.deduplicationKey,
        keptInputIndex: kept.inputIndex,
        duplicateInputIndex: inputIndex,
      })
      return
    }

    const existingConflict = conflictByKey.get(event.deduplicationKey)
    if (existingConflict) {
      existingConflict.inputIndexes.push(inputIndex)
      if (
        !existingConflict.sourcePayloadHashes.includes(
          event.provenance.sourcePayloadHash
        )
      ) {
        existingConflict.sourcePayloadHashes.push(
          event.provenance.sourcePayloadHash
        )
      }
      return
    }
    conflictByKey.set(event.deduplicationKey, {
      deduplicationKey: event.deduplicationKey,
      inputIndexes: [kept.inputIndex, inputIndex],
      sourcePayloadHashes: [
        kept.event.provenance.sourcePayloadHash,
        event.provenance.sourcePayloadHash,
      ],
    })
  })

  return {
    uniqueEvents,
    duplicates: duplicates.map((duplicate) => ({ ...duplicate })),
    conflicts: [...conflictByKey.values()].map((conflict) => ({
      ...conflict,
      inputIndexes: [...conflict.inputIndexes],
      sourcePayloadHashes: [...conflict.sourcePayloadHashes],
    })),
  }
}
