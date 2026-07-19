import { assertOfficialAssetEventStorageRecordV1 } from './record'
import type {
  OfficialAssetEventStorageRecordV1,
  OfficialAssetEventStorageWriteResultV1,
} from './types'

const DISPOSITIONS = new Set([
  'inserted',
  'updated',
  'unchanged',
  'stale-ignored',
  'conflict',
])
const CONFLICT_REASONS = new Set([
  'event-id-collision',
  'deduplication-key-collision',
  'immutable-identity-change',
  'same-version-payload-divergence',
  'malformed-adapter-result',
])

export class MalformedOfficialAssetEventStorageResultError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MalformedOfficialAssetEventStorageResultError'
  }
}

function fail(message: string): never {
  throw new MalformedOfficialAssetEventStorageResultError(message)
}

function assertPlainResultTree(
  value: unknown,
  path: string,
  seen: WeakSet<object>
): void {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return
  }
  if (typeof value !== 'object' || seen.has(value))
    fail(`${path} must be an acyclic plain data tree`)
  seen.add(value)
  const prototype = Array.isArray(value) ? Array.prototype : Object.prototype
  if (Object.getPrototypeOf(value) !== prototype)
    fail(`${path} must use a plain prototype`)
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) fail(`${path} must not be sparse`)
    }
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === 'symbol') fail(`${path} must not contain symbol keys`)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !('value' in descriptor))
      fail(`${path}.${key} must be a plain data property`)
    if (key !== 'length')
      assertPlainResultTree(descriptor.value, `${path}.${key}`, seen)
  }
}

function assertCounter(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || Object.is(value, -0))
    fail(`${field} must be a non-negative safe integer other than -0`)
}

export function assertOfficialAssetEventStorageWriteResultV1(
  result: OfficialAssetEventStorageWriteResultV1,
  records: readonly OfficialAssetEventStorageRecordV1[]
): void {
  records.forEach(assertOfficialAssetEventStorageRecordV1)
  assertPlainResultTree(result, 'adapterResult', new WeakSet())
  if (Object.getPrototypeOf(result) !== Object.prototype)
    fail('Adapter result must be a plain object')
  const resultKeys = [
    'attempted',
    'inserted',
    'updated',
    'unchanged',
    'staleIgnored',
    'conflicts',
    'items',
  ]
  if (
    Object.keys(result).length !== resultKeys.length ||
    resultKeys.some((key) => !Object.hasOwn(result, key))
  )
    fail('Adapter result has unknown or missing fields')
  for (const field of resultKeys.slice(0, -1))
    assertCounter(result[field as keyof typeof result] as number, field)
  if (
    result.attempted !== records.length ||
    result.items.length !== records.length
  )
    fail('Adapter result must contain exactly one item per input')
  if (
    result.inserted +
      result.updated +
      result.unchanged +
      result.staleIgnored +
      result.conflicts !==
    result.attempted
  )
    fail('Adapter result counters are inconsistent')

  result.items.forEach((item, inputIndex) => {
    if (Object.getPrototypeOf(item) !== Object.prototype)
      fail('Adapter item must be a plain object')
    const keys = [
      'inputIndex',
      'eventId',
      'deduplicationKey',
      'disposition',
      'previousUpdatedAt',
      'storedUpdatedAt',
      'conflictReason',
      'duplicateOfInputIndex',
    ]
    if (
      Object.keys(item).length !== keys.length ||
      keys.some((key) => !Object.hasOwn(item, key))
    )
      fail('Adapter item has unknown or missing fields')
    if (
      !Number.isSafeInteger(item.inputIndex) ||
      Object.is(item.inputIndex, -0) ||
      item.inputIndex !== inputIndex
    )
      fail('Adapter item order or inputIndex is invalid')
    if (
      item.eventId !== records[inputIndex].eventId ||
      item.deduplicationKey !== records[inputIndex].deduplicationKey
    )
      fail('Adapter item identity diverges from input')
    if (!DISPOSITIONS.has(item.disposition))
      fail('Adapter item disposition is invalid')
    if (item.duplicateOfInputIndex !== null)
      fail('Adapter must not return facade duplicate metadata')
    const hasConflict = item.disposition === 'conflict'
    if (
      hasConflict !== (item.conflictReason !== null) ||
      (item.conflictReason !== null &&
        !CONFLICT_REASONS.has(item.conflictReason))
    )
      fail('Adapter conflict reason is invalid')
    if (
      item.storedUpdatedAt !== null &&
      typeof item.storedUpdatedAt !== 'string'
    )
      fail('storedUpdatedAt is invalid')
    if (
      item.previousUpdatedAt !== null &&
      typeof item.previousUpdatedAt !== 'string'
    )
      fail('previousUpdatedAt is invalid')
  })
  const expectedCounts = {
    inserted: result.items.filter((item) => item.disposition === 'inserted')
      .length,
    updated: result.items.filter((item) => item.disposition === 'updated')
      .length,
    unchanged: result.items.filter((item) => item.disposition === 'unchanged')
      .length,
    staleIgnored: result.items.filter(
      (item) => item.disposition === 'stale-ignored'
    ).length,
    conflicts: result.items.filter((item) => item.disposition === 'conflict')
      .length,
  }
  if (
    result.inserted !== expectedCounts.inserted ||
    result.updated !== expectedCounts.updated ||
    result.unchanged !== expectedCounts.unchanged ||
    result.staleIgnored !== expectedCounts.staleIgnored ||
    result.conflicts !== expectedCounts.conflicts
  ) {
    fail('Adapter result counters diverge from item dispositions')
  }
}
