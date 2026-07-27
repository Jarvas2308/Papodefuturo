import type {
  OfficialAssetEventStorageItemResultV1,
  OfficialAssetEventStorageRecordV1,
  OfficialAssetEventStorageWriteResultV1,
} from './types'

export function cloneStorageRecord(
  record: OfficialAssetEventStorageRecordV1
): OfficialAssetEventStorageRecordV1 {
  return {
    ...record,
    associationEvidence: record.associationEvidence.map((item) => ({
      ...item,
    })),
    relatedDocuments: record.relatedDocuments.map((item) => ({ ...item })),
    provenanceRawFields: { ...record.provenanceRawFields },
  }
}

export function haveSameData(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (
    left === null ||
    right === null ||
    typeof left !== 'object' ||
    typeof right !== 'object' ||
    Array.isArray(left) !== Array.isArray(right)
  )
    return false
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  return leftKeys.every(
    (key) =>
      Object.hasOwn(right, key) &&
      haveSameData(
        Object.getOwnPropertyDescriptor(left, key)?.value,
        Object.getOwnPropertyDescriptor(right, key)?.value
      )
  )
}

export function getUtcTimestampOrder(value: string): bigint {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/.exec(
    value
  )
  if (!match) throw new Error('Expected a validated UTC timestamp')
  const seconds = Date.parse(`${match[1]}Z`) / 1_000
  return (
    BigInt(seconds) * 1_000_000_000n +
    BigInt((match[2] ?? '').padEnd(9, '0') || '0')
  )
}

export function buildWriteResult(
  items: readonly OfficialAssetEventStorageItemResultV1[]
): OfficialAssetEventStorageWriteResultV1 {
  return {
    attempted: items.length,
    inserted: items.filter((item) => item.disposition === 'inserted').length,
    updated: items.filter((item) => item.disposition === 'updated').length,
    unchanged: items.filter((item) => item.disposition === 'unchanged').length,
    staleIgnored: items.filter((item) => item.disposition === 'stale-ignored')
      .length,
    conflicts: items.filter((item) => item.disposition === 'conflict').length,
    items: items.map((item) => ({ ...item })),
  }
}
