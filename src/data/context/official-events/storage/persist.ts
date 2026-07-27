import type { OfficialAssetEventV1 } from '../../../../domain/context/official-events'
import { prepareOfficialAssetEventStorageBatchV1 } from './batch'
import { buildWriteResult } from './internal'
import { assertOfficialAssetEventStorageWriteResultV1 } from './resultValidation'
import type {
  OfficialAssetEventStorageItemResultV1,
  OfficialAssetEventStorageV1,
  OfficialAssetEventStorageWriteResultV1,
} from './types'

export async function persistOfficialAssetEventsV1(input: {
  storage: OfficialAssetEventStorageV1
  events: readonly OfficialAssetEventV1[]
}): Promise<OfficialAssetEventStorageWriteResultV1> {
  const batch = prepareOfficialAssetEventStorageBatchV1(input.events)
  if (batch.uniqueRecords.length === 0) return buildWriteResult([])

  const adapterResult = await input.storage.upsertMany(batch.uniqueRecords)
  assertOfficialAssetEventStorageWriteResultV1(
    adapterResult,
    batch.uniqueRecords
  )
  const itemsByOriginalIndex = new Map<
    number,
    OfficialAssetEventStorageItemResultV1
  >()
  adapterResult.items.forEach((item, adapterIndex) => {
    const originalIndex = batch.uniqueInputIndexes[adapterIndex]
    itemsByOriginalIndex.set(originalIndex, {
      ...item,
      inputIndex: originalIndex,
    })
  })
  batch.duplicates.forEach((duplicate) => {
    const kept = itemsByOriginalIndex.get(duplicate.duplicateOfInputIndex)
    if (!kept)
      throw new Error('Prepared batch duplicate references a missing input')
    itemsByOriginalIndex.set(duplicate.inputIndex, {
      inputIndex: duplicate.inputIndex,
      eventId: duplicate.eventId,
      deduplicationKey: duplicate.deduplicationKey,
      disposition: kept.disposition === 'conflict' ? 'conflict' : 'unchanged',
      previousUpdatedAt: kept.previousUpdatedAt,
      storedUpdatedAt: kept.storedUpdatedAt,
      conflictReason: kept.conflictReason,
      duplicateOfInputIndex: duplicate.duplicateOfInputIndex,
    })
  })
  const ordered = input.events.map((_, index) => {
    const item = itemsByOriginalIndex.get(index)
    if (!item)
      throw new Error('Persistence result is missing an original input')
    return item
  })
  return buildWriteResult(ordered)
}
