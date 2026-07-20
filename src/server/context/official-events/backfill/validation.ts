import { getUtcTimestampOrder } from '../validation'
import type {
  OfficialEventsBackfillJobErrorSummaryV1,
  OfficialEventsBackfillJobResultSummaryV1,
} from './types'

export function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  name: string
): void {
  const keys = Object.keys(value)
  if (
    keys.length !== expected.length ||
    !keys.every((key) => expected.includes(key))
  )
    throw new Error(`${name} contains unsupported fields`)
}

export function assertSafeCounter(value: unknown, name: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    Object.is(value, -0)
  )
    throw new Error(`${name} must be a non-negative safe integer`)
  return value
}

export function assertUnpaddedText(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value)
    throw new Error(`${name} must be non-empty and unpadded`)
  return value
}

export function assertCanonicalUtc(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new Error(`${name} must be a string`)
  try {
    getUtcTimestampOrder(value)
  } catch {
    throw new Error(`${name} must be a canonical UTC timestamp`)
  }
  return value
}

export function assertDenseArray(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`)
  for (let index = 0; index < value.length; index += 1)
    if (!(index in value)) throw new Error(`${name} must be dense`)
  return value
}

export function addSecondsPreservingPrecision(
  timestamp: string,
  secondsToAdd: number
): string {
  assertCanonicalUtc(timestamp, 'now')
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.[0-9]{1,9})?Z$/.exec(
    timestamp
  )
  if (!match) throw new Error('now must be a canonical UTC timestamp')
  const milliseconds = Date.parse(`${match[1]}Z`) + secondsToAdd * 1_000
  return `${new Date(milliseconds).toISOString().slice(0, 19)}${match[2] ?? ''}Z`
}

export function assertWorkerId(value: unknown): string {
  const workerId = assertUnpaddedText(value, 'workerId')
  if (workerId.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(workerId))
    throw new Error('workerId contains unsupported characters')
  return workerId
}

export function assertLeaseDuration(value: unknown): number {
  const duration = assertSafeCounter(value, 'leaseDurationSeconds')
  if (duration < 30 || duration > 3_600)
    throw new Error('leaseDurationSeconds must be between 30 and 3600')
  return duration
}

export function assertResultSummary(
  value: OfficialEventsBackfillJobResultSummaryV1
): void {
  assertExactKeys(
    value,
    ['fetchedEventCount', 'persistedAttemptCount', 'rejectedItemCount'],
    'result summary'
  )
  assertSafeCounter(value.fetchedEventCount, 'fetchedEventCount')
  assertSafeCounter(value.persistedAttemptCount, 'persistedAttemptCount')
  assertSafeCounter(value.rejectedItemCount, 'rejectedItemCount')
}

export function assertErrorSummary(
  value: OfficialEventsBackfillJobErrorSummaryV1
): void {
  assertExactKeys(value, ['category', 'code', 'message'], 'error summary')
  assertUnpaddedText(value.category, 'error category')
  assertUnpaddedText(value.code, 'error code')
  assertUnpaddedText(value.message, 'error message')
}
